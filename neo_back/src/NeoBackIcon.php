<?php

namespace Drupal\neo_back;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\neo_icon\IconElementInterface;

/**
 * Gives admin buttons, action links and groups the icon their label names.
 *
 * Labels are looked up in neo_icon's registry, in the vocabulary
 * neo_back.neo.icon.yml declares for each: `button` for submits and a form's
 * Cancel and Delete links, `group` for accordion items such as the entity
 * form sidebar's. Never the `admin` set, which is tuned for menu labels ("Load
 * more" would take its spinner).
 *
 * Submits get theirs in neo_back_preprocess_input__submit(), groups in
 * neo_back_preprocess_accordion_item(), and links, which have no preprocess
 * of their own, in preRenderLink().
 */
class NeoBackIcon implements TrustedCallbackInterface {

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks() {
    return ['preRenderLink'];
  }

  /**
   * Looks up the icon a button or action link's label names.
   *
   * The unprefixed definitions every module shares take part too, behind the
   * `button` ones: "Reset" is neo_icon's trash-undo.
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
  public static function forButton(
    mixed $label,
    bool $icon_only = FALSE,
  ): ?IconElementInterface {
    if (!static::isLookupable($label)) {
      return NULL;
    }
    $icon = neo_icon($label, NULL, NULL, ['button']);
    if (!$icon->getIcon()) {
      return NULL;
    }
    return $icon_only ? $icon->iconOnly() : $icon;
  }

  /**
   * Looks up the icon a group's title names.
   *
   * Only a `group` definition counts. The unprefixed ones every module shares
   * would reach groups this was never meant for: the Alchemist's style
   * accordion has a "Color scheme" item, which neo_color's own definition
   * would give a swatchbook.
   *
   * @param mixed $title
   *   The title the lookup reads, as a string or translatable markup.
   * @param mixed $display
   *   What the icon element shows beside the icon, when that is not the title
   *   itself: a title a preprocess has already wrapped for rendering.
   *
   * @return \Drupal\neo_icon\IconElementInterface|null
   *   The title with its icon, or NULL when the title names none.
   */
  public static function forGroup(
    mixed $title,
    mixed $display = NULL,
  ): ?IconElementInterface {
    if (!static::isLookupable($title)) {
      return NULL;
    }
    /** @var \Drupal\neo_icon\IconRepositoryInterface $repository */
    $repository = \Drupal::service('neo_icon.repository');
    $match = $repository->getMatch((string) $title, ['group']);
    if (!$match || !in_array('group', $match['prefix'], TRUE)) {
      return NULL;
    }
    $icon = neo_icon($display ?? $title, $match['icon']);
    return $icon->getIcon() ? $icon : NULL;
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
    $icon = static::forButton($element['#title'] ?? NULL);
    if ($icon) {
      $element['#title'] = $icon;
    }
    return $element;
  }

  /**
   * Whether a label is text a lookup can read.
   *
   * @param mixed $label
   *   The label.
   *
   * @return bool
   *   TRUE for a non-empty string or translatable markup that is not already
   *   an icon element.
   */
  protected static function isLookupable(mixed $label): bool {
    return !$label instanceof IconElementInterface
      && (is_string($label) || $label instanceof MarkupInterface)
      && trim((string) $label) !== '';
  }

}
