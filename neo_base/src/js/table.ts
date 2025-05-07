'use strict';

(function (Drupal, once) {

  function processTable(table: HTMLElement): void {
    const wrapper = table.closest<HTMLDivElement>('.table--wrapper');
    if (!wrapper) {
      return;
    }
    const hasOverflow = wrapper.clientWidth < table.clientWidth;
    wrapper.classList.toggle('table--overflow', hasOverflow);
  }

  Drupal.behaviors.neoBaseTable = {};
  Drupal.behaviors.neoBaseTable.attach = (context:HTMLElement) => {
    once('neoBase.table', 'table', context).forEach((table:HTMLElement) => {
      const resizeObserver = new ResizeObserver((_entries) => {
        processTable(table);
      });
      resizeObserver.observe(table);
    });
  }

})(Drupal, once);

export {};
