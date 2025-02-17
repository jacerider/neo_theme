
(function ($) {

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
      // If the offset data attribute contains a displacing value, use it.
      let displacement = parseInt(el.getAttribute(`data-offset-${edge}`) as string, 10);
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
    $(document).trigger('neoViewportOffsetChange', offsets);
    return offsets;
  }

  $(document).on('drupalViewportOffsetChange.neoDisplace', (_event, _offsets) => {
    displace();
  });

})(jQuery);

export {};
