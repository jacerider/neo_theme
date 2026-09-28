/**
 * @file
 * Overrides vertical tabs theming to enable Neo designs.
 */

(($, Drupal) => {
  /**
   * Theme function for a vertical tab.
   *
   * @param {object} settings
   *   An object with the following keys:
   * @param {string} settings.title
   *   The name of the tab.
   *
   * @return {object}
   *   This function has to return an object with at least these keys:
   *   - item: The root tab jQuery element
   *   - link: The anchor tag that acts as the clickable area of the tab
   *       (jQuery version)
   *   - summary: The jQuery element that contains the tab summary
   */
  Drupal.theme.verticalTab = (settings) => {
    const tab:any = {};
    tab.title = $('<strong class="vertical-tabs__menu-item-title"></strong>');
    const title = settings.details.find('> summary > .details--title');
    if (title.length) {
      // Allow HTML.
      tab.title[0].innerHTML = title[0].innerHTML;
    }
    else {
      tab.title[0].textContent = settings.title;
    }
    tab.item = $(
      '<li class="vertical-tabs__menu-item" tabindex="-1"></li>',
    ).append(
      (tab.link = $('<a href="#" class="vertical-tabs__menu-link"></a>').append(
        $('<span class="vertical-tabs__menu-link-content"></span>')
          .append(tab.title)
          .append(
            (tab.summary = $(
              '<span class="vertical-tabs__menu-link-summary"></span>',
            )),
          ),
      )),
    );
    return tab;
  };
})(jQuery, Drupal);

((Drupal, once) => {
  /**
   * Places the marker beside the selected tab.
   *
   * Measured rather than laid out, because the marker is one element that
   * moves between tabs: core only moves an `is-selected` class, and a bar each
   * tab draws for itself can appear and disappear but never travel. It sits
   * on the track's inner edge (the tab's own margin out from the link) over
   * the middle half of the link, whose height follows its summary line.
   *
   * Nothing is done when the marker would land where it already is. The menu
   * stretches to the pane beside it, so switching panes resizes it, and
   * re-placing then would cut a slide short.
   */
  function place(wrapper:HTMLElement, marker:HTMLElement, animate:boolean) {
    const link = wrapper.querySelector<HTMLElement>(
      '.vertical-tabs__menu-item.is-selected .vertical-tabs__menu-link',
    );
    // Tabs inside something collapsed have no box to measure. The
    // ResizeObserver fires once they are shown, and places the marker then.
    if (!link || !link.offsetParent) {
      marker.classList.remove('is-placed');
      return;
    }
    const item = link.parentElement as HTMLElement;
    const inset = parseFloat(getComputedStyle(item).marginLeft) || 0;
    const box = wrapper.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    const x = `${rect.left - box.left - inset}px`;
    const y = `${rect.top - box.top + rect.height / 4}px`;
    const h = `${rect.height / 2}px`;
    const style = wrapper.style;
    if (
      marker.classList.contains('is-placed')
      && style.getPropertyValue('--neo-tab-x') === x
      && style.getPropertyValue('--neo-tab-y') === y
      && style.getPropertyValue('--neo-tab-h') === h
    ) {
      return;
    }
    marker.classList.toggle('is-animated', animate);
    style.setProperty('--neo-tab-x', x);
    style.setProperty('--neo-tab-y', y);
    style.setProperty('--neo-tab-h', h);
    marker.classList.add('is-placed');
  }

  /**
   * Slides one marker between vertical tabs, the selected tab's edge bar.
   *
   * Every way a tab gets selected ends in core moving the `is-selected` class:
   * a click, the keyboard, a validation error opening the tab that holds it, a
   * fragment in the URL. Watching that class catches all of them. Only a
   * change of selection animates; a resize or a font arriving re-places the
   * marker where it stands.
   *
   * The first change also marks the tabs ready, which lets the pane fade in
   * from then on (vertical-tabs.css). Until then the page is still loading,
   * and the first pane should simply be there.
   */
  Drupal.behaviors.neoBaseVerticalTabsMarker = {
    attach(context:HTMLElement) {
      once('neo-vertical-tabs-marker', '.vertical-tabs', context).forEach(
        (wrapper) => {
          const menu = wrapper.querySelector<HTMLElement>(
            ':scope > .vertical-tabs__menu',
          );
          if (!menu) {
            return;
          }
          const marker = document.createElement('span');
          marker.className = 'neo-vertical-tab-marker';
          marker.setAttribute('aria-hidden', 'true');
          wrapper.insertBefore(marker, menu.nextSibling);
          wrapper.classList.add('has-neo-tab-marker');

          let selected = menu.querySelector('.is-selected');
          new MutationObserver(() => {
            const current = menu.querySelector('.is-selected');
            if (current === selected) {
              return;
            }
            selected = current;
            wrapper.classList.add('is-neo-tabs-ready');
            place(wrapper, marker, true);
          }).observe(menu, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
          });

          new ResizeObserver(() => place(wrapper, marker, false)).observe(menu);
          document.fonts?.ready.then(() => place(wrapper, marker, false));
          place(wrapper, marker, false);
        },
      );
    },
  };
})(Drupal, once);

export {};
