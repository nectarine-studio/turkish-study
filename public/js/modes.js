"use strict";
// Study modes: Flashcards (spaced repetition), Learn (progressive), Quiz, Sentences.

function scopeOptions() {
  const opts = [["due", "Due and new"], ["weak", "Needs work"], ["all", "All cards, shuffled"]];
  themeList().forEach(t => opts.push(["theme:" + t.id, "Theme: " + t.name]));
  return opts;
}
function scopeCards(scope) {
  const p = pool();
  if (scope === "all") return shuffle(p);
  if (scope === "weak") return p.filter(c => Store.status(c) === "weak" || (Store.isDue(c) && Store.status(c) !== "strong")).sort((a, b) => Store.need(b) - Store.need(a));
  if (scope.startsWith("theme:")) { const t = themeList().find(x => x.id === scope.slice(6)); return t ? shuffle(t.cards) : []; }
  return Store.dueQueue(p);
}
function selectEl(options, value, onchange) {
  return h("select", { onchange: e => onchange(e.target.value) }, options.map(([v, l]) => h("option", { value: v, selected: v === value }, l)));
}

// ---------- Flashcards ----------
VIEWS.flash = {
  render(root, params) {
    let scope = params.scope || "due", dir = "tr", queue = [], i = 0, flipped = false, tally = { again: 0, good: 0, easy: 0 };
    const stage = h("div", { class: "fc-wrap" });
    const bar = h("div", { class: "bar" },
      selectEl(scopeOptions(), scope, v => { scope = v; start(); }),
      selectEl([["tr", "Turkish first"], ["en", "English first"]], dir, v => { dir = v; draw(); }),
      h("button", { onclick: start }, "Restart"));
    root.append(bar, stage);
    function start() { queue = scopeCards(scope); i = 0; flipped = false; tally = { again: 0, good: 0, easy: 0 }; draw(); }
    function flip() { flipped = !flipped; draw(); }
    function rate(r) {
      if (!flipped) return;
      const c = queue[i];
      Store.record(c, r !== "again"); Store.grade(c, r); tally[r]++;
      if (r === "again") queue.splice(Math.min(queue.length, i + 4), 0, c);
      i++; flipped = false; renderStats(); draw();
    }
    function draw() {
      stage.innerHTML = "";
      if (!queue.length) {
        stage.append(h("div", { class: "empty-state" }, h("h2", {}, "Nothing here yet"), h("p", {}, scope === "due" ? "No cards are due and every card has been started." : "No cards match this choice."),
          h("button", { class: "primary", onclick: () => { scope = "all"; root.querySelector("select").value = "all"; start(); } }, "Practise all cards")));
        return;
      }
      if (i >= queue.length) {
        stage.append(h("div", { class: "empty-state" }, h("h2", {}, "Session complete"),
          h("p", {}, `Again ${tally.again} · Good ${tally.good} · Easy ${tally.easy}`),
          h("button", { class: "primary", onclick: start }, "Go again"), " ", h("button", { onclick: () => go("map") }, "See the mind map")));
        return;
      }
      const c = queue[i];
      const termSide = h("div", { class: "big-term" }, c.t);
      const defSide = h("div", { class: "big-def" }, c.d);
      const front = dir === "tr" ? [termSide] : [imgBox(c, "img tall"), defSide];
      const back = dir === "tr" ? [imgBox(c, "img tall"), defSide] : [termSide];
      const card = h("div", { class: "fc" + (flipped ? " back" : ""), onclick: flip }, flipped ? back : front,
        h("div", { class: "fc-hint" }, flipped ? "" : "Click or press space to flip"));
      stage.append(h("div", { class: "meta" }, h("span", {}, `Card ${i + 1} of ${queue.length}`), h("span", {}, setName(c) + " · " + (THEMES[themeOf(c)] ? THEMES[themeOf(c)].name : ""))), card);
      if (flipped) {
        const pv = Store.preview(c);
        stage.append(h("div", { class: "grades" },
          h("button", { class: "g-again", onclick: () => rate("again") }, h("b", {}, "Again"), h("span", {}, pv.again + " · key 1")),
          h("button", { class: "g-good", onclick: () => rate("good") }, h("b", {}, "Good"), h("span", {}, pv.good + " · key 2")),
          h("button", { class: "g-easy", onclick: () => rate("easy") }, h("b", {}, "Easy"), h("span", {}, pv.easy + " · key 3"))));
      }
    }
    keyHandler = e => {
      if (e.target.matches("input,textarea,select")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (queue.length && i < queue.length) flip(); }
      else if (e.key === "1") rate("again"); else if (e.key === "2") rate("good"); else if (e.key === "3") rate("easy");
    };
    start();
  }
};

// ---------- Learn ----------
const STAGE_INFO = {
  1: ["Match", "Which Turkish word matches this meaning?"],
  2: ["Recognise", "What does this word mean?"],
  3: ["Type the word", "Type the Turkish word for this meaning."],
  4: ["Type the meaning", "Type the meaning in English."]
};
const ACCENTS = ["ç", "ğ", "ı", "ö", "ş", "ü", "İ", "â"];

VIEWS.learn = {
  render(root, params) {
    let scope = "smart";
    function setup() {
      root.innerHTML = "";
      const opts = [["smart", "Smart set: 8 words that need work"], ["twelve", "12 random words"]];
      themeList().forEach(t => opts.push(["theme:" + t.id, "Theme: " + t.name]));
      root.append(h("div", { class: "setup" },
        h("h2", {}, "Learn"),
        h("p", { class: "sub" }, "Each word moves through four steps: match it, recognise it, type the Turkish word, then type the meaning. A wrong answer sends the word back a step."),
        h("div", { class: "bar" }, selectEl(opts, scope, v => { scope = v; }), h("button", { class: "primary", onclick: () => begin() }, "Start")),
        h("ol", { class: "steps" }, [1, 2, 3, 4].map(n => h("li", {}, h("b", {}, STAGE_INFO[n][0]), ": " + STAGE_INFO[n][1])))));
    }
    function pick() {
      const p = pool();
      if (scope === "twelve") return shuffle(p).slice(0, 12);
      if (scope.startsWith("theme:")) { const t = themeList().find(x => x.id === scope.slice(6)); return t ? Store.smartSet(t.cards, 10) : []; }
      return Store.smartSet(p, 8);
    }
    function begin() { const l = pick(); if (!l.length) { toast("No cards to practise."); return; } run(l); }
    function run(list) {
      const items = list.map(c => ({ c, stage: 1, max: isLong(c) ? 2 : 4, errors: 0, done: false }));
      const total = items.reduce((a, x) => a + x.max, 0);
      let last = null, cur = null, locked = false, awaitingContinue = false;
      const wrap = h("div", { class: "learn" });
      root.innerHTML = ""; root.append(wrap);
      const progress = () => items.reduce((a, x) => a + (x.done ? x.max : x.stage - 1), 0) / total;
      function next() {
        awaitingContinue = false; locked = false;
        const open = items.filter(x => !x.done);
        if (!open.length) return finish();
        let cand = open.filter(x => x !== last); if (!cand.length) cand = open;
        cur = cand[Math.floor(Math.random() * cand.length)]; last = cur; ask();
      }
      function answer(ok) {
        Store.record(cur.c, ok);
        if (ok) { cur.stage++; if (cur.stage > cur.max) cur.done = true; }
        else { cur.errors++; cur.stage = Math.max(1, cur.stage - 1); }
      }
      function mcOptions(field) {
        const c = cur.c;
        const p = pool().filter(x => x.id !== c.id && x.t !== c.t && x.d !== c.d);
        const same = shuffle(p.filter(x => themeOf(x) === themeOf(c))), other = shuffle(p.filter(x => themeOf(x) !== themeOf(c)));
        const seen = new Set([c[field]]), picks = [];
        for (const x of [...same.slice(0, 2), ...other, ...same.slice(2)]) { if (picks.length >= 3) break; if (!seen.has(x[field])) { seen.add(x[field]); picks.push(x); } }
        return shuffle([c, ...picks]);
      }
      function banner(kind, text, extra) {
        const b = h("div", { class: "banner " + kind }, h("b", {}, text), extra ? h("div", {}, extra) : null);
        return b;
      }
      function continueBtn() {
        awaitingContinue = true;
        return h("button", { class: "primary", onclick: next }, "Continue (Enter)");
      }
      function ask() {
        const c = cur.c, st = cur.stage;
        wrap.innerHTML = "";
        wrap.append(
          h("div", { class: "meta" }, h("span", {}, `Step ${st} of ${cur.max}: ${STAGE_INFO[st][0]}`), h("button", { class: "small", onclick: setup }, "Exit")),
          h("div", { class: "prog" }, h("i", { style: `width:${Math.round(progress() * 100)}%` })));
        const card = h("div", { class: "qcard" });
        const showDef = st === 1 || st === 3;
        if (showDef && imageFor(c)) card.append(imgBox(c, "img tall"));
        card.append(h("div", { class: "qprompt" }, STAGE_INFO[st][1]), h("div", { class: "qterm" }, showDef ? c.d : c.t));
        const body = h("div", { class: "opts" });
        card.append(body);
        wrap.append(card);
        if (st <= 2) {
          const field = st === 1 ? "t" : "d";
          mcOptions(field).forEach(o => {
            const b = h("button", { class: "opt", onclick: () => {
              if (locked) return; locked = true;
              const ok = o.id === c.id; answer(ok);
              b.classList.add(ok ? "ok" : "bad");
              if (!ok) [...body.children].forEach((x, k) => { if (x.dataset.id === c.id) x.classList.add("ok"); });
              if (ok) later(next, 650); else body.append(continueBtn());
            } }, o[field]);
            b.dataset.id = o.id; body.append(b);
          });
        } else {
          const input = h("input", { type: "text", class: "typed", placeholder: st === 3 ? "Turkish word" : "English meaning", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
          const row = h("div", { class: "typed-row" }, input);
          const submit = h("button", { class: "primary", onclick: () => grade(input.value) }, "Check");
          const idk = h("button", { onclick: () => grade("", true) }, "I don't know");
          body.append(row);
          if (st === 3) body.append(h("div", { class: "accents" }, ACCENTS.map(a => h("button", { class: "small", onclick: () => { input.value += a; input.focus(); } }, a))));
          body.append(h("div", { class: "typed-actions" }, submit, idk));
          input.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); grade(input.value); } };
          setTimeout(() => input.focus(), 30);
          function grade(val, skip) {
            if (locked) return; locked = true;
            let ok, note = null;
            if (st === 3) { const r = skip ? "wrong" : checkTerm(c, val); ok = r !== "wrong"; if (r === "accent") note = `Mind the accents. The spelling is ${c.t}.`; }
            else ok = !skip && checkMeaning(c, val);
            answer(ok);
            input.disabled = true; submit.disabled = true; idk.disabled = true;
            const correct = st === 3 ? c.t : c.d;
            if (ok && !note) { body.append(banner("ok", "Correct")); later(next, 800); }
            else if (ok) { body.append(banner("ok", "Correct", note), continueBtn()); }
            else body.append(banner("bad", "Not quite", "Answer: " + correct), continueBtn());
          }
        }
      }
      function finish() {
        items.forEach(x => Store.grade(x.c, x.errors === 0 ? "good" : "again"));
        renderStats(); keyHandler = null;
        wrap.innerHTML = "";
        const clean = items.filter(x => x.errors === 0).length;
        wrap.append(h("div", { class: "qcard" }, h("div", { class: "qterm" }, `Round complete: ${clean} of ${items.length} without a mistake`),
          h("ul", { class: "summary" }, items.map(x => h("li", { class: x.errors ? "bad" : "ok" }, h("b", {}, x.c.t), ` ${x.c.d}`, h("span", {}, x.errors ? `${x.errors} mistake${x.errors > 1 ? "s" : ""}, back in 10 minutes` : "scheduled for later")))),
          h("div", { class: "typed-actions" }, h("button", { class: "primary", onclick: begin }, "Next round"), h("button", { onclick: setup }, "Back to setup"), h("button", { onclick: () => go("map") }, "Mind map"))));
      }
      keyHandler = e => { if (e.key === "Enter" && awaitingContinue) { e.preventDefault(); next(); } };
      next();
    }
    if (params.cards && params.cards.length) run(params.cards);
    else if (params.theme) { scope = "theme:" + params.theme; begin(); }
    else setup();
  }
};

// ---------- Quiz ----------
VIEWS.quiz = {
  render(root) {
    let order = [], i = 0, score = 0, locked = false;
    const wrap = h("div", { class: "quiz" });
    root.append(wrap);
    function start() { order = shuffle(pool()).slice(0, 20); i = 0; score = 0; draw(); }
    function draw() {
      wrap.innerHTML = "";
      if (i >= order.length) {
        wrap.append(h("div", { class: "qcard" }, h("div", { class: "qterm" }, `Done: ${score} / ${order.length}`), h("div", { class: "opts" }, h("button", { class: "primary", onclick: start }, "Play again"))));
        return;
      }
      const c = order[i]; locked = false;
      const p = pool().filter(x => x.id !== c.id && x.d !== c.d && x.t !== c.t);
      const opts = []; const seen = new Set([c.d]);
      for (const x of shuffle(p)) { if (opts.length >= 3) break; if (!seen.has(x.d)) { seen.add(x.d); opts.push(x); } }
      const all = shuffle([c, ...opts]);
      const card = h("div", { class: "qcard" });
      if (imageFor(c)) card.append(imgBox(c, "img tall"));
      card.append(h("div", { class: "qterm" }, c.t));
      const body = h("div", { class: "opts" });
      all.forEach(o => {
        const b = h("button", { class: "opt", onclick: () => {
          if (locked) return; locked = true;
          const ok = o.id === c.id; if (ok) score++;
          Store.record(c, ok); Store.grade(c, ok ? "good" : "again"); renderStats();
          b.classList.add(ok ? "ok" : "bad");
          if (!ok) [...body.children].forEach(x => { if (x.dataset.id === c.id) x.classList.add("ok"); });
          body.append(h("button", { class: "primary", onclick: () => { i++; draw(); } }, i + 1 >= order.length ? "Finish" : "Next"));
        } }, o.d);
        b.dataset.id = o.id; body.append(b);
      });
      card.append(body);
      wrap.append(h("div", { class: "meta" }, h("span", {}, `Question ${i + 1} of ${order.length}`), h("span", {}, "Score " + score)), card);
    }
    start();
  }
};

// ---------- Sentences ----------
const plainEn = s => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function wordMatch(vw, tw) {
  if (vw === tw) return true;
  if (vw.length <= 3) return false;
  return tw.startsWith(vw.slice(0, Math.max(3, vw.length - 2)));
}
function meaningHit(c, text) {
  const tw = plainEn(text).split(" ").filter(Boolean);
  return meaningVariants(c).some(v => { const vws = v.split(" "); return vws.every(vw => tw.some(t => wordMatch(vw, t))); });
}

VIEWS.sent = {
  render(root) {
    const p = new Set(pool().map(c => c.id));
    const list = SENTENCES.map(s => ({ ...s, cards: s.w.map(n => BY_ID["s122:" + n]).filter(Boolean) })).filter(s => s.cards.some(c => p.has(c.id)));
    if (!list.length) {
      root.append(h("div", { class: "empty-state" }, h("h2", {}, "No sentences for this selection"), h("p", {}, "Example sentences are written for Set 122 so far. Switch to All sets or Set 122 above.")));
      return;
    }
    const order = list.map(s => ({ s, k: s.cards.reduce((a, c) => a + Store.need(c), 0) / s.cards.length + Math.random() * 0.25 })).sort((a, b) => b.k - a.k).map(x => x.s);
    let i = 0;
    const wrap = h("div", { class: "quiz" }); root.append(wrap);
    function draw() {
      wrap.innerHTML = "";
      if (i >= order.length) {
        wrap.append(h("div", { class: "empty-state" }, h("h2", {}, "All sentences done"), h("button", { class: "primary", onclick: () => { i = 0; draw(); } }, "Start over")));
        return;
      }
      const s = order[i];
      const chips = h("div", { class: "chips hidden" });
      s.cards.forEach(c => {
        const chip = h("button", { class: "chip", onclick: () => { chip.textContent = chip.dataset.open ? c.t : c.t + " = " + c.d; chip.dataset.open = chip.dataset.open ? "" : "1"; } }, c.t);
        chips.append(chip);
      });
      const area = h("textarea", { placeholder: "Type your English translation", rows: "3" });
      const out = h("div", {});
      const checkBtn = h("button", { class: "primary", onclick: check }, "Check");
      const hintBtn = h("button", { onclick: () => { chips.classList.toggle("hidden"); } }, "Word hints");
      wrap.append(
        h("div", { class: "meta" }, h("span", {}, `Sentence ${i + 1} of ${order.length}`), h("button", { class: "small", onclick: () => { i++; draw(); } }, "Skip")),
        h("div", { class: "qcard" }, h("div", { class: "qprompt" }, "Translate into English"), h("div", { class: "qterm" }, s.tr),
          h("div", { class: "opts" }, chips, area, h("div", { class: "typed-actions" }, checkBtn, hintBtn), out)));
      area.focus();
      function check() {
        if (!area.value.trim()) { toast("Type a translation first."); return; }
        checkBtn.disabled = true; area.disabled = true;
        const hits = s.cards.map(c => ({ c, ok: meaningHit(c, area.value) }));
        out.append(
          h("div", { class: "banner neutral" }, h("b", {}, "Reference translation"), h("div", {}, s.en)),
          h("div", { class: "note" }, "Words from your list found in your translation (a rough check, wording can differ):"),
          h("div", { class: "chips" }, hits.map(x => h("span", { class: "chip static " + (x.ok ? "ok" : "bad") }, `${x.c.t}: ${x.c.d.split(/[;\/]/)[0]}`))),
          h("div", { class: "note" }, "How did it go?"),
          h("div", { class: "grades" },
            h("button", { class: "g-good", onclick: () => rate("got") }, h("b", {}, "Got it"), h("span", {}, "all words good")),
            h("button", { class: "g-easy", onclick: () => rate("part") }, h("b", {}, "Partly"), h("span", {}, "found words good, others again")),
            h("button", { class: "g-again", onclick: () => rate("miss") }, h("b", {}, "Missed it"), h("span", {}, "all words again"))));
        function rate(r) {
          hits.forEach(x => { const ok = r === "got" || (r === "part" && x.ok); Store.record(x.c, ok); Store.grade(x.c, ok ? "good" : "again"); });
          renderStats(); i++; draw();
        }
      }
    }
    draw();
  }
};
