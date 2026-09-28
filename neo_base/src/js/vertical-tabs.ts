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
   * Places the card over the selected tab.
   *
   * Measured rather than laid out, because the card is one element that moves
   * between tabs: core only moves an `is-selected` class, and a surface each
   * tab draws for itself can appear and disappear but never travel. The card
   * takes the selected link's own box, whose height follows its summary line.
   */
  function place(wrapper:HTMLElement, card:HTMLElement, animate:boolean) {
    const link = wrapper.querySelector<HTMLElement>(
      '.vertical-tabs__menu-item.is-selected .vertical-tabs__menu-link',
    );
    // Tabs inside something collapsed have no box to measure. The
    // ResizeObserver fires once they are shown, and places the card then.
    if (!link || !link.offsetParent) {
      card.classList.remove('is-placed');
      return;
    }
    const box = wrapper.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    card.classList.toggle('is-animated', animate);
    wrapper.style.setProperty('--neo-tab-x', `${rect.left - box.left}px`);
    wrapper.style.setProperty('--neo-tab-y', `${rect.top - box.top}px`);
    wrapper.style.setProperty('--neo-tab-w', `${rect.width}px`);
    wrapper.style.setProperty('--neo-tab-h', `${rect.height}px`);
    card.classList.add('is-placed');
  }

  /**
   * Slides one card between vertical tabs, the selected tab's raised surface.
   *
   * Every way a tab gets selected ends in core moving the `is-selected` class:
   * a click, the keyboard, a validation error opening the tab that holds it, a
   * fragment in the URL. Watching that class catches all of them. Only a
   * change of selection animates; a resize or a font arriving re-places the
   * card where it stands.
   *
   * The first change also marks the tabs ready, which lets the pane fade in
   * from then on (vertical-tabs.css). Until then the page is still loading,
   * and the first pane should simply be there.
   */
  Drupal.behaviors.neoBaseVerticalTabsCard = {
    attach(context:HTMLElement) {
      once('neo-vertical-tabs-card', '.vertical-tabs', context).forEach(
        (wrapper) => {
          const menu = wrapper.querySelector<HTMLElement>(
            ':scope > .vertical-tabs__menu',
          );
          if (!menu) {
            return;
          }
          const card = document.createElement('span');
          card.className = 'neo-vertical-tab-card';
          card.setAttribute('aria-hidden', 'true');
          wrapper.insertBefore(card, menu.nextSibling);
          wrapper.classList.add('has-neo-tab-card');

          let selected = menu.querySelector('.is-selected');
          new MutationObserver(() => {
            const current = menu.querySelector('.is-selected');
            if (current === selected) {
              return;
            }
            selected = current;
            wrapper.classList.add('is-neo-tabs-ready');
            place(wrapper, card, true);
          }).observe(menu, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
          });

          new ResizeObserver(() => place(wrapper, card, false)).observe(menu);
          document.fonts?.ready.then(() => place(wrapper, card, false));
          place(wrapper, card, false);
        },
      );
    },
  };
})(Drupal, once);

export {};
