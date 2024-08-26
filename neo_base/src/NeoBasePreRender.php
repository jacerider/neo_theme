<?php

namespace Drupal\neo_base;

use Drupal\Core\Security\TrustedCallbackInterface;

/**
 * Implements trusted prerender callbacks for the Claro theme.
 *
 * @internal
 */
class NeoBasePreRender implements TrustedCallbackInterface {

  /**
   * Prerender callback for managed_file.
   */
  public static function group($element) {
    if (is_array($element['#attributes']['class']) && in_array('field-option', $element['#attributes']['class'])) {
      // ksm($element);
    }

    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks() {
    return [
      'group',
    ];
  }

}
