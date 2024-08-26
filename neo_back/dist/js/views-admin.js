((t, n) => {
  n.behaviors.viewsUiRenderAddViewButton.attach = function(l) {
    const d = once(
      "views-ui-render-add-view-button",
      "#views-display-menu-tabs",
      l
    );
    if (!d.length)
      return;
    const i = t(d), a = t(
      `<li class="add"><a href="#"><span class="icon add"></span>${n.t(
        "Add"
      )}</a><ul class="action-list" style="display:none;"></ul></li>`
    ), o = i.nextAll("input.add-display, button.add-display").detach();
    o.appendTo(a.find(".action-list")).wrap("<li>").parent().eq(0).addClass("first").end().eq(-1).addClass("last"), o.each(function() {
      const e = t(this);
      e.attr("value", String(e.attr("data-drupal-dropdown-label")));
    }), a.appendTo(i), i.find("li.add > a").on("click", function(e) {
      e.preventDefault();
      const s = t(this);
      console.log(s), n.behaviors.viewsUiRenderAddViewButton.toggleMenu(s);
    }), t("li.add", i).on("mouseleave", function() {
      const e = t(this), s = e.children('a[href="#"]');
      n.elementIsVisible(e.children(".action-list")[0]) && n.behaviors.viewsUiRenderAddViewButton.toggleMenu(s);
    });
  };
})(jQuery, Drupal);
//# sourceMappingURL=views-admin.js.map
