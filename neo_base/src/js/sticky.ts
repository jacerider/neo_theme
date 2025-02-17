
(function ($) {

  interface ElementObserverMap {
    [key: string]: {
      observer: IntersectionObserver;
      element: HTMLElement;
    }
  }

  const main = document.querySelector("[data-off-canvas-main-canvas]") as HTMLElement;

  class ObserverManager {
    private observerMap: ElementObserverMap = {};

    public observe(element: HTMLElement, options: IntersectionObserverInit, callback: IntersectionObserverCallback): void {
      if (!main || !main.parentNode) {
        return;
      }
      element.style.position = 'static';
      let top = element.offsetTop;
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.top) {
        top -= parseFloat(computedStyle.top);
      }
      element.style.position = '';

      var newEl = document.createElement("div");
      newEl.setAttribute("data-neo-sticky-observe", element.id);
      newEl.style.top = (top - 1) + 'px';
      main.after(newEl);

      const observer = new IntersectionObserver(callback, options);
      observer.observe(newEl);
      this.observerMap[element.id] = {
        observer: observer,
        element: newEl
      };
    }

    public unobserve(element: HTMLElement): void {
      if (this.observerMap[element.id]) {
        this.observerMap[element.id].observer.unobserve(element);
        this.observerMap[element.id].element.remove();
        delete this.observerMap[element.id];
      }
    }

    public getObserver(element: HTMLElement): IntersectionObserver | undefined {
      return this.observerMap[element.id].observer;
    }
  }

  const observerManager = new ObserverManager();

  function sticky() {
    const elements = document.querySelectorAll('[class*=sticky]') as NodeListOf<HTMLElement>;
    elements.forEach((el:HTMLElement) => {
      if (!el.id) {
        el.id = 'sticky-' + Math.random().toString(16).slice(2);
      }
      observerManager.unobserve(el);
      observerManager.observe(el, {threshold: [0, 1]}, (entries) => {
        if (entries[0].intersectionRatio === 0) {
          el.classList.add("is-stuck");
        } else if (entries[0].intersectionRatio === 1) {
          el.classList.remove("is-stuck");
        }
      });
    });
  }

  $(document).on('drupalViewportOffsetChange.neoBase', (_event, _offsets) => {
    sticky();
  });

})(jQuery);

export {};
