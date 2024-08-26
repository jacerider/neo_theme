/**
 * @file
 * Overrides vertical tabs theming to enable Neo designs.
 */

(($, Drupal) => {

  /**
   * The input field items that add displays must be rendered as `<input>`
   * elements. The following behavior detaches the `<input>` elements from the
   * DOM, wraps them in an unordered list, then appends them to the list of
   * tabs.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Fixes the input elements needed.
   */
  Drupal.behaviors.dialog.prepareDialogButtons = function ($dialog:JQuery) {
    const buttons:any = [];
    const $buttons = $dialog.find(
      '.form-actions input[type=submit], .form-actions button, .form-actions a.button, .form-actions a.action-link',
    );
    $buttons.each(function () {
      const $originalButton = $(this);
      this.style.display = 'none';
      buttons.push({
        text: $originalButton.html() || $originalButton.attr('value'),
        class: $originalButton.attr('class'),
        'data-once': $originalButton.data('once'),
        click(e:JQuery.Event) {
          // If the original button is an anchor tag, triggering the "click"
          // event will not simulate a click. Use the click method instead.
          if ($originalButton[0].tagName === 'A') {
            $originalButton[0].click();
          } else {
            $originalButton
              .trigger('mousedown')
              .trigger('mouseup')
              .trigger('click');
          }
          e.preventDefault();
        },
      });
    });
    return buttons;
  };

})(jQuery, Drupal);

export { };
