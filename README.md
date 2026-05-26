# GSC Bulk Indexer

**Automated bulk URL indexing for Google Search Console**

Batch-submit hundreds of URLs for indexing through the Google Search Console URL Inspection tool. Paste a plain list or a raw sitemap.xml — the extension inspects each URL, skips anything already indexed, clicks Request Indexing, and dismisses the confirmation dialog. No waiting around.

**Developer**: [Nasratul nayem](https://github.com/nasratulnayem)

---

## Features

| Feature | Detail |
|---|---|
| **Bulk submit** | Paste any number of URLs or an entire sitemap.xml |
| **Auto-skip indexed** | Checks each URL in 3 seconds; if already on Google it moves on |
| **Quota detection** | Stops when your daily Request Indexing quota is exhausted |
| **Auto-dismiss** | Closes the confirmation dialog as soon as it appears — no manual clicks |
| **Resumable** | Stop mid-run and restart; completed URLs are remembered |
| **Sitemap support** | Paste a raw sitemap.xml — URLs are extracted automatically |
| **Real-time telemetry** | Progress bar, per-URL status, ETA, and a full log panel |
| **Dark retro UI** | Synthwave terminal aesthetic with monospace fonts, scanlines, and phosphor glow |

## How it works

1. **Paste** a list of URLs or a sitemap.xml into the popup textarea
2. **Open** your Search Console property URL Inspection tab (`search.google.com/search-console`)
3. **Click RUN** — the extension cycles through every URL:
   - Types the URL into the Inspect input
   - Waits for the URL status to load
   - If *already indexed* → skips (3s check)
   - If *not indexed* → clicks **Request Indexing** → dismisses dialog → next URL

## Demo

```
Paste URLs       Click RUN      Watch progress     Done ✓
┌─────────┐      ┌──────┐      ┌────────────┐    ┌──────┐
│ URL list │ ──▶  │ RUN  │ ──▶  │ ████████░░ │ ──▶ │ 42/42│
│ sitemap  │      │      │      │   ETA 4m    │    │ ✓42  │
└─────────┘      └──────┘      └────────────┘    └──────┘
```

## Installation

### Via GitHub Release (recommended)

1. Go to the **[Releases](https://github.com/nasratulnayem/gsc-bulk-indexer/releases)** page
2. Download the latest `gsc-bulk-indexer-v*.zip`
3. Unzip the archive to a folder on your machine
4. Open `brave://extensions` (or `chrome://extensions`)
5. Toggle **Developer mode** (top-right)
6. Click **Load unpacked** and select the unzipped folder

### Via Git clone

```bash
git clone https://github.com/nasratulnayem/gsc-bulk-indexer.git
# Then load-unpacked from brave://extensions
```

## Usage

| Control | Action |
|---|---|
| **RUN** | Start processing all URLs in the list |
| **HALT** | Stop after the current URL finishes |
| **CHECK** | Probe the current Search Console tab for debugging |
| **RESET** | Clear results and logs (keeps the URL list) |
| **SCAN** / **SUBMIT** | Timing knobs for status check and request wait time (defaults work well) |

### Resuming a run

If you stop mid-run and click **RUN** again with the same URL list, the extension picks up where it left off — already-succeeded URLs are skipped automatically.

## Privacy

- No analytics, no servers, no third-party SDKs
- No data leaves your browser
- No network requests beyond communicating with `search.google.com` (which you are already using)
- All state is stored in `chrome.storage.local` — local to your browser only

## Permissions

| Permission | Why |
|---|---|
| `storage` | Persists URL list, results, and logs across popup opens |
| `tabs` | Detects the active Search Console tab |
| `scripting` | Injects the content script into the Search Console page if needed |
| `https://search.google.com/*` | Required host permission to run on Search Console |

## Development

```bash
# Build a clean distribution zip
./build.sh
# Output: dist/ (loadable) + chrome-web-store-upload.zip
```

### Project structure

```
gsc-bulk-indexer/
├── manifest.json          # Extension manifest
├── build.sh               # Build script for distribution
├── popup/
│   ├── popup.html         # Popup UI (all CSS inline)
│   ├── popup.js           # Popup logic
│   └── fonts/             # Spline Sans Mono + Workbench fonts
├── content/
│   └── content.js         # Search Console automation script
├── icons/                 # Extension icons (16–128px)
└── store-assets/          # Chrome Web Store listing assets
```

## Links

- **GitHub**: [github.com/nasratulnayem/gsc-bulk-indexer](https://github.com/nasratulnayem/gsc-bulk-indexer)
- **Releases**: [Releases page](https://github.com/nasratulnayem/gsc-bulk-indexer/releases)

---

<p align="center">Built by <a href="https://github.com/nasratulnayem">Nasratul nayem</a></p>
