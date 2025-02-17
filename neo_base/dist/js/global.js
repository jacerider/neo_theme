(function(a, u) {
  const o = {
    right: 0,
    left: 0,
    bottom: 0,
    top: 0
  }, p = "--neo-displace-offset", h = document.documentElement.style, n = Object.keys(o), r = Object.seal(
    Object.defineProperties({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }, Object.fromEntries(
      n.map((t) => [t, {
        enumerable: !0,
        get: () => o[t],
        set: (e) => {
          e !== o[t] && h.setProperty(`${p}-${t}`, `${e}px`), o[t] = e;
        }
      }])
    ))
  );
  function m(t) {
    let e = 0;
    const s = document.querySelectorAll(
      `[data-neo-offset-${t}]`
    ), d = s.length;
    for (let c = 0; c < d; c++) {
      const f = s[c];
      if (f.style.display === "none")
        continue;
      let i = parseInt(f.getAttribute(`data-offset-${t}`), 10);
      isNaN(i) && (i = b(f, t)), e = Math.max(e, i);
    }
    return e;
  }
  function b(t, e) {
    let s = 0;
    switch (e) {
      case "top":
      case "bottom":
        s = t.offsetHeight;
        break;
      case "left":
      case "right":
        s = t.offsetWidth;
        break;
    }
    return s;
  }
  function l() {
    const t = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    return n.forEach((e) => {
      t[e] = m(e);
    }), n.forEach((e) => {
      r[e] = t[e];
    }), r;
  }
  a.behaviors.neoBase = {}, a.behaviors.neoBase.attach = function(t) {
    this.displaceProcessed || (this.displaceProcessed = !0, window.addEventListener("resize", u(l, 200))), l();
  };
})(Drupal, Drupal.debounce);
//# sourceMappingURL=global.js.map
