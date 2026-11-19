"use strict";
// Core: helpers, card state, router, browse view, image handling (photos, pasted URLs, AI).
const $ = s => document.querySelector(s);
function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "style") e.style.cssText = v;
    else if (k.startsWith("on")) e[k] = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fold = s => s.toLocaleLowerCase("tr").replace(/[ıİ]/g, "i").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u").replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 3200);
}

// ---------- cards ----------
const ALL_CARDS = RAW.map(([set, n, t, d, p]) => ({ id: set + ":" + n, set, n, t, d, photo: p ? PHOTOS[p] : null, legacy: t + "|" + d }));
const BY_ID = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]));
const THEME_OF = {};
for (const [tid, t] of Object.entries(THEMES)) t.cards.forEach(id => { THEME_OF[id] = tid; });
let imported = null;      // cards from a pasted Quizlet export, or null
let activeSet = "all";    // "all" | a set id
function pool() {
  if (imported) return imported;
  return activeSet === "all" ? ALL_CARDS : ALL_CARDS.filter(c => c.set === activeSet);
}
function deckLabel() {
  if (imported) return "Imported cards";
  return activeSet === "all" ? "All sets" : SETS.find(s => s.id === activeSet).name;
}
function themeOf(c) { return imported ? "imported" : (THEME_OF[c.id] || "link"); }
function themeList() {
  const p = new Set(pool().map(c => c.id));
  if (imported) return [{ id: "imported", name: "Imported cards", color: "#6f7a86", cards: imported }];
  return Object.entries(THEMES).map(([id, t]) => ({ id, name: t.name, color: t.color, cards: t.cards.filter(x => p.has(x)).map(x => BY_ID[x]) })).filter(t => t.cards.length);
}
function setName(c) { const s = SETS.find(x => x.id === c.set); return s ? s.name : "Imported"; }
function isLong(c) { return c.t.length > 20 || c.d.length > 45; }

// ---------- answers ----------
function normEn(s) {
  return s.toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim().replace(/^(to|a|an|the) /, "");
}
function meaningVariants(c) {
  const out = new Set();
  c.d.split(/[,;\/]/).forEach(x => { const n = normEn(x); if (n) out.add(n); });
  const full = normEn(c.d); if (full) out.add(full);
  return [...out];
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function checkMeaning(c, input) {
  const n = normEn(input); if (!n) return false;
  return meaningVariants(c).some(v => v === n || lev(n, v) <= (v.length >= 8 ? 2 : v.length >= 5 ? 1 : 0));
}
function termVariants(c) {
  const out = new Set();
  const base = c.t.replace(/\(.*?\)/g, "").trim();
  [base, ...base.split(/[\/;,]/)].forEach(x => { x = x.trim(); if (x) { out.add(x); out.add(x.replace(/^-/, "")); } });
  const m = c.t.match(/\((.*?)\)/); if (m) out.add(m[1].trim());
  return [...out];
}
function checkTerm(c, input) {
  const inp = input.trim().toLocaleLowerCase("tr").replace(/^-/, "");
  if (!inp) return "wrong";
  const vs = termVariants(c).map(x => x.toLocaleLowerCase("tr"));
  if (vs.includes(inp)) return "exact";
  if (vs.map(fold).includes(fold(inp))) return "accent";
  return "wrong";
}

// ---------- images ----------
let userUrls = {};
try { userUrls = JSON.parse(localStorage.getItem("imgs") || "{}"); } catch (e) {}
const saveUrls = () => { try { localStorage.setItem("imgs", JSON.stringify(userUrls)); } catch (e) {} };
function imageFor(c) {
  const u = userUrls[c.id] || userUrls[c.legacy];
  if (u) return { src: u, kind: "user" };
  if (Images.mem[c.id]) return { src: Images.mem[c.id], kind: "ai" };
  if (c.photo) return { src: `https://images.unsplash.com/photo-${c.photo.id}?auto=format&fit=crop&w=800&h=500&q=75`, kind: "photo", p: c.photo };
  return null;
}
function imgBox(c, cls) {
  const im = imageFor(c);
  const d = h("div", { class: (cls || "img") + (im ? "" : " empty") });
  if (!im) { d.textContent = "No image yet"; return d; }
  d.style.backgroundImage = `url("${im.src}")`;
  if (im.kind === "photo") {
    d.append(h("a", { class: "credit", target: "_blank", rel: "noopener", href: `https://unsplash.com/photos/${im.p.s}?utm_source=turkish_study&utm_medium=referral`, onclick: e => e.stopPropagation() }, "Photo: " + im.p.by + " / Unsplash"));
  } else if (im.kind === "ai") d.append(h("span", { class: "credit" }, "AI image"));
  return d;
}
function aiPrompt(c) {
  const meaning = c.d.split(/[;\/]/)[0].trim();
  return `Flat vector illustration with soft colors on a plain light background, one clear subject, no text, no letters, no captions. Show the idea of: ${meaning}.`;
}
async function generateImage(c) {
  let res;
  try {
    res = await fetch("/api/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: aiPrompt(c) }) });
  } catch (e) { throw new Error("AI images only work on the deployed site, not from a local file."); }
  if (!res.ok) { let m = ""; try { m = (await res.json()).error; } catch (e) {} throw new Error(m || "Image request failed (" + res.status + ")"); }
  const { image } = await res.json();
  if (!image) throw new Error("The image service returned nothing.");
  await Images.put(c.id, "data:image/jpeg;base64," + image);
}

// ---------- router ----------
const VIEWS = {};
const TABS = [["browse", "Browse"], ["flash", "Flashcards"], ["learn", "Learn"], ["quiz", "Quiz"], ["sent", "Sentences"], ["map", "Mind map"]];
let current = null, cleanups = [], keyHandler = null, refreshBrowse = null;
const onLeave = fn => cleanups.push(fn);
function later(fn, ms) { const id = setTimeout(fn, ms); onLeave(() => clearTimeout(id)); return id; }
document.addEventListener("keydown", e => { if (keyHandler) keyHandler(e); });
function go(name, params = {}) {
  cleanups.forEach(f => { try { f(); } catch (e) {} });
  cleanups = []; keyHandler = null; refreshBrowse = null;
  current = name;
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
  const root = $("#view"); root.innerHTML = "";
  VIEWS[name].render(root, params);
  renderStats();
}
function renderStats() {
  const cs = pool(); let due = 0, nw = 0, weak = 0, strong = 0;
  cs.forEach(c => { const st = Store.status(c); if (st === "new") nw++; if (st === "weak") weak++; if (st === "strong") strong++; if (Store.isDue(c)) due++; });
  const stat = (label, v, cls) => h("div", { class: "stat " + (cls || "") }, h("b", {}, v), h("span", {}, label));
  $("#stats").replaceChildren(stat("Due now", due, due ? "hot" : ""), stat("New", nw), stat("Needs work", weak, weak ? "hot" : ""), stat("Strong", strong + " / " + cs.length));
  $("#deckname").textContent = deckLabel() + " · " + cs.length + " cards";
}
function renderSetChips() {
  const opts = [["all", "All sets"], ...SETS.map(s => [s.id, s.name])];
  $("#setchips").replaceChildren(...opts.map(([id, label]) => h("button", { class: !imported && activeSet === id ? "on" : "", onclick: () => { imported = null; activeSet = id; renderSetChips(); go(current || "browse"); } }, label)));
}

// ---------- browse ----------
VIEWS.browse = {
  render(root) {
    let q = "", onlyImg = false, noImg = false, bulkRunning = false, bulkStop = false;
    const flipped = new Set();
    const search = h("input", { type: "search", placeholder: "Search terms or definitions", oninput: e => { q = e.target.value.trim().toLowerCase(); draw(); } });
    const onlyBtn = h("button", { onclick: e => { onlyImg = !onlyImg; if (onlyImg) noImg = false; sync(); draw(); } }, "With images");
    const noBtn = h("button", { onclick: () => { noImg = !noImg; if (noImg) onlyImg = false; sync(); draw(); } }, "Without images");
    const aiAll = h("button", { class: "primary", onclick: bulkAI }, "AI images for the rest");
    const info = h("span", { class: "note" });
    const grid = h("div", { class: "grid" });
    root.append(h("div", { class: "bar" }, search, onlyBtn, noBtn, aiAll), info, grid);
    function sync() { onlyBtn.classList.toggle("on", onlyImg); noBtn.classList.toggle("on", noImg); }
    function visible() {
      return pool().filter(c => (!q || c.t.toLowerCase().includes(q) || c.d.toLowerCase().includes(q)) && (!onlyImg || imageFor(c)) && (!noImg || !imageFor(c)));
    }
    async function bulkAI() {
      if (bulkRunning) { bulkStop = true; aiAll.textContent = "Stopping..."; return; }
      const todo = pool().filter(c => !imageFor(c));
      if (!todo.length) { toast("Every card in this view already has an image."); return; }
      if (!confirm(`Generate ${todo.length} AI images? Each one uses a little of your Cloudflare Workers AI allowance.`)) return;
      bulkRunning = true; bulkStop = false; aiAll.textContent = "Stop";
      let done = 0;
      for (const c of todo) {
        if (bulkStop || current !== "browse") break;
        info.textContent = `Generating ${done + 1} of ${todo.length}: ${c.t}`;
        try { await generateImage(c); done++; } catch (e) { toast(e.message); break; }
      }
      bulkRunning = false;
      if (current === "browse") { aiAll.textContent = "AI images for the rest"; draw(); toast(`${done} image${done === 1 ? "" : "s"} generated.`); }
    }
    function cardEl(c) {
      const el = h("div", { class: "card" + (flipped.has(c.id) ? " flip" : "") });
      const front = h("div", { class: "face" });
      const box = imgBox(c); box.append(h("span", { class: "num" }, c.n));
      const tools = h("div", { class: "tools" });
      const hasAi = !!Images.mem[c.id];
      const aiBtn = h("button", { onclick: async e => {
        e.stopPropagation(); aiBtn.textContent = "Working..."; aiBtn.disabled = true;
        try { await generateImage(c); draw(); } catch (err) { toast(err.message); aiBtn.textContent = hasAi ? "Regenerate" : "AI image"; aiBtn.disabled = false; }
      } }, hasAi ? "Regenerate" : "AI image");
      tools.append(
        h("a", { class: "btn", target: "_blank", rel: "noopener", href: "https://unsplash.com/s/photos/" + encodeURIComponent(c.d.split(/[,;\/]/)[0].trim()), onclick: e => e.stopPropagation() }, "Find photo"),
        h("button", { onclick: e => { e.stopPropagation(); const u = prompt("Paste an image URL for this card (leave empty to remove):"); if (u === null) return; if (u.trim()) userUrls[c.id] = u.trim(); else { delete userUrls[c.id]; delete userUrls[c.legacy]; } saveUrls(); draw(); } }, "Set URL"),
        aiBtn);
      if (Images.mem[c.id] || userUrls[c.id]) tools.append(h("button", { onclick: async e => { e.stopPropagation(); delete userUrls[c.id]; saveUrls(); await Images.del(c.id); draw(); } }, "Remove image"));
      front.append(box, h("div", { class: "term" }, c.t), h("div", { class: "setname" }, setName(c)), tools);
      const back = h("div", { class: "face back" }, h("div", { class: "def" }, c.d));
      el.append(h("div", { class: "inner" }, front, back));
      el.onclick = () => { el.classList.toggle("flip"); flipped.has(c.id) ? flipped.delete(c.id) : flipped.add(c.id); };
      return el;
    }
    function draw() {
      grid.innerHTML = "";
      const list = visible();
      const withImg = pool().filter(imageFor).length;
      if (!bulkRunning) info.textContent = `${pool().length} cards · ${withImg} with images · showing ${list.length}`;
      list.forEach(c => grid.append(cardEl(c)));
    }
    refreshBrowse = draw;
    draw();
  }
};
