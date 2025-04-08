(function(a) {
  const s = {
    right: 0,
    left: 0,
    bottom: 0,
    top: 0
  }, l = "--neo-displace-offset", p = document.documentElement.style, n = Object.keys(s), f = Object.seal(
    Object.defineProperties({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }, Object.fromEntries(
      n.map((t) => [t, {
        enumerable: !0,
        get: () => s[t],
        set: (e) => {
          e !== s[t] && p.setProperty(`${l}-${t}`, `${e}px`), s[t] = e;
        }
      }])
    ))
  );
  function u(t) {
    let e = 0;
    const o = document.querySelectorAll(
      `[data-neo-offset-${t}]`
    ), b = o.length;
    for (let c = 0; c < b; c++) {
      const r = o[c];
      if (r.style.display === "none")
        continue;
      let i = parseInt(r.getAttribute(`data-neo-offset-${t}`), 10);
      isNaN(i) && (i = m(r, t)), e = Math.max(e, i);
    }
    return e;
  }
  function m(t, e) {
    let o = 0;
    switch (e) {
      case "top":
      case "bottom":
        o = t.offsetHeight;
        break;
      case "left":
      case "right":
        o = t.offsetWidth;
        break;
    }
    return o;
  }
  function h() {
    const t = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    return n.forEach((e) => {
      t[e] = u(e);
    }), n.forEach((e) => {
      f[e] = t[e];
    }), a(document).trigger("neoViewportOffsetChange", f), f;
  }
  a(document).on("drupalViewportOffsetChange.neoDisplace", (t, e) => {
    h();
  });
})(jQuery);
//# sourceMappingURL=displace.js.map
