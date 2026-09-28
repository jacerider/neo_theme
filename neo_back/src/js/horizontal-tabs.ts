'use strict';

(function (Drupal, once) {

  /**
   * Places the marker under the selected tab's label.
   *
   * Measured rather than laid out, because the marker is one element that
   * moves between tabs: field_group only moves a `selected` class, and a bar
   * drawn by each tab can appear and disappear but never travel. The label is
   * the link less its side padding, the same span the static bar (form.css)
   * covers, and the marker sits on the link's bottom edge, which overlaps the
   * list's hairline.
   */
  function place(wrapper: HTMLElement, marker: HTMLElement, animate: boolean) {
    const link = wrapper.querySelector<HTMLElement>(
      '.horizontal-tabs-list li.selected a, .horizontal-tabs-list li a.active',
    );
    // A tab list inside something collapsed has no box to measure. Its
    // ResizeObserver fires once it is shown, and places the marker then.
    if (!link || !link.offsetParent) {
      marker.classList.remove('is-placed');
      return;
    }
    const style = getComputedStyle(link);
    const padStart = parseFloat(style.paddingLeft) || 0;
    const padEnd = parseFloat(style.paddingRight) || 0;
    const box = wrapper.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    const x = `${rect.left - box.left + padStart}px`;
    const y = `${rect.bottom - box.top}px`;
    const w = `${rect.width - padStart - padEnd}px`;
    const vars = wrapper.style;
    // Nothing to do when the marker would land where it already is: a resize
    // that did not move the tabs would otherwise cut a slide short.
    if (
      marker.classList.contains('is-placed')
      && vars.getPropertyValue('--neo-tab-x') === x
      && vars.getPropertyValue('--neo-tab-y') === y
      && vars.getPropertyValue('--neo-tab-w') === w
    ) {
      return;
    }
    marker.classList.toggle('is-animated', animate);
    vars.setProperty('--neo-tab-x', x);
    vars.setProperty('--neo-tab-y', y);
    vars.setProperty('--neo-tab-w', w);
    marker.classList.add('is-placed');
  }

  /**
   * Slides one marker between an entity form's horizontal tabs.
   *
   * Every way a tab gets selected ends in field_group moving the `selected`
   * class: a click, the keyboard, a validation error opening the tab that
   * holds it, a fragment in the URL. Watching that class catches all of them
   * without depending on how each happened. Only a change of selection
   * animates; a resize or a font arriving re-places the marker where it
   * stands.
   *
   * The first change also marks the tabs ready, which lets the pane fade in
   * from then on (form.css). Until then the page is still loading, and the
   * first pane should simply be there.
   */
  Drupal.behaviors.neoBackHorizontalTabs = {};
  Drupal.behaviors.neoBackHorizontalTabs.attach = (context:HTMLElement) => {
    once(
      'neo-back-horizontal-tabs',
      '.layout-entity-form--main [data-horizontal-tabs]',
      context,
    ).forEach((wrapper) => {
      const list = wrapper.querySelector<HTMLElement>('.horizontal-tabs-list');
      if (!list) {
        return;
      }
      const marker = document.createElement('span');
      marker.className = 'neo-tab-marker';
      marker.setAttribute('aria-hidden', 'true');
      wrapper.insertBefore(marker, list.nextSibling);
      wrapper.classList.add('has-neo-tab-marker');

      let selected = list.querySelector('li.selected');
      new MutationObserver(() => {
        const current = list.querySelector('li.selected');
        if (current === selected) {
          return;
        }
        selected = current;
        wrapper.classList.add('is-neo-tabs-ready');
        place(wrapper, marker, true);
      }).observe(list, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class'],
      });

      new ResizeObserver(() => place(wrapper, marker, false)).observe(list);
      document.fonts?.ready.then(() => place(wrapper, marker, false));
      place(wrapper, marker, false);
    });
  };

})(Drupal, once);

export {};
