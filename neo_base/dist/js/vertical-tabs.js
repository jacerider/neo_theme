((e, l) => {
  l.theme.verticalTab = (a) => {
    const t = {};
    t.title = e('<strong class="vertical-tabs__menu-item-title"></strong>');
    const n = a.details.find("> summary > .details--title");
    return n.length ? t.title[0].innerHTML = n[0].innerHTML : t.title[0].textContent = a.title, t.item = e(
      '<li class="vertical-tabs__menu-item" tabindex="-1"></li>'
    ).append(
      t.link = e('<a href="#" class="vertical-tabs__menu-link"></a>').append(
        e('<span class="vertical-tabs__menu-link-content"></span>').append(t.title).append(
          t.summary = e(
            '<span class="vertical-tabs__menu-link-summary"></span>'
          )
        )
      )
    ), t;
  };
})(jQuery, Drupal);
//# sourceMappingURL=vertical-tabs.js.map
