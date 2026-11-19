"use strict";
// Boot: load saved progress and images, build tabs, wire the import box.
(async function boot() {
  Store.load();
  Store.applySeeds(ALL_CARDS);
  await Images.open();
  await Images.loadAll();
  $("#tabs").replaceChildren(...TABS.map(([id, label]) => h("button", { "data-tab": id, onclick: () => go(id) }, label)));
  renderSetChips();
  $("#imp-go").onclick = () => {
    const rows = $("#imp").value.split(/\r?\n/).map(l => l.split("\t")).filter(r => r.length >= 2 && r[0].trim() && r[1].trim());
    if (!rows.length) { toast("No tab-separated rows found. Export from Quizlet with the default separators."); return; }
    imported = rows.map((r, i) => ({ id: "imp:" + r[0].trim() + "|" + r[1].trim(), set: "imp", n: i + 1, t: r[0].trim(), d: r[1].trim(), photo: null, legacy: r[0].trim() + "|" + r[1].trim() }));
    renderSetChips(); go("browse");
  };
  $("#imp-reset").onclick = () => { imported = null; renderSetChips(); go("browse"); };
  $("#progress-reset").onclick = () => {
    if (!confirm("Reset all study progress? Images are kept. The Elif words go back to their starting status.")) return;
    Store.reset(); Store.applySeeds(ALL_CARDS); go(current || "browse"); toast("Progress reset.");
  };
  go("browse");
})();
