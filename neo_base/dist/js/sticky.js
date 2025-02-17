var f = Object.defineProperty;
var l = (t, s, o) => s in t ? f(t, s, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[s] = o;
var b = (t, s, o) => l(t, typeof s != "symbol" ? s + "" : s, o);
(function(t) {
  const s = document.querySelector("[data-off-canvas-main-canvas]");
  class o {
    constructor() {
      b(this, "observerMap", {});
    }
    observe(e, i, u) {
      if (!s || !s.parentNode)
        return;
      e.style.position = "static";
      let c = e.offsetTop;
      const v = window.getComputedStyle(e);
      v.top && (c -= parseFloat(v.top)), e.style.position = "";
      var r = document.createElement("div");
      r.setAttribute("data-neo-sticky-observe", e.id), r.style.top = c - 1 + "px", s.after(r);
      const d = new IntersectionObserver(u, i);
      d.observe(r), this.observerMap[e.id] = {
        observer: d,
        element: r
      };
    }
    unobserve(e) {
      this.observerMap[e.id] && (this.observerMap[e.id].observer.unobserve(e), this.observerMap[e.id].element.remove(), delete this.observerMap[e.id]);
    }
    getObserver(e) {
      return this.observerMap[e.id].observer;
    }
  }
  const a = new o();
  function p() {
    document.querySelectorAll("[class*=sticky]").forEach((e) => {
      e.id || (e.id = "sticky-" + Math.random().toString(16).slice(2)), a.unobserve(e), a.observe(e, { threshold: [0, 1] }, (i) => {
        i[0].intersectionRatio === 0 ? e.classList.add("is-stuck") : i[0].intersectionRatio === 1 && e.classList.remove("is-stuck");
      });
    });
  }
  t(document).on("drupalViewportOffsetChange.neoBase", (n, e) => {
    p();
  });
})(jQuery);
//# sourceMappingURL=sticky.js.map
