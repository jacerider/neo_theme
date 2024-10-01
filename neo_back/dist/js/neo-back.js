((a, e, i, v) => {
  let n = -1, o;
  const s = (t) => {
    n !== (e == null ? void 0 : e.offsets.top) && (n = (e == null ? void 0 : e.offsets.top) ?? 0, o && o.unobserve(t), o = new IntersectionObserver((r) => {
      r.forEach((f) => {
        f.target.classList.toggle("is-active", f.intersectionRatio < 1);
      });
    }, {
      rootMargin: "-" + (n + 1) + "px 0px 0px 0px",
      threshold: [1]
    }), o.observe(t));
  };
  a.behaviors.neoBack = {
    attach: function(t) {
      const r = v("region--header", ".region--header", t);
      r && e && (e(!1), s(r[0]), window.addEventListener("resize", i(s, 205)));
    }
  };
})(Drupal, Drupal.displace, Drupal.debounce, once);
//# sourceMappingURL=neo-back.js.map
