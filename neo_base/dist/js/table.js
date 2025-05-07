(function(r, t) {
  function a(s) {
    const e = s.closest(".table--wrapper");
    if (!e)
      return;
    const o = e.clientWidth < s.clientWidth;
    e.classList.toggle("table--overflow", o);
  }
  r.behaviors.neoBaseTable = {}, r.behaviors.neoBaseTable.attach = (s) => {
    t("neoBase.table", "table", s).forEach((e) => {
      new ResizeObserver((n) => {
        a(e);
      }).observe(e);
    });
  };
})(Drupal, once);
//# sourceMappingURL=table.js.map
