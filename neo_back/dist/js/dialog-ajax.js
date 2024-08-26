((n, a) => {
  a.behaviors.dialog.prepareDialogButtons = function(i) {
    const o = [];
    return i.find(
      ".form-actions input[type=submit], .form-actions button, .form-actions a.button, .form-actions a.action-link"
    ).each(function() {
      const t = n(this);
      this.style.display = "none", o.push({
        text: t.html() || t.attr("value"),
        class: t.attr("class"),
        "data-once": t.data("once"),
        click(s) {
          t[0].tagName === "A" ? t[0].click() : t.trigger("mousedown").trigger("mouseup").trigger("click"), s.preventDefault();
        }
      });
    }), o;
  };
})(jQuery, Drupal);
//# sourceMappingURL=dialog-ajax.js.map
