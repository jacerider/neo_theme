
((Drupal, displace, debounce, once) => {

  let top = -1;
  let observer:IntersectionObserver;
  const observeHeader = (element:HTMLElement) => {
    if (top !== displace?.offsets.top) {
      top = displace?.offsets.top ?? 0;
      if (observer) {
        observer.unobserve(element);
      }
      observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          e.target.classList.toggle('is-active', e.intersectionRatio < 1);
        });
      }, {
        rootMargin: '-' + (top + 1) + 'px 0px 0px 0px',
        threshold: [1],
      });
      observer.observe(element);
    }
  };

  Drupal.behaviors.neoBack = {
    attach: function (context:HTMLElement) {
      const elements = once('region--header', '.region--header', context);
      if (elements && displace) {
        displace(false);
        observeHeader(elements[0]);
        window.addEventListener('resize', debounce(observeHeader, 205) as any);
      }
    }
  };

})(Drupal, Drupal.displace, Drupal.debounce, once);

export { };
