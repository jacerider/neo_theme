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
