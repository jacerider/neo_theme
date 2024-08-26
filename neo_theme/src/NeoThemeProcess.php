<?php

namespace Drupal\neo_theme;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements trusted prerender callbacks for the Claro theme.
 *
 * @internal
 */
class NeoThemeProcess {

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
      if (in_array('visibility_tabs', $path)) {
        $element['#group_type'] = 'vertical_tabs';
      }
    }
    return $element;
  }

}
