(function(b) {
  const c = document.querySelector("[data-off-canvas-main-canvas]");
  function f(e) {
    let t = 0, o = e;
    for (; o; )
      t += o.offsetTop, o = o.offsetParent;
    return t;
  }
  class d {
    constructor() {
      this.observerMap = {};
    }
    observe(t, o, r, i) {
      if (!c || !c.parentNode)
        return;
      const m = t.style.position;
      t.style.position = "static";
      let n = f(t);
      const a = window.getComputedStyle(t);
      i === "top" && a.top && (n -= parseFloat(a.top)), i === "bottom" && a.bottom && (n += parseFloat(a.bottom)), t.style.position = m;
      var s = document.createElement("div");
      if (s.setAttribute("data-neo-sticky-observe", t.id), i === "top")
        s.style.top = n - 1 + "px";
      else {
        const y = t.offsetHeight;
        s.style.top = n + y + 1 + "px";
      }
      c.after(s);
      const u = new IntersectionObserver(r, o);
      u.observe(s), this.observerMap[t.id] = {
        observer: u,
        element: s,
        position: i
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
  const p = new d();
  function v(e) {
    const t = window.getComputedStyle(e);
    return (t.position === "sticky" || t.position === "-webkit-sticky") && (t.bottom && t.bottom !== "auto" && t.bottom !== "0px" || t.bottom && t.bottom !== "auto" && (!t.top || t.top === "auto")) ? "bottom" : "top";
  }
  function l() {
    document.querySelectorAll("[class*=sticky]").forEach((t) => {
      t.id || (t.id = "sticky" + Math.random().toString(16).slice(2));
      const o = v(t);
      p.unobserve(t), p.observe(t, { threshold: [0, 1] }, (r) => {
        if (window.getComputedStyle(t).position !== "sticky") {
          t.classList.remove("is-stuck");
          return;
        }
        r[0].intersectionRatio === 0 ? t.classList.add("is-stuck") : r[0].intersectionRatio === 1 && t.classList.remove("is-stuck");
      }, o);
    });
  }
  b(document).on("drupalViewportOffsetChange.neoBase", (e, t) => {
    l();
  });
})(jQuery);
//# sourceMappingURL=sticky.js.map
