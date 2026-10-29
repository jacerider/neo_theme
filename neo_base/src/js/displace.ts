
(function (Drupal, debounce) {

  type DisplaceOffset = {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };

  /**
   * Triggers when layout of the page changes.
   */
  const cache: DisplaceOffset = {
    right: 0,
    left: 0,
    bottom: 0,
    top: 0,
  };

  const cssVarPrefix = '--neo-displace-offset';
  const documentStyle = document.documentElement.style;
  const offsetKeys = Object.keys(cache) as (keyof DisplaceOffset)[];
  const hasDrupalDisplace = typeof Drupal.behaviors.drupalDisplace !== 'undefined';

  const offsets: DisplaceOffset = Object.seal(
    Object.defineProperties({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }, Object.fromEntries(
      offsetKeys.map(edge => [edge, {
        enumerable: true,
        get: () => cache[edge],
        set: (value: number) => {
          if (value !== cache[edge]) {
            documentStyle.setProperty(`${cssVarPrefix}-${edge}`, `${value}px`);
          }
          cache[edge] = value;
        }
      }])
    ))
  );

  const VIEWPORT_OFFSET_CHANGE = 'drupalViewportOffsetChange';

  /**
   * Announces new offsets as `drupalViewportOffsetChange`.
   *
   * Through jQuery when the page has it -- exactly what core's drupal.displace
   * does, so jQuery listeners keep receiving the offsets as their second
   * argument -- and otherwise as a native CustomEvent with the offsets in
   * `detail`.
   */
  function triggerViewportOffsetChange(offsets: DisplaceOffset): void {
    if (typeof jQuery !== 'undefined') {
      jQuery(document).trigger(VIEWPORT_OFFSET_CHANGE, offsets);
      return;
    }
    document.dispatchEvent(new CustomEvent(VIEWPORT_OFFSET_CHANGE, {detail: offsets}));
  }

  /**
   * Calls a handler on every `drupalViewportOffsetChange`, however announced.
   *
   * Core's drupal.displace announces it with jQuery's trigger(), which never
   * reaches an addEventListener() listener; without jQuery on the page it can
   * only arrive as a native event. So listen natively always, and through
   * jQuery too when the page has it. jQuery is looked up, never required: core
   * loads it unaggregated at weight -20, ahead of any script of ours.
   */
  function onViewportOffsetChange(handler: () => void, namespace: string): void {
    document.addEventListener(VIEWPORT_OFFSET_CHANGE, () => handler());
    if (typeof jQuery !== 'undefined') {
      jQuery(document).on(`${VIEWPORT_OFFSET_CHANGE}.${namespace}`, (event) => {
        // A native dispatch reaches jQuery's handler too, as originalEvent.
        // The native listener above has already run for that one.
        if (!event.originalEvent) {
          handler();
        }
      });
    }
  }

  /**
   * Debounced function to handle resize observer entries.
   */
  const handleResizeEntries = debounce((entries: ResizeObserverEntry[]) => {
    entries.forEach((_entry) => {
      // Trigger displacement recalculation after resize
      displace();
    });
  }, 100);

  /**
   * Observes size changes of displacing elements.
   */
  const resizeObserver = new ResizeObserver((entries) => {
    handleResizeEntries(entries);
  });

  /**
   * Gets a specific edge's offset.
   *
   * Any element with the attribute data-offset-{edge} e.g. data-offset-top will
   * be considered in the viewport offset calculations. If the attribute has a
   * numeric value, that value will be used. If no value is provided, one will
   * be calculated using the element's dimensions and placement.
   *
   * @function Drupal.displace.calculateOffset
   *
   * @param {string} edge
   *   The name of the edge to calculate. Can be 'top', 'right',
   *   'bottom' or 'left'.
   *
   * @return {number}
   *   The viewport displacement distance for the requested edge.
   */
  function calculateOffset(edge:string) {
    let edgeOffset = 0;
    const displacingElements = document.querySelectorAll(
      `[data-neo-offset-${edge}]`,
    ) as NodeListOf<HTMLElement>;
    const n = displacingElements.length;
    for (let i = 0; i < n; i++) {
      const el = displacingElements[i];
      // If the element is not visible, do consider its dimensions.
      if (el.style.display === 'none') {
        continue;
      }

      // Watch for changes in the element's size.
      if (el.dataset.neoOffsetProcessed !== 'true') {
        el.dataset.neoOffsetProcessed = 'true';
        resizeObserver.observe(el);
      }

      // If the offset data attribute contains a displacing value, use it.
      let displacement = parseInt(el.getAttribute(`data-neo-offset-${edge}`) as string, 10);
      // If the element's offset data attribute exits
      // but is not a valid number then get the displacement
      // dimensions directly from the element.
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(displacement)) {
        displacement = getRawOffset(el, edge);
      }
      // If the displacement value is larger than the current value for this
      // edge, use the displacement value.
      edgeOffset = Math.max(edgeOffset, displacement);
    }

    return edgeOffset;
  }

  /**
   * Calculates displacement for element based on its dimensions and placement.
   *
   * @param {HTMLElement} el
   *   The element whose dimensions and placement will be measured.
   *
   * @param {string} edge
   *   The name of the edge of the viewport that the element is associated
   *   with.
   *
   * @return {number}
   *   The viewport displacement distance for the requested edge.
   */
  function getRawOffset(el: HTMLElement, edge: string): number {
    let displacement = 0;
    // Find the displacement value according to the edge.
    switch (edge) {
      case 'top':
      case 'bottom':
          displacement = el.offsetHeight;
          break;
      case 'left':
      case 'right':
          displacement = el.offsetWidth;
          break;
    }
    return displacement;
  }

  function displace(): DisplaceOffset {
    const newOffsets: DisplaceOffset = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    offsetKeys.forEach(edge => {
      newOffsets[edge] = calculateOffset(edge);
    });
    offsetKeys.forEach(edge => {
      offsets[edge] = newOffsets[edge];
    });
    if (!hasDrupalDisplace) {
      triggerViewportOffsetChange(offsets);
    }
    return offsets;
  }

  const handleResize = debounce(displace, 200) as () => void;

  if (hasDrupalDisplace) {
    onViewportOffsetChange(() => {
      displace();
      // Remove the event listener since we can rely on drupalViewportOffsetChange
      // being triggered on resize events.
      window.removeEventListener('resize', handleResize);
    }, 'neoDisplace');
  }

  /**
   * Registers a resize handler on the window.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.neoDisplace = {
    displaceProcessed: false,

    attach() {
      // Mark this behavior as processed on the first pass.
      if (this.displaceProcessed) {
        return;
      }
      this.displaceProcessed = true;
      if (!hasDrupalDisplace) {
        window.addEventListener('resize', handleResize);
      }
      displace();
    },
  };

})(Drupal, Drupal.debounce);

export {};
