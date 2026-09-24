'use strict';

(function (Drupal, once) {

  /**
   * The in-form button a header copy stands in for.
   *
   * Found through the hidden actions rather than the copy's `form` attribute,
   * so a form whose id changed when an #ajax response replaced it is still
   * reached.
   */
  function findOriginal(copy: HTMLElement): HTMLElement | null {
    const selector = copy.dataset.neoHeaderSource;
    if (!selector) {
      return null;
    }
    return document.querySelector<HTMLElement>(
      `.neo-form-actions--in-header [data-drupal-selector="${selector}"]`,
    );
  }

  /**
   * Hands a click on a header copy to the button it copies.
   *
   * The copy would submit the form by itself through its `form` attribute,
   * but only the original carries what the Form API and other scripts bound
   * to it: #ajax, client-side validation, single-submit. Clicking it keeps all
   * of that. An #ajax button listens for mousedown, so that is sent first.
   *
   * The copy is also the form's default button, being the first submit button
   * in the document tied to it, so pressing Enter in a field lands here too.
   */
  Drupal.behaviors.neoBackHeaderActions = {};
  Drupal.behaviors.neoBackHeaderActions.attach = (context:HTMLElement) => {
    once(
      'neo-back-header-actions',
      '.neo-header-actions [data-neo-header-source]',
      context,
    ).forEach((copy) => {
      copy.addEventListener('click', (event) => {
        const original = findOriginal(copy);
        if (!original) {
          return;
        }
        event.preventDefault();
        const form = original.closest('form');
        if (form?.id) {
          copy.setAttribute('form', form.id);
        }
        if ((original.dataset.once ?? '').split(' ').includes('drupal-ajax')) {
          original.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        }
        original.click();
      });
    });
  };

})(Drupal, once);

export {};
