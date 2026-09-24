<?php

namespace Drupal\neo_back;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Adapts the office_hours widget's slot rows to the Neo admin theme.
 *
 * Office Hours builds its widget from core table, datetime and link elements
 * and ships no template of its own, so the only seam that reaches the cells
 * and the operation links is a #process callback that runs after the module's
 * own. Everything here is markup for office-hours.css and office-hours.ts to
 * hold on to; the values, names and JS hooks the module relies on are left
 * alone.
 *
 * @internal
 */
class NeoBackOfficeHours {

  /**
   * Slot children mapped to the header key that names the same column.
   *
   * The header calls the time columns from/to while the slot calls them
   * starthours/endhours. Tagging each cell with the header's name lets one
   * name reach the th and every td of a column.
   */
  const CELLS = [
    'day' => 'day',
    'starthours' => 'from',
    'endhours' => 'to',
    'comment' => 'comment',
    'operations' => 'operations',
  ];

  /**
   * Process callback for office_hours_slot and office_hours_exceptions_slot.
   */
  public static function processSlot(
    array &$element,
    FormStateInterface $form_state,
    array &$complete_form,
  ): array {
    $first = empty($element['#day_delta']);

    // Core copies #wrapper_attributes onto the table cell. A form element also
    // puts them on its own .form-item div, which is why the CSS reaches these
    // through the row: `tr > .office-hours-cell--comment`.
    foreach (static::CELLS as $key => $name) {
      if (!isset($element[$key]) || !is_array($element[$key])) {
        continue;
      }
      $element[$key]['#wrapper_attributes']['class'] = array_merge(
        $element[$key]['#wrapper_attributes']['class'] ?? [],
        ['office-hours-cell', 'office-hours-cell--' . $name],
      );
    }

    if (($element['#type'] ?? '') === 'office_hours_exceptions_slot') {
      $element['#attributes']['class'][] = 'office-hours-slot--exception';
    }
    if (!$first) {
      $element['#attributes']['class'][] = 'office-hours-slot--more';
    }

    // The stock wrapper nests the control in .form--inline, whose flex basis
    // and full-width inputs are sized for a form column, not a table cell.
    // Element info is merged in with +=, so this survives the child build.
    foreach (['starthours', 'endhours'] as $key) {
      if (isset($element[$key]) && is_array($element[$key])) {
        $element[$key]['#theme_wrappers'] = ['datetime_wrapper__office_hours'];
      }
    }

    if (isset($element['operations']['data'])) {
      static::processOperations($element['operations']['data']);
    }

    // Rendered here so it is translated with the rest of the form; the script
    // only decides whether it shows.
    if ($first && isset($element['day']) && is_array($element['day'])) {
      $element['day']['#prefix'] = ($element['day']['#prefix'] ?? '')
        . '<span class="office-hours-closed">'
        . new TranslatableMarkup('Closed')
        . '</span>';
    }

    return $element;
  }

  /**
   * Turns the operation links into icon buttons that keep their names.
   *
   * The label moves into a visually hidden span, so it stays the link's
   * accessible name, and into a tooltip for everyone else. The links keep
   * their classes, id and data-drupal-selector: office_hours.js finds them by
   * the selector's add/clear/copy suffix.
   *
   * @param array $operations
   *   The slot's operations['data'] array, keyed add/clear/copy.
   */
  protected static function processOperations(array &$operations): void {
    $tooltips = \Drupal::moduleHandler()->moduleExists('neo_tooltip');
    foreach ($operations as $op => &$link) {
      // A slot that does not offer an operation leaves an empty array there.
      if (!is_array($link) || empty($link['#title'])) {
        continue;
      }
      // The module hands every link the same Url object, and rendering a link
      // merges its #attributes into the Url's options, so without a copy each
      // link would also carry its siblings' --{op} classes.
      if (isset($link['#url']) && is_object($link['#url'])) {
        $link['#url'] = clone $link['#url'];
      }
      $label = $link['#title'];
      $link['#title'] = [
        '#type' => 'html_tag',
        '#tag' => 'span',
        '#value' => $label,
        '#attributes' => ['class' => ['visually-hidden']],
      ];
      $link['#attributes']['class'][] = 'office-hours-action';
      $link['#attributes']['class'][] = 'office-hours-action--' . $op;
      if ($tooltips) {
        // A string, not markup: neo_tooltip passes markup as a template,
        // which makes the tooltip interactive. It repeats the accessible name,
        // so screen readers are spared the aria-describedby.
        $link['#tooltip'] = (string) $label;
        $link['#tooltip_options'] = ['describedElsewhere' => TRUE];
      }
      else {
        $link['#attributes']['title'] = (string) $label;
      }
      // Spacing comes from the grid; the module's trailing space would add to
      // it.
      $link['#suffix'] = '';
    }
    unset($link);
    $operations['#prefix'] = '<div class="office-hours-actions">';
    $operations['#suffix'] = '</div>';
  }

}
