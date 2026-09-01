'use strict';

(function (Drupal, once) {

  /**
   * The row whose cells define the column widths.
   *
   * Prefers the real <thead>, which stays measurable even under .table--sticky
   * where the row is collapsed to zero height -- visibility: collapse does not
   * affect the width a column reports.
   */
  function getMeasureCells(table: HTMLElement): HTMLTableCellElement[] {
    const row = table.querySelector<HTMLTableRowElement>(':scope > thead > tr')
      || table.querySelector<HTMLTableRowElement>(':scope > tbody > tr');
    return row ? Array.from(row.children) as HTMLTableCellElement[] : [];
  }

  function setVar(wrapper: HTMLElement, name: string, value: number): void {
    const next = `${Math.round(value * 100) / 100}px`;
    if (wrapper.style.getPropertyValue(name) !== next) {
      wrapper.style.setProperty(name, next);
    }
  }

  /** Never let the grip shrink past something you can still grab. */
  const MIN_THUMB = 28;

  /**
   * The scrollbar that stands in for the one on .table--inner.
   *
   * The real one is unreachable: it sits at the foot of a table that can run
   * thousands of pixels past the bottom of the screen, and .table--inner hides
   * it besides. This is a rail held against the bottom of the viewport, clear
   * of anything displacing that edge (a sticky form-actions bar, say) by way of
   * --spacing-neo-b, so the table can be scrolled from wherever the page is.
   *
   * The grip is drawn rather than being a real scrollbar on a real overflowing
   * element. A native one cannot be relied on to be visible: Firefox on macOS
   * gives it the platform's overlay scrollbar, which takes no layout space and
   * fades out a moment after scrolling, so the control was invisible at rest in
   * the one browser and a permanent styled bar in the other. A control whose
   * whole purpose is to advertise that the table scrolls has to be there before
   * you touch it.
   *
   * Built on the first tick that finds an overflow rather than up front, so the
   * many tables in a form that fit their wrapper never gain the node.
   */
  function ensureScrollbar(wrapper: HTMLElement, inner: HTMLElement): HTMLElement {
    const existing = wrapper.querySelector<HTMLElement>(':scope > .table--scroll');
    if (existing) {
      return existing;
    }

    const bar = document.createElement('div');
    bar.className = 'table--scroll';
    // It carries no content of its own, and the table it scrolls is already in
    // the accessibility tree.
    bar.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div');
    thumb.className = 'table--scroll-thumb';
    bar.appendChild(thumb);
    wrapper.appendChild(bar);

    inner.addEventListener('scroll', () => layoutScrollbar(bar, inner));

    // Dragging the grip. The listeners go on the window rather than the grip,
    // because the pointer leaves a 10px-tall strip almost at once and the drag
    // has to keep following it.
    let originX = 0;
    let originScroll = 0;
    const onMove = (event: PointerEvent) => {
      const travel = bar.clientWidth - thumb.offsetWidth;
      if (travel <= 0) {
        return;
      }
      const scrollable = inner.scrollWidth - inner.clientWidth;
      inner.scrollLeft = originScroll + ((event.clientX - originX) / travel) * scrollable;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      bar.classList.remove('is-dragging');
    };
    thumb.addEventListener('pointerdown', (event: PointerEvent) => {
      originX = event.clientX;
      originScroll = inner.scrollLeft;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      bar.classList.add('is-dragging');
      // Otherwise the drag selects the rows behind it.
      event.preventDefault();
    });

    // Clicking the rail jumps a screenful, as a real scrollbar's track does.
    bar.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.target === thumb) {
        return;
      }
      const offset = event.clientX - bar.getBoundingClientRect().left;
      const direction = offset < thumb.offsetLeft ? -1 : 1;
      inner.scrollBy({left: direction * inner.clientWidth, behavior: 'smooth'});
    });

    return bar;
  }

  /**
   * Put the grip where the table is scrolled to, and size it to how much shows.
   */
  function layoutScrollbar(bar: HTMLElement, inner: HTMLElement): void {
    const thumb = bar.firstElementChild as HTMLElement | null;
    if (!thumb) {
      return;
    }
    const rail = bar.clientWidth;
    const scrollable = inner.scrollWidth - inner.clientWidth;
    if (rail <= 0 || scrollable <= 0) {
      return;
    }
    const width = Math.max(MIN_THUMB, (inner.clientWidth / inner.scrollWidth) * rail);
    // Against the travel the grip actually has, not the rail: the grip's own
    // width is the part of the rail it can never reach past.
    const offset = (inner.scrollLeft / scrollable) * (rail - width);
    const nextWidth = `${Math.round(width * 100) / 100}px`;
    if (thumb.style.width !== nextWidth) {
      thumb.style.width = nextWidth;
    }
    thumb.style.transform = `translateX(${Math.round(offset * 100) / 100}px)`;
  }

  /**
   * Measure the pinned columns and publish their offsets on the wrapper.
   *
   * Offsets are cumulative widths, not rect.left deltas: once a cell is pinned
   * its rect.left already includes the sticky shift, so measuring that way is
   * self-referential and drifts as the table scrolls. Widths are unaffected.
   *
   * The running total is kept fractional rather than rounded. A pinned column
   * has to land exactly on its neighbour's trailing edge: round it down and the
   * column visibly jumps a pixel left the moment the table scrolls, taking the
   * border it shares with its neighbour with it; round it up and a hairline
   * opens that the columns behind show through. The remaining sub-pixel -- the
   * cloned header and the body disagree by a fraction, so one offset cannot suit
   * both -- is covered in CSS by .sticky--left/.sticky--right's seam overlay.
   *
   * @return The width of the left-pinned group.
   */
  function applyStickyOffsets(table: HTMLElement, wrapper: HTMLElement): number {
    const cells = getMeasureCells(table);
    let left = 0;
    let right = 0;

    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].classList.contains('sticky--left')) {
        break;
      }
      setVar(wrapper, `--sticky-left-${i}`, left);
      left += cells[i].getBoundingClientRect().width;
    }

    for (let i = cells.length - 1, ordinal = 0; i >= 0; i--, ordinal++) {
      if (!cells[i].classList.contains('sticky--right')) {
        break;
      }
      setVar(wrapper, `--sticky-right-${ordinal}`, right);
      right += cells[i].getBoundingClientRect().width;
    }

    return left;
  }

  function processTable(table: HTMLElement): void {
    const wrapper = table.closest<HTMLDivElement>('.table--wrapper');
    if (!wrapper) {
      return;
    }
    // Compare against the wrapper rather than the scroll container: once
    // .table--overflow lands, .table--inner gains a border that shrinks its
    // clientWidth and would hold the condition true on its own. The epsilon
    // keeps the two from flapping at the boundary.
    const tableWidth = table.getBoundingClientRect().width;
    const hasOverflow = tableWidth > wrapper.clientWidth + 1;
    wrapper.classList.toggle('table--overflow', hasOverflow);

    const inner = table.closest<HTMLDivElement>('.table--inner');
    if (hasOverflow && inner) {
      layoutScrollbar(ensureScrollbar(wrapper, inner), inner);
    }

    const leftWidth = applyStickyOffsets(table, wrapper);
    // Pinning is switched off here rather than switched on, so that a JS failure
    // leaves the columns pinned as they were rather than unpinning them.
    wrapper.classList.toggle('table--unpinned', !hasOverflow);
    // Left-pinned columns size to their content and can grow until pinning them
    // leaves nothing worth scrolling. The right group is exempt: it is narrow by
    // construction and pinning it is the behaviour that already shipped.
    const available = inner ? inner.clientWidth : wrapper.clientWidth;
    wrapper.classList.toggle('table--unpinned-left', leftWidth > available * 0.6);
  }

  Drupal.behaviors.neoBaseTable = {};
  Drupal.behaviors.neoBaseTable.attach = (context:HTMLElement) => {
    // Scoped to the real table: the header clone that tableheader.ts inserts is
    // also a <table> inside the wrapper, and would otherwise be picked up on an
    // AJAX re-attach and fight the original over .table--overflow.
    once('neoBase.table', '.table--inner > table', context).forEach((table:HTMLElement) => {
      const resizeObserver = new ResizeObserver((_entries) => {
        processTable(table);
      });
      resizeObserver.observe(table);
      // A column can change width without the table's total width changing, so
      // the header cells have to be watched individually as well.
      getMeasureCells(table).forEach((cell) => {
        resizeObserver.observe(cell);
      });
      // And the wrapper, which is the only one of the three that a change of
      // viewport moves. Every measurement here is the table against the space
      // it has, and a table already wider than that space keeps its width --
      // and its cells keep theirs -- however narrow the window gets. Watching
      // only those, a table that overflowed once stayed overflowing, and a
      // column unpinned on a narrow screen never pinned itself again.
      const wrapper = table.closest<HTMLDivElement>('.table--wrapper');
      if (wrapper) {
        resizeObserver.observe(wrapper);
      }
    });
  }

})(Drupal, once);

export {};
