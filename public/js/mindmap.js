"use strict";
// Mind map: cards grouped into themes, colored by how well each word is known.

const SVGNS = "http://www.w3.org/2000/svg";
function sv(tag, attrs, ...kids) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
  for (const kid of kids.flat()) if (kid != null) e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return e;
}
const STATUS_COLOR = { new: "#cfc9bd", weak: "#e0533d", learning: "#e5a93a", strong: "#3aa17a" };
const STATUS_LABEL = { new: "Not started", weak: "Needs work", learning: "Learning", strong: "Strong" };

function themeStats(list) {
  let seen = 0, sum = 0, due = 0, weak = 0, strong = 0, learning = 0;
  list.forEach(c => {
    const st = Store.status(c);
    if (st !== "new") { seen++; sum += Store.strength(c); }
    if (Store.isDue(c)) due++;
    if (st === "weak") weak++; else if (st === "strong") strong++; else if (st === "learning") learning++;
  });
  return { n: list.length, seen, avg: seen ? sum / seen : null, due, weak, strong, learning, fresh: list.length - seen };
}

function clusterLayout(n) {
  const out = [];
  if (n <= 14) {
    const r = 62;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a, r, big: true }); }
    return out;
  }
  let ring = 0, r = 62, placed = 0;
  while (placed < n) {
    const cap = Math.floor((Math.PI * 2 * r) / 15.5), take = Math.min(cap, n - placed);
    for (let i = 0; i < take; i++) { const a = (i / take) * Math.PI * 2 - Math.PI / 2 + ring * 0.35; out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, a, r, big: false }); }
    placed += take; ring++; r += 16;
  }
  return out;
}

VIEWS.map = {
  render(root) {
    const themes = themeList();
    const stats = themes.map(t => ({ t, s: themeStats(t.cards) }));
    const ranked = stats.filter(x => x.s.seen > 0).map(x => ({ ...x, score: (1 - x.s.avg) * 0.7 + (x.s.due / x.s.n) * 0.3 + (x.s.weak / x.s.n) * 0.2 })).sort((a, b) => b.score - a.score);
    const focus = new Set(ranked.filter(x => x.score > 0.3).slice(0, 2).map(x => x.t.id));
    let selected = null;

    const legend = h("div", { class: "legend" },
      ...Object.keys(STATUS_COLOR).map(k => h("span", {}, h("i", { style: `background:${STATUS_COLOR[k]}` }), STATUS_LABEL[k])),
      h("span", {}, h("i", { class: "dash" }), "Due for review"),
      h("span", {}, h("i", { class: "focus" }), "Focus theme"));
    const detail = h("div", { class: "mm-detail" });
    const panels = h("div", { class: "mm-panels" });
    const svg = sv("svg", { viewBox: "0 0 1200 820", class: "mm", role: "img", "aria-label": "Mind map of vocabulary themes" });
    root.append(h("p", { class: "sub" }, "Colors follow your answers in Flashcards, Learn, Quiz and Sentences. Click a theme or a word for details."), legend, h("div", { class: "mm-box" }, svg), detail, panels);

    const CX = 600, CY = 410, RX = 470, RY = 300;
    const order = ["link", "people", "move", "hard", "shop", "daily", "things", "good", "talk", "feelings", "weather", "imported"];
    const sorted = themes.slice().sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    svg.append(sv("circle", { cx: CX, cy: CY, r: 34, fill: "#1d1b19" }), sv("text", { x: CX, y: CY + 4, "text-anchor": "middle", fill: "#fff", "font-size": 11, "font-weight": 700 }, deckLabel().length > 14 ? "My words" : deckLabel()));
    const labelG = sv("g", { style: "pointer-events:none", visibility: "hidden" });
    const labelBg = sv("rect", { rx: 5, fill: "#1d1b19" }), labelTx = sv("text", { "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: "#fff" });
    labelG.append(labelBg, labelTx);
    function showLabel(x, y, text) {
      const w = text.length * 7 + 18, cx = Math.max(w / 2 + 4, Math.min(1200 - w / 2 - 4, x));
      labelTx.textContent = text; labelTx.setAttribute("x", cx); labelTx.setAttribute("y", y - 18);
      labelBg.setAttribute("x", cx - w / 2); labelBg.setAttribute("y", y - 33); labelBg.setAttribute("width", w); labelBg.setAttribute("height", 21);
      labelG.setAttribute("visibility", "visible");
    }
    function restoreLabel() {
      if (selected && selected.type === "word" && selected.pos) showLabel(selected.pos.x, selected.pos.y, selected.c.t);
      else labelG.setAttribute("visibility", "hidden");
    }
    const nodeLayer = sv("g", {}), lineLayer = sv("g", {});
    svg.prepend(lineLayer); svg.append(nodeLayer, labelG);

    sorted.forEach((t, ti) => {
      const ang = (-90 + (ti * 360) / sorted.length) * Math.PI / 180;
      const tx = CX + (sorted.length === 1 ? 0 : RX * Math.cos(ang)), ty = CY + (sorted.length === 1 ? 0 : RY * Math.sin(ang));
      lineLayer.append(sv("line", { x1: CX, y1: CY, x2: tx, y2: ty, stroke: "#d9d2c5", "stroke-width": 2 }));
      const pos = clusterLayout(t.cards.length);
      t.cards.forEach((c, i) => {
        const p = pos[i], x = tx + p.x, y = ty + p.y, st = Store.status(c);
        const r = p.big ? 9 : 6.5;
        lineLayer.append(sv("line", { x1: tx, y1: ty, x2: x, y2: y, stroke: "#e6e0d6", "stroke-width": 1 }));
        const g = sv("g", { class: "node", tabindex: 0 });
        g.append(sv("title", {}, `${c.t}: ${c.d} (${STATUS_LABEL[st]})`));
        if (Store.isDue(c)) g.append(sv("circle", { cx: x, cy: y, r: r + 3.5, fill: "none", stroke: "#1d1b19", "stroke-width": 1.2, "stroke-dasharray": "2 2" }));
        g.append(sv("circle", { cx: x, cy: y, r, fill: STATUS_COLOR[st], stroke: "#fff", "stroke-width": 1.5, class: "dot" }));
        const pick = () => { selected = { type: "word", c, pos: { x, y } }; renderDetail(); restoreLabel(); };
        g.onclick = pick; g.onkeydown = e => { if (e.key === "Enter") pick(); };
        g.onmouseenter = () => showLabel(x, y, c.t); g.onmouseleave = restoreLabel; g.onfocus = () => showLabel(x, y, c.t); g.onblur = restoreLabel;
        nodeLayer.append(g);
      });
      const tg = sv("g", { class: "node" });
      const isFocus = focus.has(t.id);
      tg.append(sv("circle", { cx: tx, cy: ty, r: 42, fill: "#fff", stroke: isFocus ? "#e0533d" : t.color, "stroke-width": isFocus ? 6 : 4 }));
      const words = t.name.split(" "); const lines = []; let line = "";
      words.forEach(w => { if ((line + " " + w).trim().length > 12 && line) { lines.push(line); line = w; } else line = (line + " " + w).trim(); });
      if (line) lines.push(line);
      lines.forEach((l, k) => tg.append(sv("text", { x: tx, y: ty + 4 + (k - (lines.length - 1) / 2) * 12, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: "#1d1b19" }, l)));
      if (isFocus) {
        tg.append(sv("rect", { x: tx - 24, y: ty - 62, width: 48, height: 16, rx: 4, fill: "#e0533d" }), sv("text", { x: tx, y: ty - 50, "text-anchor": "middle", "font-size": 10, "font-weight": 700, fill: "#fff" }, "Focus"));
      }
      tg.append(sv("title", {}, `${t.name}: ${t.cards.length} words`));
      tg.onclick = () => { selected = { type: "theme", t }; renderDetail(); restoreLabel(); };
      nodeLayer.append(tg);
    });

    function launchRow(cards, themeId) {
      return h("div", { class: "typed-actions" },
        h("button", { class: "primary", onclick: () => go("learn", { cards: cards.length > 10 ? Store.smartSet(cards, 10) : cards }) }, "Learn these"),
        themeId ? h("button", { onclick: () => go("flash", { scope: "theme:" + themeId }) }, "Flashcards") : null);
    }
    function renderDetail() {
      detail.innerHTML = "";
      if (!selected) { detail.append(h("p", { class: "note" }, "Nothing selected yet.")); return; }
      if (selected.type === "word") {
        const c = selected.c, s = Store.get(c), st = Store.status(c);
        detail.append(h("div", { class: "dcard" }, h("div", { class: "dterm" }, c.t), h("div", {}, c.d),
          h("div", { class: "note" }, `${STATUS_LABEL[st]} · ${setName(c)}` + (s && s.seen ? ` · answered ${s.right} right, ${s.wrong} wrong` : "") + (s && s.graded ? ` · next review ${Store.isDue(c) ? "now" : "in " + fmtInterval(Math.max(0, s.due - Date.now()))}` : "")),
          launchRow([c])));
      } else {
        const t = selected.t, s = themeStats(t.cards);
        detail.append(h("div", { class: "dcard" }, h("div", { class: "dterm" }, t.name),
          h("div", { class: "note" }, `${s.n} words · ${s.strong} strong · ${s.learning} learning · ${s.weak} need work · ${s.fresh} not started · ${s.due} due`),
          launchRow(t.cards, t.id)));
      }
    }

    function barFor(s) {
      const seg = (n, color) => n ? h("i", { style: `width:${(n / s.n) * 100}%;background:${color}` }) : null;
      return h("div", { class: "mixbar" }, seg(s.strong, STATUS_COLOR.strong), seg(s.learning, STATUS_COLOR.learning), seg(s.weak, STATUS_COLOR.weak), seg(s.fresh, STATUS_COLOR.new));
    }
    const order2 = stats.slice().sort((a, b) => {
      const fa = focus.has(a.t.id) ? 0 : a.s.seen ? 1 : 2, fb = focus.has(b.t.id) ? 0 : b.s.seen ? 1 : 2;
      if (fa !== fb) return fa - fb;
      return (a.s.avg ?? 1) - (b.s.avg ?? 1);
    });
    const themeRows = order2.map(x => h("div", { class: "row" },
      h("div", { class: "rname" }, h("b", {}, x.t.name), focus.has(x.t.id) ? h("span", { class: "tag" }, "Study this") : x.s.seen ? null : h("span", { class: "tag mute" }, "Not started")),
      barFor(x.s),
      h("div", { class: "note" }, `${x.s.seen} of ${x.s.n} started` + (x.s.due ? ` · ${x.s.due} due` : "") + (x.s.weak ? ` · ${x.s.weak} need work` : "")),
      h("div", { class: "typed-actions" }, h("button", { class: "small", onclick: () => go("learn", { theme: x.t.id }) }, "Learn"), h("button", { class: "small", onclick: () => go("flash", { scope: "theme:" + x.t.id }) }, "Flashcards"))));
    const seenWords = pool().filter(c => Store.status(c) !== "new").sort((a, b) => Store.need(b) - Store.need(a)).slice(0, 8);
    const wordRows = seenWords.length ? seenWords.map(c => h("div", { class: "wrow", onclick: () => { selected = { type: "word", c }; renderDetail(); } },
      h("i", { style: `background:${STATUS_COLOR[Store.status(c)]}` }), h("b", {}, c.t), h("span", {}, c.d.split(/[;\/]/)[0]))) : [h("p", { class: "note" }, "Answer a few cards in Flashcards or Learn and your weakest words will show up here.")];
    panels.append(
      h("div", { class: "panel" }, h("h3", {}, "Themes to study"), ...themeRows),
      h("div", { class: "panel" }, h("h3", {}, "Words to revisit"), ...wordRows,
        seenWords.length ? h("div", { class: "typed-actions" }, h("button", { class: "primary", onclick: () => go("learn", { cards: seenWords }) }, "Practise these")) : null));
    renderDetail();
  }
};
