# Store Listing — GSC Bulk Indexer

## Name

```
GSC Bulk Indexer
```

## Short description

```
Batch-submit URLs to Google Search Console for indexing. Auto-skips already-indexed URLs, detects quota limits, dismisses dialogs.
```

## Detailed description

```
GSC Bulk Indexer automates submitting multiple URLs through the Google Search Console URL Inspection tool for indexing requests.

HOW IT WORKS
1. Paste URLs or a sitemap.xml into the popup.
2. Open your Search Console URL Inspection page.
3. Click RUN — it types each URL, checks if already indexed (skips in 3s), clicks Request Indexing, and dismisses the dialog.

FEATURES
- Auto-skip already-indexed URLs (3-second check per URL)
- Sitemap.xml support — paste the entire XML, URLs are extracted automatically
- Quota detection — stops when your daily Request Indexing limit is hit
- Auto-dismiss confirmation dialogs immediately
- Resume support — remembers completed URLs if stopped mid-run
- Real-time progress bar, per-URL status, and full activity log
- Dark retro synthwave UI with monospace fonts

Developer: Nasratul nayem
```

## Screenshots

- [1-idle.png](screenshots/01-idle.png) — The popup in its initial state with the URL paste area and controls
- [2-running.png](screenshots/02-running.png) — Active batch processing with progress bar and log
- [3-done.png](screenshots/03-done.png) — Completed run showing results summary
