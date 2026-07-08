# @kitbase/analytics

## 0.1.9

### Patch Changes

- Stop counting text selection as clicks. Double/triple-clicks now track a single `click` event, and a click that finishes a text-selection drag inside an `input` or `textarea` is not tracked. Dead click detection now skips form fields (`textarea` and all `input` types except `button`, `submit`, `reset`, `image`), whose expected click response never mutates the DOM.

## 0.1.7

### Patch Changes

- Add bfcache restore pageview tracking for MPA sites. When a page is restored from the browser's back-forward cache, a `screen_view` event is now sent automatically. This can be disabled with `trackBfcacheRestore: false` in the analytics config.