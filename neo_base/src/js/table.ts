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
    const hasOverflow = table.getBoundingClientRect().width > wrapper.clientWidth + 1;
    wrapper.classList.toggle('table--overflow', hasOverflow);

    const leftWidth = applyStickyOffsets(table, wrapper);
    // Pinning is switched off here rather than switched on, so that a JS failure
    // leaves the columns pinned as they were rather than unpinning them.
    wrapper.classList.toggle('table--unpinned', !hasOverflow);
    // Left-pinned columns size to their content and can grow until pinning them
    // leaves nothing worth scrolling. The right group is exempt: it is narrow by
    // construction and pinning it is the behaviour that already shipped.
    const inner = table.closest<HTMLDivElement>('.table--inner');
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
    });
  }

})(Drupal, once);

export {};
