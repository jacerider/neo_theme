<?php

namespace Drupal\neo_base;

use Drupal\Component\Utility\Html;
use Drupal\Core\Render\Element;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\Core\Template\Attribute;
use Drupal\neo\Helpers\TableProps;

/**
 * Implements trusted prerender callbacks for the Claro theme.
 *
 * @internal
 */
class NeoBasePreRender implements TrustedCallbackInterface {

  /**
   * How many columns may be pinned to the left edge.
   *
   * Must not exceed the number of --sticky-left-N custom properties declared in
   * src/css/table.css: a column beyond that has no offset to read and would pin
   * on top of its neighbour.
   */
  const STICKY_MAX_LEFT = 3;

  /**
   * How many columns may be pinned to the right edge.
   *
   * Bounded by the --sticky-right-N custom properties. See STICKY_MAX_LEFT.
   */
  const STICKY_MAX_RIGHT = 2;

  /**
   * Highest column index that may pin left from a label-derived default.
   *
   * Column keys come from the rendered header label, so a wide report view with
   * a late column labelled "Name" or "Title" would otherwise pin everything to
   * its left and leave nothing to scroll. Explicit configuration is exempt --
   * an editor asking for it knows what they want.
   */
  const STICKY_AUTO_LEFT_MAX_INDEX = 1;

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
    // Props flagged 'apply' => FALSE (currently neo_sticky) are not independent
    // per-cell classes and are resolved separately below.
    $props = array_map(
      fn ($key) => str_replace('neo_', '', $key),
      array_keys(array_filter(TableProps::get(), fn ($prop) => ($prop['apply'] ?? TRUE) !== FALSE))
    );

    // Ensure neo properties are arrays.
    foreach (array_merge($props, ['sticky']) as $prop) {
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
    $intent = [];
    $headerSpans = FALSE;
    foreach ($element['#header'] as $i => $data) {
      $key = is_array($data) ? $i : ((string) $data ?: $i);
      if ($key && !is_int($key)) {
        $headerKeys[$count] = Html::getClass($key);
      }
      if (is_array($data) && ($data['colspan'] ?? 1) > 1) {
        $headerSpans = TRUE;
      }
      // Headers here can be keyed by label or by machine name, so fall back to
      // the array key when the label yields nothing usable.
      $autoKey = $headerKeys[$count] ?? (is_int($i) ? '' : Html::getClass((string) $i));
      $intent[$count] = self::getStickyIntent(
        $element['#neo_sticky'][$i] ?? NULL,
        $autoKey,
        $count
      );
      $count++;
    }

    $columnCount = $count;
    // A header cell spanning several columns (the menu overview's operations
    // group, for one) means a header index no longer equals a column position,
    // so nothing downstream can be pinned to the right place. Skip the table.
    $sticky = $headerSpans ? [] : self::resolveStickyColumns($intent, $columnCount);
    $count = 0;
    foreach ($element['#header'] as $i => $data) {
      if (!empty($sticky[$count])) {
        if (!is_array($element['#header'][$i])) {
          $element['#header'][$i] = ['data' => $element['#header'][$i]];
        }
        foreach ($sticky[$count] as $class) {
          $element['#header'][$i]['class'][] = $class;
        }
      }
      $count++;
    }

    foreach ($element['#rows'] as $i => $data) {
      if (!isset($element['#rows'][$i]['data'])) {
        $element['#rows'][$i] = ['data' => $data];
      }
      $row = &$element['#rows'][$i]['data'];
      // A row that does not line up with the header one cell per column -- a
      // tabledrag region title, a Field UI section heading, an empty-table
      // message -- cannot be matched to a column by position, so it gets no
      // sticky classes. Presentational classes keep their existing (equally
      // positional, but harmless when wrong) behaviour.
      $rowIsAligned = count($row) === $columnCount;
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
        // A cell spanning several columns has no single column to pin to.
        if ($rowIsAligned && empty($cell['colspan']) && !empty($sticky[$count])) {
          $classes = array_merge($classes, $sticky[$count]);
        }
        // Hide columns that are only a hidden input.
        // Use in menu management.
        if (isset($cell['data']) && is_array($cell['data']) && isset($cell['data']['#type']) && $cell['data']['#type'] === 'hidden') {
          $classes[] = 'hidden';
        }
        // Track which prop types (style/size/align) have been explicitly set
        // for this cell, so the label-based default for the same type can be
        // skipped and the two don't fight. An explicit override may come from
        // a cell-level #neo_* prop or a table-level #neo_* array (the latter
        // already merged into $globalClasses above). Tracking the type — not a
        // single "overridden" flag — means an explicit #neo_style suppresses
        // only the style--* default, leaving size--*/align--* defaults intact.
        $overriddenProps = [];
        foreach ($props as $prop) {
          if (isset($cell["#neo_$prop"])) {
            $overriddenProps[$prop] = TRUE;
            if (!empty($cell["#neo_$prop"])) {
              $classes[] = $prop . '--' . $cell["#neo_$prop"];
            }
          }
          if (is_array($cell['data']) && isset($cell['data']["#neo_$prop"])) {
            $overriddenProps[$prop] = TRUE;
            if (!empty($cell['data']["#neo_$prop"])) {
              $classes[] = $prop . '--' . $cell['data']["#neo_$prop"];
            }
          }
        }
        if (isset($globalClasses[$ii])) {
          foreach ($globalClasses[$ii] as $globalClass) {
            $overriddenProps[explode('--', $globalClass)[0]] = TRUE;
          }
        }
        if (isset($headerKeys[$count])) {
          $classes[] = 'td--' . $headerKeys[$count];
          foreach (self::getTableClassesByKey($headerKeys[$count], $ii) as $class) {
            if (isset($overriddenProps[explode('--', $class)[0]])) {
              continue;
            }
            $classes[] = $class;
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
   *
   * @param array $headers
   *   The header rows, keyed by views column id.
   * @param array $rows
   *   The result rows.
   * @param array $info
   *   The table style plugin's per-column options, keyed by the same column ids
   *   as $headers. Supplies the neo_sticky value an editor chose in the Views
   *   UI. Optional so existing callers keep working.
   */
  public static function viewsTable(&$headers = [], &$rows = [], array $info = []) {
    $headerKeys = [];
    $intent = [];
    $count = 0;
    foreach ($headers as $i => $data) {
      $key = is_array($data['content']) ? $i : ($data['content'] ?: $i);
      if ($name = Html::getClass((string) $key)) {
        $headerKeys[$count] = $name;
        $headers[$i]['attributes']->addClass('th--' . $name);
      }
      $intent[$count] = self::getStickyIntent(
        $info[$i]['neo_sticky'] ?? NULL,
        $headerKeys[$count] ?? '',
        $count
      );
      $count++;
    }

    $sticky = self::resolveStickyColumns($intent, $count);
    $count = 0;
    foreach ($headers as $i => $data) {
      foreach ($sticky[$count] ?? [] as $class) {
        $headers[$i]['attributes']->addClass($class);
      }
      $count++;
    }

    $props = TableProps::get();
    foreach ($rows as $i => $row) {
      $count = 0;
      foreach ($row['columns'] as $ii => $column) {
        /** @var \Drupal\Core\Template\Attribute $attributes */
        $attributes = $rows[$i]['columns'][$ii]['attributes'];
        foreach ($sticky[$count] ?? [] as $class) {
          $attributes->addClass($class);
        }
        if (isset($headerKeys[$count])) {
          $attributes->addClass('td--' . $headerKeys[$count]);
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
      'operations' => ['size--min'],
      'operations-links' => ['size--min'],
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
   * Get the default sticky edge for a table column key.
   *
   * Kept apart from ::getTableClassesByKey() on purpose. Those classes are
   * per-cell presentation and can be applied where they are found; sticky has
   * to survive ::resolveStickyColumns() first, which needs to see every column
   * before it can say which ones actually pin.
   *
   * @param string $key
   *   The normalized column key.
   *
   * @return string|null
   *   'left', 'right', or NULL when the column has no default.
   */
  public static function getTableStickyByKey(string $key): ?string {
    return match($key) {
      'title', 'label', 'name', 'vocabulary-name', 'media-name', 'username' => 'left',
      'operations', 'operations-links' => 'right',
      default => NULL,
    };
  }

  /**
   * Resolve one column's sticky intent from configuration and defaults.
   *
   * @param string|null $configured
   *   The saved neo_sticky value: 'left', 'right', 'none', or empty for auto.
   * @param string $key
   *   The normalized column key, used for the auto default.
   * @param int $index
   *   The column's position, used to bound the auto default.
   *
   * @return string|null
   *   'left', 'right', 'none', or NULL.
   */
  protected static function getStickyIntent(?string $configured, string $key, int $index): ?string {
    if (!empty($configured)) {
      // An explicit choice is honoured wherever the column sits.
      return $configured;
    }
    $auto = $key ? self::getTableStickyByKey($key) : NULL;
    if ($auto === 'left' && $index > self::STICKY_AUTO_LEFT_MAX_INDEX) {
      return NULL;
    }
    return $auto;
  }

  /**
   * Work out which columns pin, and to which edge.
   *
   * Pinning a column implies pinning everything between it and the edge --
   * otherwise the columns in between scroll away and leave a gap the pinned
   * column floats over. So the intent of a single column expands into a
   * contiguous group.
   *
   * @param array $intent
   *   Column index => 'left', 'right', 'none' or NULL. Indexes are positions in
   *   the header row, not column ids.
   * @param int $columnCount
   *   Total number of columns.
   *
   * @return array
   *   Column index => list of classes to add. Only ever adds; a caller never
   *   has to remove anything it applied earlier.
   */
  public static function resolveStickyColumns(array $intent, int $columnCount): array {
    if ($columnCount < 2) {
      // A single column has nothing to scroll past.
      return [];
    }

    $lastLeft = NULL;
    $firstRight = NULL;
    foreach ($intent as $index => $side) {
      if ($index < 0 || $index >= $columnCount) {
        continue;
      }
      if ($side === 'left') {
        $lastLeft = $lastLeft === NULL ? $index : max($lastLeft, $index);
      }
      elseif ($side === 'right') {
        $firstRight = $firstRight === NULL ? $index : min($firstRight, $index);
      }
    }

    // The two groups must not meet. When they would, the right group wins: its
    // columns hold the actions, which are worth more than a readable label.
    if ($lastLeft !== NULL && $firstRight !== NULL && $lastLeft >= $firstRight) {
      $lastLeft = $firstRight - 1;
      if ($lastLeft < 0) {
        $lastLeft = NULL;
      }
    }

    // A group with more columns than CSS has offsets for would pin its overflow
    // on top of its neighbours. Dropping the whole group fails obviously rather
    // than subtly.
    if ($lastLeft !== NULL && ($lastLeft + 1) > self::STICKY_MAX_LEFT) {
      $lastLeft = NULL;
    }
    if ($firstRight !== NULL && ($columnCount - $firstRight) > self::STICKY_MAX_RIGHT) {
      $firstRight = NULL;
    }

    $classes = [];
    if ($lastLeft !== NULL) {
      for ($i = 0; $i <= $lastLeft; $i++) {
        $classes[$i][] = 'sticky--left';
        $classes[$i][] = 'sticky-left--' . $i;
      }
      $classes[$lastLeft][] = 'sticky--left-edge';
    }
    if ($firstRight !== NULL) {
      for ($i = $firstRight; $i < $columnCount; $i++) {
        // Ordinals count inwards from the edge, so the rightmost column is 0.
        $classes[$i][] = 'sticky--right';
        $classes[$i][] = 'sticky-right--' . ($columnCount - 1 - $i);
      }
      $classes[$firstRight][] = 'sticky--right-edge';
    }

    return $classes;
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
        if (isset($element[$key]['#neo_region']) && !in_array($element[$key]['#type'] ?? '', [
          'fieldset',
          'details',
          'accordion',
        ])) {
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
    $element['#attributes']['data-neo-size'] = $element['#neo_size'];
    if (($element['#neo_size_inherit'] ?? TRUE) !== FALSE) {
      foreach (Element::children($element) as $key) {
        $child = &$element[$key];
        if (is_array($child) && isset($child['#type'])) {
          $child['#neo_size'] = $child['#neo_size'] ?? $element['#neo_size'];
          self::neoSize($child);
        }
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
