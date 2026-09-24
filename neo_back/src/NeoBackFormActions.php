<?php

namespace Drupal\neo_back;

use Drupal\Core\EventSubscriber\MainContentViewSubscriber;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Render\Element;
use Drupal\Core\Url;

/**
 * Puts a content entity form's actions in the sticky page header.
 *
 * The buttons have to stay in the form: that is where the Form API, #ajax and
 * every module's JS expect them. So the header gets copies. A copied button is
 * tied to the form with the HTML `form` attribute, and header-actions.ts turns
 * a click on it into a click on the original, which then behaves exactly as
 * before. The originals are hidden. Links such as Delete work on their own.
 *
 * The copies are collected while the form is built and handed to the page in
 * neo_back_preprocess_page(). The main content is built before the page is
 * rendered, so they are there in time.
 *
 * @internal
 */
class NeoBackFormActions {

  /**
   * Marks the in-form actions that the header now stands in for.
   */
  const HIDDEN_CLASS = 'neo-form-actions--in-header';

  /**
   * The copies for this page, once a form has claimed the header.
   *
   * @var array|null
   */
  protected static ?array $headerActions = NULL;

  /**
   * After build callback for content entity forms.
   */
  public static function afterBuild(
    array $form,
    FormStateInterface $form_state,
  ): array {
    if (empty($form['actions']) || empty($form['#id'])) {
      return $form;
    }
    // Only a form that renders a page of its own has a header to put them in.
    // One opened in a modal or dialog keeps its actions. The first such form
    // claims the header; any later one on the same page is left alone.
    if (static::isPageRequest() && static::$headerActions === NULL) {
      static::$headerActions = static::buildHeaderActions($form);
      $form_state->set('neo_back_header_actions', TRUE);
    }
    // Remembered in the form state rather than decided per request, so an
    // #ajax rebuild of the same form keeps its originals hidden too.
    if ($form_state->get('neo_back_header_actions')) {
      $form['actions']['#attributes']['class'][] = static::HIDDEN_CLASS;
    }
    return $form;
  }

  /**
   * Returns the header copies claimed during this request, if any.
   */
  public static function getHeaderActions(): ?array {
    return static::$headerActions;
  }

  /**
   * Whether this request renders a full HTML page.
   */
  protected static function isPageRequest(): bool {
    $request = \Drupal::request();
    return !$request->isXmlHttpRequest()
      && !$request->query->has(MainContentViewSubscriber::WRAPPER_FORMAT);
  }

  /**
   * Copies the form's visible actions for the header.
   */
  protected static function buildHeaderActions(array $form): array {
    $build = [
      '#type' => 'container',
      '#weight' => 1000,
      '#attributes' => ['class' => ['neo-header-actions']],
      '#attached' => ['library' => ['neo_back/header-actions']],
    ];
    foreach (Element::children($form['actions'], TRUE) as $key) {
      $element = $form['actions'][$key];
      if (!Element::isVisibleElement($element)) {
        continue;
      }
      $selector = $element['#attributes']['data-drupal-selector'] ?? NULL;
      // Prefixed so neither id nor selector repeats the original's.
      if (isset($element['#id'])) {
        $element['#id'] = 'neo-header-' . $element['#id'];
      }
      if ($selector) {
        $element['#attributes']['data-drupal-selector'] = 'neo-header-'
          . $selector;
      }
      if (in_array($element['#type'] ?? '', ['submit', 'button'], TRUE)) {
        // Submits the form even without the script, as the same name and
        // value the Form API matches the original button by.
        $element['#attributes']['form'] = $form['#id'];
        $element['#attributes']['data-neo-header-source'] = $selector;
      }
      // Rendering a link merges its #attributes into the Url's options, and
      // the original shares this Url object.
      if (isset($element['#url']) && $element['#url'] instanceof Url) {
        $element['#url'] = clone $element['#url'];
      }
      $build[$key] = $element;
    }
    return $build;
  }

}
