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
  Drupal.behaviors.viewsUiRenderAddViewButton.attach = function (context:HTMLElement) {
    // Build the add display menu and pull the display input buttons into it.
    const menu = once(
      'views-ui-render-add-view-button',
      '#views-display-menu-tabs',
      context,
    );
    if (!menu.length) {
      return;
    }
    const $menu = $(menu);

    const $addDisplayDropdown = $(
      `<li class="add"><a href="#"><span class="icon add"></span>${Drupal.t(
        'Add',
      )}</a><ul class="action-list" style="display:none;"></ul></li>`,
    );
    const $displayButtons = $menu.nextAll('input.add-display, button.add-display').detach();
    $displayButtons
      .appendTo($addDisplayDropdown.find('.action-list'))
      .wrap('<li>')
      .parent()
      .eq(0)
      .addClass('first')
      .end()
      .eq(-1)
      .addClass('last');
    $displayButtons.each(function () {
      const $this = $(this);
      $this.attr('value', String($this.attr('data-drupal-dropdown-label')));
    });
    $addDisplayDropdown.appendTo($menu);

    // Add the click handler for the add display button.
    $menu.find('li.add > a').on('click', function (event) {
      event.preventDefault();
      const $trigger = $(this);
      console.log($trigger);
      Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
    });
    // Add a mouseleave handler to close the dropdown when the user mouses
    // away from the item. We use mouseleave instead of mouseout because
    // the user is going to trigger mouseout when moving away from the trigger
    // link to the sub menu items.
    // We use the live binder because the open class on this item will be
    // toggled on and off and we want the handler to take effect in the cases
    // that the class is present, but not when it isn't.
    $('li.add', $menu).on('mouseleave', function () {
      const $this = $(this);
      const $trigger = $this.children('a[href="#"]');
      if (Drupal.elementIsVisible($this.children('.action-list')[0])) {
        Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);
      }
    });
  };

})(jQuery, Drupal);

export { };
