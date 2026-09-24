'use strict';

(function (Drupal, once) {

  /**
   * Whether a slot row has no opening time.
   *
   * Reads the from/to cells rather than the whole row, so a comment alone
   * ("Thanksgiving") still leaves the row closed. Covers both storage element
   * types: a time input, or the hour/minute selects of a datelist.
   */
  function isEmptySlot(row: HTMLTableRowElement): boolean {
    const controls = row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      ':scope > .office-hours-cell--from :is(input, select), '
      + ':scope > .office-hours-cell--to :is(input, select)',
    );
    return Array.from(controls).every((control) => control.value === '');
  }

  /**
   * Marks each day, or each exception, whose slots are all empty.
   *
   * A day's slots are sibling rows sharing a js-office-hours-day-N class. An
   * exception without a date yet is an unfinished row rather than a closure,
   * so it is left unmarked.
   */
  function update(table: HTMLTableElement): void {
    const days = new Map<string, HTMLTableRowElement[]>();
    table.querySelectorAll<HTMLTableRowElement>(
      ':scope > tbody > tr.office-hours-slot',
    ).forEach((row) => {
      const match = row.className.match(/\bjs-office-hours-day-(\S+)/);
      if (match) {
        days.set(match[1], [...(days.get(match[1]) ?? []), row]);
      }
    });
    days.forEach((rows) => {
      const date = rows[0].querySelector<HTMLInputElement>(
        ':scope > .office-hours-cell--day input[type="date"]',
      );
      const closed = (!date || date.value !== '') && rows.every(isEmptySlot);
      rows.forEach((row) => row.classList.toggle('is-closed', closed));
    });
  }

  /**
   * Keeps the "Closed" marker in step with the office hours widget.
   *
   * Keyed on each table rather than the field: "Add exception" replaces only
   * the exceptions table, and a field-level key would never reach the new one.
   *
   * office_hours.js binds Clear and Copy on the links themselves and sets the
   * values without firing input events, so the delegated click below runs
   * after it and sees the result.
   */
  Drupal.behaviors.neoBackOfficeHours = {};
  Drupal.behaviors.neoBackOfficeHours.attach = (context:HTMLElement) => {
    once(
      'neo-back-office-hours',
      '.field--type-office-hours table',
      context,
    ).forEach((element) => {
      const table = element as HTMLTableElement;
      const refresh = () => update(table);
      table.addEventListener('input', refresh);
      table.addEventListener('change', refresh);
      table.addEventListener('click', (event) => {
        const target = event.target as Element | null;
        if (target?.closest('.js-office-hours-operation')) {
          refresh();
        }
      });
      refresh();
    });
  };

})(Drupal, once);

export {};
