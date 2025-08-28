<?php

namespace Drupal\neo_base;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements trusted prerender callbacks for the Claro theme.
 *
 * @internal
 */
class NeoBaseProcess {

  /**
   * Process callback for elements that support groups.
   */
  public static function group(&$element, FormStateInterface $form_state, &$complete_form) {
    if (empty($element['#group_type']) && !empty($element['#group']) && !empty($element['#groups'][$element['#group']]['#group_exists'])) {
      $path = explode('][', $element['#group']);
      $group = NestedArray::getValue($complete_form, $path);
      if (isset($group['#type'])) {
        $element['#group_type'] = $group['#group_type'] ?? $group['#type'];
      }
    }
    return $element;
  }

  /**
   * Process callback for elements that support groups.
   */
  public static function submit(&$element, FormStateInterface $form_state, &$complete_form) {
    $element['#title'] = $element['#title'] ?? $element['#value'];

    // Add the label as a data attribute. This allows styling on the value.
    if (!is_array($element['#value'])) {
      $element['#attributes']['data-label'] = trim(strip_tags(strtolower((string) $element['#value'])));
    }

    // Disabled as this now seems to work.
    $form_object = $form_state->getFormObject();
    switch ($form_object->getFormId()) {
      case 'entity_form_display_edit_form':
      case 'entity_view_display_edit_form':
        // Force submit buttons to be rendered as input elements to allow Drupal
        // to properly bind ajax behaviors.
        if (!empty($element['#ajax']) && isset($element['#op']) && $element['#op'] === 'refresh_table') {
          $element['#as_input'] = TRUE;
        }
        break;
    }

    return $element;
  }

}
