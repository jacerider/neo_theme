var g = Object.defineProperty;
var k = (s, e, i) => e in s ? g(s, e, { enumerable: !0, configurable: !0, writable: !0, value: i }) : s[e] = i;
var d = (s, e, i) => k(s, typeof e != "symbol" ? e + "" : e, i);
(function(s) {
  const e = document.querySelector("[data-off-canvas-main-canvas]");
  function i(r) {
    let t = 0, o = r;
    for (; o; )
      t += o.offsetTop, o = o.offsetParent;
    return t;
  }
  class v {
    constructor() {
      d(this, "observerMap", {});
    }
    observe(t, o, c, a) {
      if (!e || !e.parentNode)
        return;
      const y = t.style.position;
      t.style.position = "static";
      let p = i(t);
      const u = window.getComputedStyle(t);
      a === "top" && u.top && (p -= parseFloat(u.top)), a === "bottom" && u.bottom && (p += parseFloat(u.bottom)), t.style.position = y;
      var n = document.createElement("div");
      if (n.setAttribute("data-neo-sticky-observe", t.id), a === "top")
        n.style.top = p - 1 + "px";
      else {
        const h = t.offsetHeight;
        n.style.top = p + h + 1 + "px";
      }
      e.after(n);
      const f = new IntersectionObserver(c, o);
      f.observe(n), this.observerMap[t.id] = {
        observer: f,
        element: n,
        position: a
      };
    }
    unobserve(t) {
      this.observerMap[t.id] && (this.observerMap[t.id].observer.unobserve(this.observerMap[t.id].element), this.observerMap[t.id].element.remove(), delete this.observerMap[t.id]);
    }
    getObserver(t) {
      var o;
      return (o = this.observerMap[t.id]) == null ? void 0 : o.observer;
    }
    getPosition(t) {
      var o;
      return (o = this.observerMap[t.id]) == null ? void 0 : o.position;
    }
  }
  const b = new v();
  function l(r) {
    const t = window.getComputedStyle(r);
    return (t.position === "sticky" || t.position === "-webkit-sticky") && (t.bottom && t.bottom !== "auto" && t.bottom !== "0px" || t.bottom && t.bottom !== "auto" && (!t.top || t.top === "auto")) ? "bottom" : "top";
  }
  function m() {
    document.querySelectorAll("[class*=sticky]").forEach((t) => {
      t.id || (t.id = "sticky" + Math.random().toString(16).slice(2));
      const o = l(t);
      b.unobserve(t), b.observe(t, { threshold: [0, 1] }, (c) => {
        if (window.getComputedStyle(t).position !== "sticky") {
          t.classList.remove("is-stuck");
          return;
        }
        c[0].intersectionRatio === 0 ? t.classList.add("is-stuck") : c[0].intersectionRatio === 1 && t.classList.remove("is-stuck");
      }, o);
    });
  }
  s(document).on("drupalViewportOffsetChange.neoBase", (r, t) => {
    m();
  });
})(jQuery);
//# sourceMappingURL=sticky.js.map
