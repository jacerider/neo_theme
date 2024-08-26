((Drupal) => {

  /**
   * An animated progress throbber and container element for AJAX operations.
   *
   * @param {string} [message]
   *   (optional) The message shown on the UI.
   * @return {string}
   *   The HTML markup for the throbber.
   */
  Drupal.theme.ajaxProgressThrobber = (message) => {
    // Build markup without adding extra white space since it affects rendering.
    const messageMarkup =
      typeof message === 'string'
        ? Drupal.theme('ajaxProgressMessage', message)
        : '';
    const throbber = `<div class="throbber"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg></div>`;
    return `<div class="ajax-progress ajax-progress-throbber">${throbber}${messageMarkup}</div>`;
  };

})(Drupal);
