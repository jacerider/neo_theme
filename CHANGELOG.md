# Changelog

## neo_base displace and sticky no longer require jQuery

**`neo_base/displace` and `neo_base/sticky` no longer declare `core/jquery`.**
Both used jQuery only to trigger and listen for `drupalViewportOffsetChange`
and to bind a window resize handler, so any page attaching them loaded jQuery
even when nothing else on it needed it. They now use plain DOM events, and a
page with no other jQuery consumer no longer downloads it.

- The event keeps its name, and jQuery is still used whenever the page has it:
  displace then triggers `drupalViewportOffsetChange` through jQuery exactly as
  core's `drupal.displace` does, so existing jQuery listeners keep receiving
  the offsets as their second argument.
- Without jQuery on the page, displace dispatches it as a native
  `CustomEvent` on `document`, with the offsets in `event.detail`.
- Displace and sticky listen both natively and, when the page has jQuery,
  through it, so core's `drupal.displace` (the admin toolbar) still updates the
  offsets and the stuck state.
- Code that listened with `$(document).on('drupalViewportOffsetChange', …)` on
  a page that only had jQuery because of these libraries must now declare
  `core/jquery` itself.

## 1.1.18 — 2026-10-29

- The admin theme is set in neo_font's UI font.

## 1.1.17 — 2026-10-26

- Solid slot buttons get a border in their own fill colour.

## 1.1.16 — 2026-10-22

- A long admin page title stays on the line with its icon.
- The media library widget's Edit button is drawn as a pencil circle.

## 1.1.15 — 2026-10-14

- The SEO accordion group gets the meta tags icon. The theme no longer matches
  it itself, since neo_seo ships the icon.
- Admin listing links have their hover colour back.

## 1.1.14 — 2026-10-01

- The admin canvas is shaded in the base colour only.

## 1.1.13 — 2026-10-01

- A header action can ask to show as its icon alone. An entity form's Preview
  shows that way, and its Delete comes last, as a solid icon.
- A "MetaTags" sidebar group gets the meta tags icon.
- The entity form status band is outlined on every side, and the canvas edge
  shading is softer.

## 1.1.12 — 2026-10-01

- Vertical tabs slide the selected tab's card between tabs and fade the pane
  in. The selected tab reads as navigation, not as a primary button.
- Entity form horizontal tabs slide one 3px marker bar between tabs and fade
  the pane in.
- The admin canvas wash keeps covering the page while a modal blurs it.

## 1.1.11 — 2026-09-28

Admin theme (`neo_back`) refresh:

- The admin canvas is lit and shaded towards its edges, cards lift, and the
  primary action glows. Every filled `btn` can cast a glow (on in the admin),
  and Remove buttons are outlined.
- Content entity form actions move into the sticky page header, and Done
  buttons get the check-square icon.
- Button and sidebar group icons resolve from the neo_icon registry rather
  than CSS labels, adding icons for the menu settings, URL alias and search
  engine groups.
- Media library: the admin media grid is styled, and transparent images and
  SVG thumbnails sit whole on a contrast-picked checkerboard.
- Inline entity form tables get a heading label and status icon, and nested
  forms are inset one form-item step.
- The office hours widget is restyled for the admin theme.
- Every widget's add button is `btn-xs` and spaced from the table above.
- Fixes: the entity form sidebar stays in the viewport beside wide content;
  horizontal tab panes no longer clip tooltips; the empty column toggle no
  longer opens a gap above overflowing tables; the solid alert style no longer
  blanks an entity form's Delete link; a submit relabelled in `#after_build`
  renders its current value; a widget wrapper left empty by `#group` is
  hidden; `btn-group` styling applies to Drupal's `.button`.

## 1.1.10 — 2026-09-19

- A details description is hidden once it has become the summary's tooltip.

## 1.1.9 — 2026-09-18

- New `grid_tiles` option style for rich, self-describing options.
- The inherited `#neo_size` reaches the built form.
- A legend is dressed as a header bar only when it has a body.
- Webform's inline filter row and the gap above the lower bulk submit are
  restored, and the media item's remove glyph is centred.

## 1.1.8 — 2026-09-16

- `.table--wrapper` uses the top-margin rhythm, and Commerce's dashboard
  report tables line up side by side.

## 1.1.7 — 2026-09-16

- Forms: invalid fields get a visual state (carried onto tom-select too), the
  destructive button is quieter, the range input is styled, and list markers
  are back in descriptions.
- The admin scope gets its own fieldset and details cards.
- New inline buttons text style for checkboxes and radios.
- The help trigger is a "?" badge rather than an icon-font glyph, renders
  everywhere a field is named (multi-value table headers included) and sits
  on the label's line.
- A multi-value field's table header is styled like the field label, and its
  empty actions column is gone.
- Fixes: a composite's wrapper attributes no longer render twice; the details
  description id is restored; the page title block drops its content
  container; the media library's remove button uses the trash icon.

## 1.1.6 — 2026-09-11

- Sticky table columns are budgeted against the scrollport they leave.
- The page title block skips its layout classes when visually hidden.

## 1.1.5 — 2026-09-01

- A spanning table row holds its label at the edge while the table scrolls.
- Sticky table headers: the real header row stays in the layout with the
  clone laid over it, aligned with its columns; a wide table no longer
  scrolls the page and draws its own sticky scrollbar.
- The permissions table is restyled, its checkboxes centred.

## 1.1.4 — 2026-08-27

- Table classes for the content-type column key.
- Calls `TableProps::get()` instead of the deprecated `neo_table_props()`.

## 1.1.3 — 2026-08-27

- The page title block gets container and horizontal padding classes.

## 1.1.2 — 2026-08-27

- Sticky observes only vertically sticky elements and batches its
  measurements.

## 1.1.1 — 2026-08-25

- Tables pin the title column to the left edge alongside sticky operations.

## 1.1.0 — 2026-08-22

- Every Tailwind utility is declared in the CSS import entrypoints.

## Releases before 1.1.0 are not recorded

This file was started in October 2026. The releases from `1.1.0` on were
recorded afterwards from their commits; earlier ones are in the git history
only.
