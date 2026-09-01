'use strict';

(function (Drupal, once) {

  /**
   * How far into the body to look for a row that maps one cell per column.
   *
   * A header row with a colspan group cannot be measured column by column, so
   * the body is the fallback. Bounded because a table can be thousands of rows
   * long and the first few are as good as any.
   */
  const MEASURE_ROW_LIMIT = 5;

  /**
   * The number of columns the table lays out, counting spans.
   */
  function getColumnCount(table: HTMLTableElement): number {
    const row = table.querySelector<HTMLTableRowElement>(':scope > thead > tr')
      || table.querySelector<HTMLTableRowElement>(':scope > tbody > tr');
    if (!row) {
      return 0;
    }
    let count = 0;
    (Array.from(row.children) as HTMLTableCellElement[]).forEach((cell) => {
      count += cell.colSpan || 1;
    });
    return count;
  }

  /**
   * Measure every column, from the first row that lines up with the grid.
   *
   * The real <thead> is preferred and usually wins: visibility: collapse zeroes
   * the row's height without touching the width its cells report. A row whose
   * cells span columns is skipped rather than guessed at -- a spanning cell
   * gives one width for several columns, and splitting it evenly would be a
   * fiction the body does not share.
   */
  function measureColumnWidths(table: HTMLTableElement, columnCount: number): number[] | null {
    if (!columnCount) {
      return null;
    }
    const rows: HTMLTableRowElement[] = ([] as HTMLTableRowElement[]).concat(
      Array.from(table.querySelectorAll<HTMLTableRowElement>(':scope > thead > tr')),
      Array.from(table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr')).slice(0, MEASURE_ROW_LIMIT)
    );
    for (let i = 0; i < rows.length; i++) {
      const cells = Array.from(rows[i].children) as HTMLTableCellElement[];
      if (cells.length !== columnCount) {
        continue;
      }
      if (cells.some((cell) => (cell.colSpan || 1) > 1)) {
        continue;
      }
      return cells.map((cell) => cell.getBoundingClientRect().width);
    }
    return null;
  }

  /**
   * Rounded far enough in to stay out of the way.
   *
   * Only to give the change check below a stable string to compare; the
   * fraction itself is kept, because these widths tile. Trimmed to the usual
   * two decimals the leftovers accumulate along the row and put the last column
   * a visible twentieth of a pixel out.
   */
  function px(value: number): string {
    return `${Math.round(value * 10000) / 10000}px`;
  }

  function setWidth(element: HTMLElement, value: number): void {
    const next = px(value);
    if (element.style.width !== next) {
      element.style.width = next;
    }
  }

  /**
   * Size the clone by <colgroup> under table-layout: fixed.
   *
   * Not by a width on each <th>. Under the auto layout both tables would
   * otherwise use, a width on a cell is a suggestion: the browser re-runs its
   * distribution pass over the collapsed borders it did not account for, adds
   * about a pixel per column, and settles the accumulated difference on the
   * first one -- which is how a fifteen-column table ended up eleven pixels out
   * of step with its own body. Fixed layout takes the column widths verbatim,
   * so the clone tiles exactly like the table it was cloned from.
   *
   * A cloned <th> that spans columns lands correctly for free: the colgroup,
   * not the cell, defines the grid it spans across.
   */
  function applyColumns(clone: HTMLTableElement, widths: number[], totalWidth: number): void {
    // The per-th widths the fallback below writes are a different mechanism,
    // and would fight this one if a table ever crossed between the two.
    clone.querySelectorAll('th, td').forEach((cell) => {
      (cell as HTMLElement).style.width = '';
    });

    let colgroup = clone.querySelector<HTMLElement>(':scope > colgroup');
    // A colgroup carried over by the clone is reused when it already describes
    // the grid one <col> per column, so anything styling those columns keeps
    // working. Otherwise every one of them goes: a second colgroup does not
    // replace the first, it appends columns after it.
    const reusable = colgroup
      && colgroup.children.length === widths.length
      && !clone.querySelector(':scope > colgroup ~ colgroup')
      && !Array.from(colgroup.children).some((col) => col.hasAttribute('span'));
    if (!reusable) {
      clone.querySelectorAll(':scope > colgroup').forEach((group) => group.remove());
      colgroup = document.createElement('colgroup');
      widths.forEach(() => colgroup!.appendChild(document.createElement('col')));
      // After the caption, which has to stay the table's first child.
      const caption = clone.querySelector(':scope > caption');
      clone.insertBefore(colgroup, caption ? caption.nextSibling : clone.firstChild);
    }

    widths.forEach((width, i) => {
      setWidth(colgroup!.children[i] as HTMLElement, width);
    });

    clone.style.tableLayout = 'fixed';
    setWidth(clone, totalWidth);
  }

  /**
   * Copy the header cell widths across, one for one.
   *
   * Only for a table no row of which lines up with the grid, where there is
   * nothing to build a colgroup from. Inexact -- see applyColumns() -- but it
   * is what shipped before, so a table that cannot be measured is left no worse
   * off than it was.
   */
  function applyCellWidths(clone: HTMLTableElement, table: HTMLTableElement, totalWidth: number): void {
    clone.querySelectorAll(':scope > colgroup').forEach((group) => group.remove());
    clone.style.tableLayout = '';

    const original = table.querySelectorAll('th');
    const cloned = clone.querySelectorAll('th');
    original.forEach((th, index) => {
      if (index < cloned.length) {
        setWidth(cloned[index], th.getBoundingClientRect().width);
      }
    });
    setWidth(clone, totalWidth);
  }

  /**
   * Keep two scroll containers on the same horizontal offset.
   *
   * The equality guard is what lets several of these run at once -- the body,
   * this header and the sticky scrollbar table.ts adds all listen to each other
   * -- without a write bouncing back as another scroll event.
   */
  function syncScroll(from: HTMLElement, to: HTMLElement): void {
    if (to.scrollLeft !== from.scrollLeft) {
      to.scrollLeft = from.scrollLeft;
    }
  }

  function cloneTableAndWrapInDiv(table: HTMLTableElement) {

    const wrapper = table.closest<HTMLElement>('.table--wrapper');
    const inner = wrapper ? wrapper.querySelector<HTMLDivElement>('.table--inner') : null;

    if (!wrapper || !inner) {
      return;
    }

    wrapper.classList.add('table--sticky');

    // Clone the table (deep clone to get all child elements).
    //
    // Sticky columns ride along for free, and depend on that: the .sticky--*
    // classes are server-rendered so the clone can never disagree with the
    // body, and their offsets are custom properties on .table--wrapper, which
    // this clone sits inside and so inherits live. Do not "optimize" those
    // offsets into inline styles on the cells -- this clone is taken once, so
    // inline values would freeze here and go stale on the next resize.
    const clonedTable = table.cloneNode(true) as HTMLTableElement;
    clonedTable.removeAttribute('id');

    // Find and clear the tbody in the cloned table
    const clonedTbody = clonedTable.querySelector('tbody');
    if (clonedTbody) {
      clonedTbody.innerHTML = '';
    }

    // Create a wrapper div
    const clonedWrapper = document.createElement('div');
    clonedWrapper.setAttribute('aria-hidden', 'true');
    clonedWrapper.classList.add('table--header');

    // Append the cloned table to the wrapper div
    clonedWrapper.appendChild(clonedTable);

    // Insert the cloned table before the original table
    inner.parentNode?.insertBefore(clonedWrapper, inner);

    /**
     * Match the clone's column grid to the table it stands in for.
     */
    function syncHeaderWidths(): void {
      const totalWidth = table.getBoundingClientRect().width;
      const widths = measureColumnWidths(table, getColumnCount(table));
      if (widths) {
        applyColumns(clonedTable, widths, totalWidth);
      }
      else {
        applyCellWidths(clonedTable, table, totalWidth);
      }
    }

    // Initial synchronization of header widths
    syncHeaderWidths();

    inner.addEventListener('scroll', () => {
      syncScroll(inner, clonedWrapper);
    });

    // Coalesce a burst of resize entries into one measure-and-write per frame.
    // The observer covers every header cell, so a single viewport change
    // otherwise arrives as one callback per column.
    let frame = 0;
    const resizeObserver = new ResizeObserver(() => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncHeaderWidths();
      });
    });

    // The table itself catches a change in total width, and the header cells
    // catch a column changing width without the total moving.
    resizeObserver.observe(table);
    table.querySelectorAll('th').forEach(th => {
      resizeObserver.observe(th);
    });
  }

  Drupal.behaviors.neoBaseTableHeader = {};
  Drupal.behaviors.neoBaseTableHeader.attach = (context:HTMLElement) => {
    once('neoBase.tableheader', '.sticky-header', context).forEach((table:HTMLElement) => {
      cloneTableAndWrapInDiv(table as HTMLTableElement);
    });
  }

})(Drupal, once);

export {};
