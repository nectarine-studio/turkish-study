"use strict";
// Spaced repetition progress (localStorage) and generated images (IndexedDB).
const MIN = 60000, DAY = 86400000;
const INTERVALS = [10 * MIN, DAY, 2 * DAY, 4 * DAY, 8 * DAY, 16 * DAY];
function fmtInterval(ms) {
  if (ms < 60 * MIN) return Math.round(ms / MIN) + " min";
  const d = Math.round(ms / DAY);
  return d + (d === 1 ? " day" : " days");
}

const Store = {
  p: {},
  load() { try { this.p = JSON.parse(localStorage.getItem("ts_progress_v2") || "{}") || {}; } catch (e) { this.p = {}; } },
  save() { try { localStorage.setItem("ts_progress_v2", JSON.stringify(this.p)); } catch (e) {} },
  get(c) { return this.p[c.id] || null; },
  ensure(c) {
    if (!this.p[c.id]) this.p[c.id] = { box: 0, due: null, seen: 0, right: 0, wrong: 0, lapses: 0, graded: false, last: null };
    return this.p[c.id];
  },
  // Cards from a set with a seed start as already studied, unless the person has progress on them.
  applySeeds(cards) {
    let changed = false;
    cards.forEach(c => {
      const set = SETS.find(s => s.id === c.set);
      if (!set || !set.seed || this.p[c.id]) return;
      const spread = ((c.n * 7) % 8) + 1;
      this.p[c.id] = { box: set.seed.box, due: Date.now() + spread * DAY, seen: 3, right: 3, wrong: 0, lapses: 0, graded: true, last: null, seeded: true };
      changed = true;
    });
    if (changed) this.save();
  },
  record(c, ok) {
    const s = this.ensure(c);
    s.seen++;
    if (ok) s.right++; else s.wrong++;
    s.last = Date.now();
    this.save();
  },
  grade(c, rating) {
    const s = this.ensure(c);
    const base = s.graded ? s.box : 0;
    if (rating === "again") { s.box = 0; s.lapses++; }
    else if (rating === "good") s.box = Math.min(5, base + 1);
    else s.box = Math.min(5, base + 2);
    s.graded = true;
    s.seeded = false;
    s.due = Date.now() + INTERVALS[s.box];
    this.save();
  },
  preview(c) {
    const s = this.get(c);
    const base = s && s.graded ? s.box : 0;
    return { again: fmtInterval(INTERVALS[0]), good: fmtInterval(INTERVALS[Math.min(5, base + 1)]), easy: fmtInterval(INTERVALS[Math.min(5, base + 2)]) };
  },
  isDue(c) { const s = this.get(c); return !!(s && s.graded && s.due <= Date.now()); },
  accuracy(s) { return s.right / Math.max(1, s.right + s.wrong); },
  status(c) {
    const s = this.get(c);
    if (!s || (!s.graded && s.seen === 0)) return "new";
    if (s.graded && (s.box === 0 || (s.seen >= 3 && this.accuracy(s) < 0.5))) return "weak";
    if (s.box >= 4) return "strong";
    return "learning";
  },
  strength(c) {
    const s = this.get(c);
    if (!s || (!s.graded && s.seen === 0)) return null;
    let v = 0.6 * (s.box / 5) + 0.4 * this.accuracy(s);
    if (this.isDue(c)) v *= 0.85;
    return v;
  },
  need(c) {
    const v = this.strength(c);
    if (v === null) return 0.5;
    return (1 - v) + (this.isDue(c) ? 0.2 : 0);
  },
  dueQueue(cards, newLimit = 10) {
    const due = cards.filter(c => this.isDue(c)).sort((a, b) => this.get(a).due - this.get(b).due);
    const fresh = cards.filter(c => this.status(c) === "new").slice(0, newLimit);
    return [...due, ...fresh];
  },
  smartSet(cards, n = 8) {
    return cards.map(c => ({ c, s: this.need(c) + Math.random() * 0.15 })).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.c);
  },
  reset() { this.p = {}; this.save(); }
};

const Images = {
  db: null,
  mem: {},
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open("ts_images", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("img");
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  loadAll() {
    return new Promise(res => {
      if (!this.db) return res();
      try {
        const rq = this.db.transaction("img").objectStore("img").openCursor();
        rq.onsuccess = () => { const cur = rq.result; if (cur) { this.mem[cur.key] = cur.value; cur.continue(); } else res(); };
        rq.onerror = () => res();
      } catch (e) { res(); }
    });
  },
  put(k, v) {
    this.mem[k] = v;
    return new Promise(res => {
      if (!this.db) return res();
      try { const tx = this.db.transaction("img", "readwrite"); tx.objectStore("img").put(v, k); tx.oncomplete = tx.onerror = () => res(); } catch (e) { res(); }
    });
  },
  del(k) {
    delete this.mem[k];
    return new Promise(res => {
      if (!this.db) return res();
      try { const tx = this.db.transaction("img", "readwrite"); tx.objectStore("img").delete(k); tx.oncomplete = tx.onerror = () => res(); } catch (e) { res(); }
    });
  }
};
