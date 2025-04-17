(function ($) {

  interface ElementObserverMap {
    [key: string]: {
      observer: IntersectionObserver;
      element: HTMLElement;
      position: 'top' | 'bottom';
    }
  }

  const main = document.querySelector("[data-off-canvas-main-canvas]") as HTMLElement;

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

  // function isElementTallerThanWindow(element: HTMLElement): boolean {
  //   // Get element height (including padding and border if box-sizing is border-box)
  //   const elementHeight = element.offsetHeight;

  //   // Get window height
  //   const windowHeight = window.innerHeight;

  //   // Compare and return result
  //   return elementHeight > windowHeight;
  // }

  class ObserverManager {
    private observerMap: ElementObserverMap = {};

    public observe(
      element: HTMLElement,
      options: IntersectionObserverInit,
      callback: IntersectionObserverCallback,
      position: 'top' | 'bottom'
    ): void {
      if (!main || !main.parentNode) {
        return;
      }

      // Store original position
      const originalPosition = element.style.position;
      element.style.position = 'static';

      // Get element position
      let top = getOffsetTopFromDocument(element);
      const computedStyle = window.getComputedStyle(element);
      if (position === 'top' && computedStyle.top) {
        top -= parseFloat(computedStyle.top);
      }
      if (position === 'bottom' && computedStyle.bottom) {
        top += parseFloat(computedStyle.bottom);
      }

      // Restore original position
      element.style.position = originalPosition;

      // Create observer element
      var newEl = document.createElement("div");
      newEl.setAttribute("data-neo-sticky-observe", element.id);

      // Position observer depending on if we're observing top or bottom stickiness
      if (position === 'top') {
        newEl.style.top = (top - 1) + 'px';
      } else {
        // For bottom sticky elements, position at the bottom of the element
        const elementHeight = element.offsetHeight;
        newEl.style.top = (top + elementHeight + 1) + 'px';
      }

      main.after(newEl);

      const observer = new IntersectionObserver(callback, options);
      observer.observe(newEl);
      this.observerMap[element.id] = {
        observer: observer,
        element: newEl,
        position: position
      };
    }

    public unobserve(element: HTMLElement): void {
      if (this.observerMap[element.id]) {
        this.observerMap[element.id].observer.unobserve(this.observerMap[element.id].element);
        this.observerMap[element.id].element.remove();
        delete this.observerMap[element.id];
      }
    }

    public getObserver(element: HTMLElement): IntersectionObserver | undefined {
      return this.observerMap[element.id]?.observer;
    }

    public getPosition(element: HTMLElement): 'top' | 'bottom' | undefined {
      return this.observerMap[element.id]?.position;
    }
  }

  const observerManager = new ObserverManager();

  /**
   * Determines whether an element is sticky to the top or bottom based on its CSS properties
   */
  function getStickyPosition(element: HTMLElement): 'top' | 'bottom' {
    const computedStyle = window.getComputedStyle(element);

    // Check if the element has sticky positioning
    if (computedStyle.position === 'sticky' || computedStyle.position === '-webkit-sticky') {
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
    }

    // Default to top sticky if we can't determine bottom sticky
    return 'top';
  }

  function willStickyHaveEffect(element: HTMLElement): boolean {
    // First check if the element has position:sticky applied
    const style = window.getComputedStyle(element);
    if (style.position !== 'sticky') {
      return false;
    }

    // Get the necessary sticky offsets that determine when sticking occurs
    const stickyTop = style.top !== 'auto' ? parseInt(style.top) : null;
    const stickyBottom = style.bottom !== 'auto' ? parseInt(style.bottom) : null;

    // Sticky needs at least one threshold to work
    if (stickyTop === null && stickyBottom === null) {
      return false;
    }

    // Find the sticky containing block
    // This is the nearest ancestor with a scrolling mechanism
    let container = element.parentElement;
    let stickyContainer = null;

    while (container) {
      // Check if this container creates a new containing block
      const containerStyle = window.getComputedStyle(container);
      if (
        containerStyle.position === 'absolute' ||
        containerStyle.position === 'relative' ||
        containerStyle.position === 'fixed' ||
        containerStyle.position === 'sticky' ||
        container === document.body
      ) {
        stickyContainer = container;
        break;
      }
      container = container.parentElement;
    }

    if (!stickyContainer) {
      return false;
    }

    // Get the dimensions
    const elementHeight = element.offsetHeight;
    const containerHeight = stickyContainer.offsetHeight;

    // For sticky to have an effect:
    // 1. The container must be taller than the element
    // 2. There must be scrolling possible within the container or document
    const containerScrollHeight = Math.max(
      stickyContainer.scrollHeight,
      containerHeight
    );

    // Check if scrolling is possible
    const canScroll = containerScrollHeight > containerHeight;

    // Check if container is taller than the element
    const hasSufficientHeight = containerHeight > elementHeight;

    return canScroll && hasSufficientHeight;
  }

  function sticky() {
    // Find all elements with sticky class
    const elements = document.querySelectorAll('[class*=sticky]') as NodeListOf<HTMLElement>;

    elements.forEach((el: HTMLElement) => {
      if (!el.id) {
        el.id = 'sticky' + Math.random().toString(16).slice(2);
      }

      // Determine if the element is sticky to top or bottom
      const position = getStickyPosition(el);

      observerManager.unobserve(el);
      observerManager.observe(el, {threshold: [0, 1]}, (entries) => {
        const style = window.getComputedStyle(el);
        if (style.position !== 'sticky') {
          el.classList.remove("is-stuck");
          return;
        }

        if (entries[0].intersectionRatio === 0) {
          el.classList.add("is-stuck");
        } else if (entries[0].intersectionRatio === 1) {
          el.classList.remove("is-stuck");
        }
      }, position);
    });
  }

  $(document).on('drupalViewportOffsetChange.neoBase', (_event, _offsets) => {
    sticky();
  });

})(jQuery);

export {};
