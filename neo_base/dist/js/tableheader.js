(function(a, b) {
  function f(e) {
    var u;
    const r = e.closest(".table--wrapper"), s = r.querySelector(".table--inner");
    if (!r || !s)
      return;
    r.classList.add("table--sticky");
    const c = e.cloneNode(!0), i = c.querySelector("tbody");
    i && (i.innerHTML = "");
    const t = document.createElement("div");
    t.setAttribute("aria-hidden", "true"), t.classList.add("table--header"), t.appendChild(c), (u = s.parentNode) == null || u.insertBefore(t, s), d();
    const p = (n) => {
      const o = n.target;
      t && (t.scrollLeft = o.scrollLeft);
    };
    s.addEventListener("scroll", p);
    function d() {
      const n = e.querySelectorAll("th"), o = c.querySelectorAll("th");
      n.forEach((v, l) => {
        if (l < o.length) {
          const y = v.getBoundingClientRect().width;
          o[l].style.width = `${y}px`, o[l].style.minWidth = `${y}px`;
        }
      }), c.style.width = `${e.getBoundingClientRect().width}px`;
    }
    const h = new ResizeObserver(() => {
      d();
    });
    e.querySelectorAll("th").forEach((n) => {
      h.observe(n);
    }), h.observe(e);
  }
  a.behaviors.neoBaseTableHeader = {}, a.behaviors.neoBaseTableHeader.attach = (e) => {
    b("neoBase.tableheader", ".sticky-header", e).forEach((r) => {
      f(r);
    });
  };
})(Drupal, once);
//# sourceMappingURL=tableheader.js.map
