<?php

namespace Drupal\neo_back;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\neo_icon\IconElementInterface;

/**
 * Gives a button or action link the icon its label names.
 *
 * A label is looked up in neo_icon's registry under the `button` prefix, so
 * the lookup sees neo_back.neo.icon.yml and the unprefixed definitions every
 * module shares, never the `admin` set, which is tuned for menu labels ("Load
 * more" would take its spinner).
 *
 * Submits get theirs in neo_back_preprocess_input__submit(); links, which have
 * no such preprocess, in preRenderLink().
 */
class NeoBackButtonIcon implements TrustedCallbackInterface {

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks() {
    return ['preRenderLink'];
  }

  /**
   * Looks up the icon a label names.
   *
   * @param mixed $label
   *   The label, as a string or translatable markup. A render array, or a
   *   label that is already an icon element, is not looked up.
   * @param bool $icon_only
   *   Whether the label is for screen readers only, leaving just the icon.
   *
   * @return \Drupal\neo_icon\IconElementInterface|null
   *   The label with its icon, or NULL when the label names none.
   */
  public static function lookup(
    mixed $label,
    bool $icon_only = FALSE,
  ): ?IconElementInterface {
    if (
      $label instanceof IconElementInterface
      || !(is_string($label) || $label instanceof MarkupInterface)
      || trim((string) $label) === ''
    ) {
      return NULL;
    }
    $icon = neo_icon($label, NULL, NULL, ['button']);
    if (!$icon->getIcon()) {
      return NULL;
    }
    return $icon_only ? $icon->iconOnly() : $icon;
  }

  /**
   * Pre-render callback for link elements: a form's Cancel and Delete links.
   *
   * They are recognised by the id the form builder gives them, which ends in
   * the key they were built under wherever the form then put them: an entity
   * or confirm form's actions, a footer a form moved its actions into, and
   * the copies NeoBackFormActions makes for the page header.
   *
   * Runs ahead of core's own link pre-render (see
   * neo_back_element_info_alter()), which turns the #title into markup.
   *
   * @param array $element
   *   The link element.
   *
   * @return array
   *   The element, its #title carrying an icon when the label names one.
   */
  public static function preRenderLink(array $element): array {
    $id = $element['#id'] ?? NULL;
    if (!is_string($id) || !preg_match('/(^|-)(cancel|delete)$/', $id)) {
      return $element;
    }
    $icon = static::lookup($element['#title'] ?? NULL);
    if ($icon) {
      $element['#title'] = $icon;
    }
    return $element;
  }

}
