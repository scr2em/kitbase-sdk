# @kitbase/analytics

## 0.1.7

### Patch Changes

- Add bfcache restore pageview tracking for MPA sites. When a page is restored from the browser's back-forward cache, a `screen_view` event is now sent automatically. This can be disabled with `trackBfcacheRestore: false` in the analytics config.