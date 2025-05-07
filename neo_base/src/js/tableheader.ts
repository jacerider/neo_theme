'use strict';

(function (Drupal, once) {

  function cloneTableAndWrapInDiv(table: HTMLElement) {

    const wrapper = table.closest('.table--wrapper') as HTMLTableElement;
    const inner = wrapper.querySelector('.table--inner') as HTMLDivElement;

    if (!wrapper || !inner) {
      return;
    }

    wrapper.classList.add('table--sticky');

    // Clone the table (deep clone to get all child elements)
    const clonedTable = table.cloneNode(true) as HTMLTableElement;

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

    // Initial synchronization of header widths
    syncHeaderWidths();

    // Sync horizontal scrolling between the two containers
    const syncScroll = (e: Event): void => {
      const sourceElement = e.target as HTMLElement;
      if (clonedWrapper) {
        clonedWrapper.scrollLeft = sourceElement.scrollLeft;
      }
    };

    inner.addEventListener('scroll', syncScroll);

    // Function to synchronize header widths
    function syncHeaderWidths(): void {
      const originalHeaderCells = table.querySelectorAll('th');
      const clonedHeaderCells = clonedTable.querySelectorAll('th');

      originalHeaderCells.forEach((th, index) => {
        if (index < clonedHeaderCells.length) {
          const width = th.getBoundingClientRect().width;
          clonedHeaderCells[index].style.width = `${width}px`;
          clonedHeaderCells[index].style.minWidth = `${width}px`;
        }
      });

      // Also update the overall table width
      clonedTable.style.width = `${table.getBoundingClientRect().width}px`;
    }

    // Create a ResizeObserver to watch for size changes on original table headers
    const resizeObserver = new ResizeObserver(() => {
      // When size changes are detected, sync the header widths
      syncHeaderWidths();
    });

    // Observe each header in the original table
    table.querySelectorAll('th').forEach(th => {
      resizeObserver.observe(th);
    });

    // Also observe the table itself for overall size changes
    resizeObserver.observe(table);
  }

  Drupal.behaviors.neoBaseTableHeader = {};
  Drupal.behaviors.neoBaseTableHeader.attach = (context:HTMLElement) => {
    once('neoBase.tableheader', '.sticky-header', context).forEach((table:HTMLElement) => {
      cloneTableAndWrapInDiv(table);
    });
  }

})(Drupal, once);

export {};
