(function ($) {

  interface StickyObserverEntry {
    observer: IntersectionObserver;
    /** The sticky element itself, kept so a pass can tell when it has gone. */
    target: HTMLElement;
    /** The absolutely positioned marker the observer actually watches. */
    sentinel: HTMLElement;
    position: 'top' | 'bottom';
  }

  interface StickyCandidate {
    el: HTMLElement;
    position: 'top' | 'bottom';
  }

  interface StickyMeasurement {
    top: number;
    height: number;
  }

  const main = document.querySelector('[data-off-canvas-main-canvas]') as HTMLElement;

  /**
   * The elements this file is about.
   *
   * A whole-token match on Tailwind's `sticky` utility, plus its variant forms
   * (`md:sticky`, `hover:sticky`). The substring form -- `[class*=sticky]` --
   * looks equivalent and is not: it also matches the table sticky-column
   * classes (`sticky--left`, `sticky-left--0`, `sticky--left-edge` and their
   * right-hand twins), which pin *horizontally* and never want `is-stuck`.
   * A table emits one of those per cell, so the substring form turned a
   * thousand-row table into a thousand forced layouts.
   */
  const SELECTOR = '[class~="sticky"], [class*=":sticky"]';

  /**
   * Gets the top offset of an element relative to the document
   * @param element The element to get the offset for
   * @returns The offset from the top of the document in pixels
   */
  function getOffsetTopFromDocument(element: HTMLElement): number {
    let offsetTop = 0;
    let currentElement: HTMLElement | null = element;

    // Traverse up the DOM tree, accumulating offsets
    while (currentElement) {
      offsetTop += currentElement.offsetTop;
      currentElement = currentElement.offsetParent as HTMLElement | null;
    }

    return offsetTop;
  }

  function isSticky(style: CSSStyleDeclaration): boolean {
    return style.position === 'sticky' || style.position === '-webkit-sticky';
  }

  /**
   * Reads a computed inset as a number.
   *
   * An inset left at `auto` parses to NaN, which used to travel all the way
   * into the sentinel's `top` and land there as the string `NaNpx`.
   */
  function toInset(value: string): number {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  class ObserverManager {
    private observerMap: Record<string, StickyObserverEntry> = {};

    /**
     * Builds an element's sentinel, but does not start watching it yet.
     *
     * The sentinel goes into the caller's fragment rather than straight into
     * the page, so a whole pass costs one insertion. Watching starts in
     * activate(), once the sentinel is in the document and has a box.
     */
    public register(
      element: HTMLElement,
      position: 'top' | 'bottom',
      measurement: StickyMeasurement,
      fragment: DocumentFragment
    ): void {
      this.unobserve(element);

      const sentinel = document.createElement('div');
      sentinel.setAttribute('data-neo-sticky-observe', element.id);

      // Position the sentinel depending on which edge we are watching.
      if (position === 'top') {
        sentinel.style.top = (measurement.top - 1) + 'px';
      }
      else {
        // For bottom sticky elements, sit just past the end of the element.
        sentinel.style.top = (measurement.top + measurement.height + 1) + 'px';
      }
      fragment.appendChild(sentinel);

      const observer = new IntersectionObserver((entries) => {
        if (!isSticky(window.getComputedStyle(element))) {
          element.classList.remove('is-stuck');
          return;
        }

        if (entries[0].intersectionRatio === 0) {
          element.classList.add('is-stuck');
        }
        else if (entries[0].intersectionRatio === 1) {
          element.classList.remove('is-stuck');
        }
      }, {threshold: [0, 1]});

      this.observerMap[element.id] = {
        observer: observer,
        target: element,
        sentinel: sentinel,
        position: position
      };
    }

    /**
     * Starts every observer whose sentinel is now in the document.
     */
    public activate(): void {
      Object.keys(this.observerMap).forEach((id) => {
        const entry = this.observerMap[id];
        if (entry.sentinel.isConnected) {
          entry.observer.observe(entry.sentinel);
        }
      });
    }

    public unobserve(element: HTMLElement): void {
      this.forget(element.id);
    }

    /**
     * Drops observers for elements this file no longer has anything to say
     * about -- gone from the document, or no longer claiming to be sticky.
     *
     * sticky() only ever unobserves elements the selector still finds, so
     * anything the page has since thrown away -- the contents of a closed
     * modal, an AJAX-replaced region -- would otherwise keep its sentinel and
     * its IntersectionObserver for the life of the page, and every later pass
     * would run over a document that only ever grows.
     */
    public prune(selector: string): void {
      Object.keys(this.observerMap).forEach((id) => {
        const target = this.observerMap[id].target;
        if (!target.isConnected || !target.matches(selector)) {
          this.forget(id);
        }
      });
    }

    private forget(id: string): void {
      const entry = this.observerMap[id];
      if (!entry) {
        return;
      }
      entry.observer.disconnect();
      entry.sentinel.remove();
      delete this.observerMap[id];
    }
  }

  const observerManager = new ObserverManager();

  /**
   * Determines whether an element is sticky to the top or bottom based on its CSS properties
   */
  function getStickyPosition(computedStyle: CSSStyleDeclaration): 'top' | 'bottom' {
    // Check the bottom property
    if (computedStyle.bottom && computedStyle.bottom !== 'auto' && computedStyle.bottom !== '0px') {
      return 'bottom';
    }

    // Check if bottom is set but top isn't
    if (
      (computedStyle.bottom && computedStyle.bottom !== 'auto') &&
      (!computedStyle.top || computedStyle.top === 'auto')
    ) {
      return 'bottom';
    }

    // Default to top sticky if we can't determine bottom sticky
    return 'top';
  }

  function sticky() {
    observerManager.prune(SELECTOR);

    if (!main || !main.parentNode) {
      return;
    }

    // Gather and filter before writing anything. Both of these are reads, so
    // the whole set costs one layout rather than one per element.
    const candidates: StickyCandidate[] = [];
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      if (!isSticky(computedStyle)) {
        // Not sticky at this breakpoint, so it has no stuck state to track.
        // Clear anything an earlier pass left behind for it.
        observerManager.unobserve(el);
        return;
      }

      if (!el.id) {
        el.id = 'sticky' + Math.random().toString(16).slice(2);
      }

      candidates.push({el: el, position: getStickyPosition(computedStyle)});
    });

    if (!candidates.length) {
      return;
    }

    // Three separate passes on purpose. Interleaving the writes and the reads
    // -- as in "unset position, measure, restore" per element -- forces the
    // browser to lay the document out again on every single element. Split
    // apart, one layout serves the whole set.
    //
    // The position is unset because offsetTop on a sticky element reports
    // where it is currently stuck, not where it sits in the flow.
    const restore = candidates.map(({el}) => {
      const original = el.style.position;
      el.style.position = 'static';
      return original;
    });

    const measured: StickyMeasurement[] = candidates.map(({el, position}) => {
      const computedStyle = window.getComputedStyle(el);
      let top = getOffsetTopFromDocument(el);
      if (position === 'top' && computedStyle.top) {
        top -= toInset(computedStyle.top);
      }
      if (position === 'bottom' && computedStyle.bottom) {
        top += toInset(computedStyle.bottom);
      }
      return {top: top, height: position === 'bottom' ? el.offsetHeight : 0};
    });

    candidates.forEach(({el}, i) => {
      el.style.position = restore[i];
    });

    const fragment = document.createDocumentFragment();
    candidates.forEach(({el, position}, i) => {
      observerManager.register(el, position, measured[i], fragment);
    });
    main.after(fragment);
    observerManager.activate();
  }

  $(document).on('drupalViewportOffsetChange.neoBase', (_event, _offsets) => {
    sticky();
  });

})(jQuery);

export {};
