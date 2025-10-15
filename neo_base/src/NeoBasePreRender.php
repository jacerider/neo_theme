<?php

namespace Drupal\neo_base;

use Drupal\Component\Utility\Html;
use Drupal\Core\Render\Element;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\Core\Template\Attribute;

/**
 * Implements trusted prerender callbacks for the Claro theme.
 *
 * @internal
 */
class NeoBasePreRender implements TrustedCallbackInterface {

  /**
   * Prerender callback for radios.
   */
  public static function radios($element) {
    $requiredStates = NULL;
    if (!empty($element['#states']['required'])) {
      $requiredStates = $element['#states']['required'];
    }
    foreach (Element::children($element) as $key) {
      $child = &$element[$key];
      if ($element['#item_attributes'] ?? FALSE) {
        $attributes = new Attribute($element['#item_attributes']);
        $child['#label_attributes'] = $attributes->toArray();
      }
      if ($requiredStates) {
        $child['#states']['required'] = $requiredStates;
      }
      $child['#neo_style'] = $child['#neo_style'] ?? $element['#neo_style'] ?? 'default';
      $child['#neo_size'] = $child['#neo_size'] ?? $element['#neo_size'] ?? 'md';
    }
    return $element;
  }

  /**
   * Prerender callback for commerce product rendered attribute.
   */
  public static function commerceProductRenderedAttribute($element) {
    return self::radios($element);
  }

  /**
   * Prerender callback for checkboxes.
   */
  public static function checkboxes($element) {
    foreach (Element::children($element) as $key) {
      $child = &$element[$key];
      if ($element['#item_attributes'] ?? FALSE) {
        $attributes = new Attribute($element['#item_attributes']);
        $child['#label_attributes'] = $attributes->toArray();
      }
      $child['#belongs_to_checkboxes'] = TRUE;
      $child['#neo_style'] = $child['#neo_style'] ?? $element['#neo_style'] ?? 'default';
      $child['#neo_size'] = $child['#neo_size'] ?? $element['#neo_size'] ?? 'md';
    }
    return $element;
  }

  /**
   * Prerender callback for vertical tabs.
   */
  public static function verticalTabs($element) {
    if (empty($element['#printed'])) {
      $group = implode('][', $element['#parents']);
      foreach (Element::children($element['group']['#groups'][$group]) as $key) {
        $child = $element['group']['#groups'][$group][$key];
        if (isset($child['#type']) && $child['#type'] === 'details') {
          // Set group type so child detail elements uses the proper template.
          $element['group']['#groups'][$group][$key]['#group_type'] = 'vertical_tabs';
        }
      }
      if (!static::hasVisibleChildren($element['group']['#groups'][$group])) {
        $element['#printed'] = TRUE;
      }
    }
    return $element;
  }

  /**
   * Check if element has visible children.
   */
  public static function hasVisibleChildren($element) {
    foreach (Element::getVisibleChildren($element) as $key) {
      $child = $element[$key];
      if (isset($child['#type']) && $child['#type'] === 'details') {
        if (!empty(Element::getVisibleChildren($child))) {
          return TRUE;
        }
        if (isset($child['#group'])) {
          $child = $child['#groups'][implode('][', $child['#parents'])];
          if (static::hasVisibleChildren($child)) {
            return TRUE;
          }
        }
      }
      else {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Prerender callback for table.
   */
  public static function table($element) {
    $globalClasses = [];
    $count = 0;
    $props = [
      'style',
      'size',
      'align',
    ];

    // Ensure neo properties are arrays.
    foreach ($props as $prop) {
      if (isset($element["#neo_$prop"]) && !is_array($element["#neo_$prop"])) {
        $element["#neo_$prop"] = [];
      }
    }

    if ($element['#type'] === 'tableselect') {
      $element['#neo_size'][key($element['#header'])] = 'min';
    }

    switch ($element['#theme']) {
      case 'table__menu_overview':
        $element['#neo_size'] = [
          1 => 'min',
          3 => 'min',
        ];
        break;
    }

    foreach ($props as $prop) {
      if (!isset($element["#neo_$prop"])) {
        continue;
      }
      if (!is_array($element["#neo_$prop"])) {
        // Tables need their neo props to be an array.
        continue;
      }
      foreach ($element["#neo_$prop"] as $i => $size) {
        $globalClasses[$i][] = $prop . '--' . $size;
        if (isset($element['#header'][$i])) {
          $key = array_search($i, array_keys($element['#header']));
          if ($key !== FALSE) {
            $globalClasses[$key][] = $prop . '--' . $size;
            $globalClasses[$key] = array_unique($globalClasses[$key]);
          }
        }
        $count++;
      }
    }

    $count = 0;
    $headerKeys = [];
    foreach ($element['#header'] as $i => $data) {
      $key = is_array($data) ? $i : ((string) $data ?: $i);
      if (in_array($i, ['operations', 'operations-links'])) {
        if (!is_array($element['#header'][$i])) {
          $element['#header'][$i] = ['data' => $element['#header'][$i]];
        }
        $element['#header'][$i]['class'][] = 'sticky-right';
      }
      if ($key && !is_int($key)) {
        $headerKeys[$count] = Html::getClass($key);
      }
      $count++;
    }

    foreach ($element['#rows'] as $i => $data) {
      if (!isset($element['#rows'][$i]['data'])) {
        $element['#rows'][$i] = ['data' => $data];
      }
      $row = &$element['#rows'][$i]['data'];
      $count = 0;
      foreach ($row as $ii => $cellData) {
        $cellClasses = NULL;
        if (!is_array($element['#rows'][$i]['data'][$ii])) {
          $element['#rows'][$i]['data'][$ii] = ['data' => $element['#rows'][$i]['data'][$ii]];
        }
        else {
          $cellClasses = $element['#rows'][$i]['data'][$ii]['class'] ?? [];
          $cellClasses = is_array($cellClasses) ? $cellClasses : [$cellClasses];
          unset($element['#rows'][$i]['data'][$ii]['class']);
        }
        if (!isset($element['#rows'][$i]['data'][$ii]['data'])) {
          $data = array_filter($element['#rows'][$i]['data'][$ii], fn($v) => is_array($v));
          $dataProps = array_filter($element['#rows'][$i]['data'][$ii], fn($v) => !is_array($v));
          $element['#rows'][$i]['data'][$ii] = ['data' => $data] + $dataProps;
        }
        $cell = &$element['#rows'][$i]['data'][$ii];
        $classes = $cell['class'] ?? [];
        $classes = is_array($classes) ? $classes : [$classes];
        if ($cellClasses) {
          $classes = array_merge($classes, $cellClasses);
        }
        if (isset($globalClasses[$ii])) {
          $classes = array_merge($classes, $globalClasses[$ii]);
        }
        // Hide columns that are only a hidden input.
        // Use in menu management.
        if (isset($cell['data']) && is_array($cell['data']) && isset($cell['data']['#type']) && $cell['data']['#type'] === 'hidden') {
          $classes[] = 'hidden';
        }
        $overridden = FALSE;
        foreach ($props as $prop) {
          if (isset($cell["#neo_$prop"])) {
            $overridden = TRUE;
            if (!empty($cell["#neo_$prop"])) {
              $classes[] = $prop . '--' . $cell["#neo_$prop"];
            }
          }
          if (is_array($cell['data']) && isset($cell['data']["#neo_$prop"])) {
            $overridden = TRUE;
            if (!empty($cell['data']["#neo_$prop"])) {
              $classes[] = $prop . '--' . $cell['data']["#neo_$prop"];
            }
          }
        }
        if (isset($headerKeys[$count])) {
          $classes[] = 'td--' . $headerKeys[$count];
          if (!$overridden) {
            foreach (self::getTableClassesByKey($headerKeys[$count], $ii) as $class) {
              $classes[] = $class;
            }
          }
        }
        $cell['class'] = $classes;
        $count++;
      }
    }

    return $element;
  }

  /**
   * Preprocess callback for views table.
   */
  public static function viewsTable(&$headers = [], &$rows = []) {
    $headerKeys = [];
    $count = 0;
    foreach ($headers as $i => $data) {
      $key = is_array($data['content']) ? $i : ($data['content'] ?: $i);
      if ($name = Html::getClass((string) $key)) {
        $headerKeys[$count] = $name;
        $headers[$i]['attributes']->addClass('th--' . $name);
        if (in_array($name, ['operations', 'operations-links'])) {
          $headers[$i]['attributes']->addClass('sticky-right');
        }
      }
      $count++;
    }
    $props = neo_table_props();
    foreach ($rows as $i => $row) {
      $count = 0;
      foreach ($row['columns'] as $ii => $column) {
        if (isset($headerKeys[$count])) {
          /** @var \Drupal\Core\Template\Attribute $attributes */
          $attributes = $rows[$i]['columns'][$ii]['attributes'];
          $attributes->addClass('td--' . $headerKeys[$count]);
          if (in_array($headerKeys[$count], ['operations', 'operations-links'])) {
            $attributes->addClass('sticky-right');
          }
          if ($keyClasses = self::getTableClassesByKey($headerKeys[$count], $ii)) {
            foreach ($keyClasses as $keyClass) {
              [$type, $value] = explode('--', $keyClass . '--');
              if (!isset($props['neo_' . $type])) {
                continue;
              }
              // If we already have a class for this type, skip it.
              $prop = $props['neo_' . $type];
              if ($type && $value) {
                foreach ($prop['options'] as $option => $label) {
                  if ($attributes->hasClass($type . '--' . $option)) {
                    continue 2;
                  }
                }
              }
              $attributes->addClass($keyClass);
            }
          }
        }
        $count++;
      }
    }
  }

  /**
   * Get table classes by key.
   */
  public static function getTableClassesByKey($primary, $secondary = NULL): array {
    if (str_contains($primary, '-bulk-form') !== FALSE) {
      return ['size--min'];
    }
    return match($primary) {
      'title' => ['style--heading'],
      'label' => ['style--heading'],
      'name' => ['style--heading'],
      'vocabulary-name' => ['style--heading'],
      'media-name' => ['style--heading'],
      'username' => ['style--heading'],
      'id' => ['size--min', 'style--xs'],
      'type' => ['size--min', 'style--xs'],
      'categories' => ['size--min'],
      'operations' => ['size--min', 'sticky-right'],
      'operation-links' => ['size--min', 'sticky-right'],
      'machine-name' => ['size--min', 'style--xs'],
      'author' => ['size--min', 'style--xs'],
      'owner' => ['size--min', 'style--xs'],
      'results' => ['size--min', 'style--xs'],
      'created' => ['size--min', 'style--xs'],
      'changed' => ['size--min', 'style--xs'],
      'updated' => ['size--min', 'style--xs'],
      'field-name' => ['size--min', 'style--xs'],
      'field-type' => ['size--min', 'style--xs'],
      'roles' => ['size--min', 'style--xs'],
      'member-for' => ['size--min', 'style--xs'],
      'last-access' => ['size--min', 'style--xs'],
      'access' => ['size--min', 'style--xs'],
      'description' => ['style--xs'],
      'status' => ['size--min', 'align--center'],
      default => match($secondary) {
        'type' => ['size--min'],
        default => [],
      },
    };
  }

  /**
   * Prerender callback for table.
   */
  public static function tokenTreeTable($element) {
    $element['#attributes']['class'][] = 'm-0';
    $element['#neo_style'] = [
      // 'name' => 'heading',
      'token' => 'xs',
      'description' => 'xs',
    ];
    return self::table($element);
  }

  /**
   * Handle neo regions.
   */
  public static function neoRegion($element) {
    if (!empty($element['#title'])) {
      foreach (Element::children($element) as $key) {
        if (isset($element[$key]['#neo_region']) && !in_array($element[$key]['#type'] ?? '', ['fieldset', 'details', 'accordion'])) {
          // Currently supports placing 'legend_start' and 'legend_end'.
          $element['#neo_region'][$element[$key]['#neo_region']][$key] = $element[$key];
          unset($element[$key]);
        }
      }
    }
    else {
      $element['#title_display'] = 'invisible';
    }
    return $element;
  }

  /**
   * Assign neo_size to children.
   */
  public static function neoSize(array $element) {
    $element['#neo_size'] = $element['#neo_size'] ?? 'md';
    foreach (Element::children($element) as $key) {
      $child = &$element[$key];
      if (is_array($child) && isset($child['#type'])) {
        $child['#neo_size'] = $child['#neo_size'] ?? $element['#neo_size'];
        self::neoSize($child);
      }
    }
    return $element;
  }

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks() {
    return [
      'radios',
      'checkboxes',
      'verticalTabs',
      'table',
      'tokenTreeTable',
      'commerceProductRenderedAttribute',
      'neoRegion',
      'neoSize',
    ];
  }

}
