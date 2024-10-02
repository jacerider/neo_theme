((a, e, h, u) => {
  let n = -1, t;
  const f = (o) => {
    n !== (e == null ? void 0 : e.offsets.top) && (n = (e == null ? void 0 : e.offsets.top) ?? 0, t && t.unobserve(o), t = new IntersectionObserver((r) => {
      r.forEach((s) => {
        const i = s.target;
        i.classList.toggle("is-active", s.intersectionRatio < 1), s.intersectionRatio < 1 ? document.documentElement.style.setProperty("--neo-header-top", i.offsetHeight + "px") : document.documentElement.style.removeProperty("--neo-header-top");
      });
    }, {
      rootMargin: "-" + (n + 1) + "px 0px 0px 0px",
      threshold: [1]
    }), t.observe(o));
  };
  a.behaviors.neoBack = {
    attach: function(o) {
      const r = u("region--header", ".region--header", o);
      r && e && (e(!1), f(r[0]), window.addEventListener("resize", h(f, 205)));
    }
  };
})(Drupal, Drupal.displace, Drupal.debounce, once);
//# sourceMappingURL=neo-back.js.map
