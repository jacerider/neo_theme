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

  /**
   * Keep two scroll containers on the same horizontal offset.
   *
   * The equality guard is what lets several of these run at once -- the body,
   * this scrollbar and the header tableheader.ts clones all listen to each
   * other -- without a write bouncing back as another scroll event.
   */
  function syncScroll(from: HTMLElement, to: HTMLElement): void {
    if (to.scrollLeft !== from.scrollLeft) {
      to.scrollLeft = from.scrollLeft;
    }
  }

  /**
   * The scrollbar that stands in for the one on .table--inner.
   *
   * The real one is unreachable: it sits at the foot of a table that can run
   * thousands of pixels past the bottom of the screen, and .table--inner hides
   * it besides. This is an empty strip that scrolls the body from wherever the
   * page happens to be -- sticky against the bottom of the viewport, clear of
   * anything displacing that edge (a sticky form-actions bar, say) by way of
   * --spacing-neo-b.
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
    // It carries no content of its own, and the body it scrolls is already in
    // the accessibility tree.
    bar.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div');
    track.className = 'table--scroll-track';
    bar.appendChild(track);
    wrapper.appendChild(bar);

    bar.addEventListener('scroll', () => syncScroll(bar, inner));
    inner.addEventListener('scroll', () => syncScroll(inner, bar));

    return bar;
  }

  /**
   * Give the scrollbar the same travel as the body it drives.
   *
   * Not simply the table's width: .table--inner picks up a border once it
   * overflows, so its scrollport is a couple of pixels narrower than the strip
   * is. Sized from the table alone, dragging the strip to its end would leave
   * the body short of its own. This matches the two maximums instead.
   */
  function syncScrollbar(bar: HTMLElement, inner: HTMLElement, tableWidth: number): void {
    const track = bar.firstElementChild as HTMLElement | null;
    if (!track) {
      return;
    }
    const width = bar.clientWidth
      ? tableWidth - inner.clientWidth + bar.clientWidth
      : tableWidth;
    const next = `${Math.round(width * 100) / 100}px`;
    if (track.style.width !== next) {
      track.style.width = next;
    }
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
      syncScrollbar(ensureScrollbar(wrapper, inner), inner, tableWidth);
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
