(function(s, u) {
  function b(e) {
    var d;
    const r = e.closest(".table--wrapper"), o = r.querySelector(".table--inner");
    if (!r || !o)
      return;
    r.classList.add("table--sticky");
    const c = e.cloneNode(!0), a = c.querySelector("tbody");
    a && (a.innerHTML = "");
    const t = document.createElement("div");
    t.setAttribute("aria-hidden", "true"), t.classList.add("table--header"), t.appendChild(c), (d = o.parentNode) == null || d.insertBefore(t, o), i();
    const f = (n) => {
      const l = n.target;
      t && (t.scrollLeft = l.scrollLeft);
    };
    o.addEventListener("scroll", f);
    function i() {
      const n = e.querySelectorAll("th"), l = c.querySelectorAll("th");
      n.forEach((p, h) => {
        if (h < l.length) {
          const v = p.getBoundingClientRect().width;
          l[h].style.width = `${v}px`;
        }
      }), c.style.width = `${e.getBoundingClientRect().width}px`;
    }
    const y = new ResizeObserver(() => {
      i();
    });
    e.querySelectorAll("th").forEach((n) => {
      y.observe(n);
    });
  }
  s.behaviors.neoBaseTableHeader = {}, s.behaviors.neoBaseTableHeader.attach = (e) => {
    u("neoBase.tableheader", ".sticky-header", e).forEach((r) => {
      b(r);
    });
  };
})(Drupal, once);
//# sourceMappingURL=tableheader.js.map
