((a, e) => {
  e.theme.verticalTab = (n) => {
    const t = {};
    return t.title = a('<strong class="vertical-tabs__menu-item-title"></strong>'), t.title[0].textContent = n.title, t.item = a(
      '<li class="vertical-tabs__menu-item" tabindex="-1"></li>'
    ).append(
      t.link = a('<a href="#" class="vertical-tabs__menu-link"></a>').append(
        a('<span class="vertical-tabs__menu-link-content"></span>').append(t.title).append(
          t.summary = a(
            '<span class="vertical-tabs__menu-link-summary"></span>'
          )
        )
      )
    ), t;
  };
})(jQuery, Drupal);
//# sourceMappingURL=vertical-tabs.js.map
