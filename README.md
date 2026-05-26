# GSC Bulk Indexer

<p align="center">
  <img src="icons/icon-128.png" alt="GSC Bulk Indexer" width="96"><br>
  <b>Batch URL indexing automation for Google Search Console</b><br>
  <i>Submit hundreds of URLs for indexing. Auto-skip already-indexed. Detect quota limits. Zero manual work.</i>
</p>

<p align="center">
  <a href="https://github.com/nasratulnayem/gsc-bulk-indexer/releases"><img src="https://img.shields.io/github/v/release/nasratulnayem/gsc-bulk-indexer?style=flat&label=release&color=ff5fc7"></a>
  <a href="https://github.com/nasratulnayem/gsc-bulk-indexer"><img src="https://img.shields.io/github/stars/nasratulnayem/gsc-bulk-indexer?style=flat&label=stars&color=22eaff"></a>
  <a href="https://github.com/nasratulnayem/gsc-bulk-indexer/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-ffb000?style=flat"></a>
</p>

---

## What is this?

**GSC Bulk Indexer** is a browser extension (Brave / Chrome) that automates submitting multiple URLs for indexing through the **Google Search Console URL Inspection tool**.

If you manage SEO for a website, you know the pain of manually inspecting each URL, waiting for results, clicking "Request Indexing," and dismissing the dialog — then repeating for the next URL. This extension does it all for you.

### Who needs this

- SEO professionals managing bulk reindexing after site migrations or content updates
- Site owners with newly published content that needs fast indexing
- Agencies handling indexing requests across multiple client properties
- Anyone tired of repetitive manual URL inspection in Search Console

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Paste URLs or sitemap.xml            ┌───────────────┐  │
│  2. Open Search Console URL Inspection   │   60 URLs     │  │
│  3. Click RUN                            │  ████████░░   │  │
│     ┌─────────────────────────────────┐  │  ✓ 48  ✗ 2   │  │
│     │ ✓ Already indexed → skip (3s)  │  │  ETA 4m       │  │
│     │ ✗ Not indexed → Request        │  └───────────────┘  │
│     │   Indexing → dismiss dialog    │                      │
│     └─────────────────────────────────┘                      │
│  4. Done — results logged, resume anytime                   │
└─────────────────────────────────────────────────────────────┘
```

### Step by step

1. **Paste** a list of URLs (one per line) or an entire sitemap.xml into the extension popup
2. **Navigate** to your Search Console property's **URL Inspection** page
3. **Click RUN** — the extension takes over:
   - Types each URL into the Inspect search box
   - Waits for Google to check the URL status
   - **Already indexed?** Detected in ~3 seconds → automatically skipped
   - **Not indexed?** Clicks "Request Indexing" → dismisses the confirmation dialog → moves to next
4. **Done.** Review results in the popup. Stop and resume anytime — completed URLs are remembered.

---

## Features

| Feature | What it does for you |
|---|---|
| **Bulk submission** | Paste any number of URLs or a full sitemap.xml — URLs extracted automatically |
| **Smart skip** | Already-indexed URLs detected in ~3 seconds and skipped without requesting |
| **Quota protection** | Detects daily "Request Indexing" limit exceeded and stops automatically |
| **Auto-dismiss** | Confirmation dialog closed immediately — no waiting around |
| **Resume support** | Stop mid-run, restart with the same list — successful URLs are remembered |
| **Sitemap parsing** | Paste raw XML (even with namespaces) — only page URLs are extracted |
| **Real-time telemetry** | Progress bar, live per-URL status, ETA, and full activity log |
| **Dark terminal UI** | Synthwave retro aesthetic with monospace fonts, scanlines, and neon glow |
| **Zero data leak** | No analytics, no servers, no third-party SDKs. Everything stays in your browser |

---

## Installation

### Option 1: Download & load (easiest)

1. Go to the **[Releases page](https://github.com/nasratulnayem/gsc-bulk-indexer/releases)**
2. Download the latest `gsc-bulk-indexer-v*.zip`
3. Unzip to a folder on your computer
4. Open `brave://extensions` or `chrome://extensions`
5. Enable **Developer mode** (toggle in top-right)
6. Click **Load unpacked** and select the unzipped folder

### Option 2: Clone from source

```bash
git clone https://github.com/nasratulnayem/gsc-bulk-indexer.git
# Then: brave://extensions → Developer mode → Load unpacked
```

---

## Usage

### Controls

| Button | Action |
|---|---|
| **RUN** | Start processing all URLs in the queue |
| **HALT** | Stop after the current URL completes |
| **CHECK** | Debug — probe the Search Console page for matching buttons |
| **RESET** | Clear results and logs (keeps the URL list) |
| **SCAN** / **SUBMIT** | Timeout sliders for status check / request wait (defaults work for most) |

### Resuming a run

Stop mid-run, then click **RUN** again with the same URL list. The extension picks up where it left off — already-succeeded URLs are skipped. Useful for large batches when you need to pause.

### Tips

- Start with a small batch (5-10 URLs) to verify everything works on your property
- Keep the Search Console tab visible and active — the extension types and clicks in that tab
- The default timeout values (20s scan, 40s submit) work well for most sites

---

## Privacy & security

This extension was built with privacy as a core requirement.

- **No analytics.** No tracking pixels, no telemetry, no usage data collected
- **No servers.** The extension communicates only with `search.google.com` — which you are already using
- **No third-party code.** Zero external SDKs, CDNs, or remote scripts
- **Local storage only.** All state (URL list, results, logs) is stored in your browser's `chrome.storage.local`
- **Open source.** Every line of code is visible in this repository

---

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `storage` | Saves your URL list, results, and logs across popup sessions |
| `tabs` | Finds the active Search Console tab to communicate with |
| `scripting` | Injects the automation script into the Search Console page if needed |
| `https://search.google.com/*` | Required to read from and interact with Search Console |

---

## Frequently asked questions

### Does this work with Chrome?

Yes. The extension works in both **Brave** and **Google Chrome** — any Chromium-based browser that supports Manifest V3 extensions.

### Does it violate Google's terms?

The extension automates what you can already do manually through the Search Console UI — it types URLs, reads results, and clicks buttons. It does not circumvent rate limits, scrape data, or access private APIs. Use responsibly.

### How fast is it?

Each URL takes roughly 10-50 seconds depending on Google's response time:
- ~3 seconds to check if already indexed (fast skip)
- ~5-30 seconds if "Request Indexing" is needed (waiting for the button to appear)
- ~1-2 seconds to dismiss the dialog

A batch of 100 URLs typically completes in 15-45 minutes.

### What happens when I hit the daily quota?

Google limits how many URLs you can request indexing per day. When the quota is exceeded, the extension detects the quota dialog, logs it, and stops automatically — no wasted attempts.

### Can I leave it running in the background?

The Search Console tab must remain open and active. The extension types into the page and clicks buttons — it needs the tab to be loaded and focused.

---

## Development

```bash
# Build a clean distribution package
./build.sh
# Output: dist/           → ready for Load unpacked
#         chrome-web-store-upload.zip → ready for store upload
```

### Project structure

```
gsc-bulk-indexer/
├── manifest.json          # Extension manifest (Manifest V3)
├── build.sh               # Build & packaging script
├── popup/
│   ├── popup.html         # UI (inline CSS, synthwave theme)
│   ├── popup.js           # Popup logic & state management
│   └── fonts/             # Spline Sans Mono + Workbench
├── content/
│   └── content.js         # Search Console automation engine
├── icons/                 # Extension icons (16–256px)
└── store-assets/          # Chrome Web Store listing assets
```

---

## Links

- **GitHub**: [github.com/nasratulnayem/gsc-bulk-indexer](https://github.com/nasratulnayem/gsc-bulk-indexer)
- **Download**: [Releases page](https://github.com/nasratulnayem/gsc-bulk-indexer/releases)
- **Author**: [Nasratul nayem](https://github.com/nasratulnayem)

---

<p align="center">
  <sub>Built for SEO professionals who value their time.</sub><br>
  <sub>GSC Bulk Indexer is not affiliated with or endorsed by Google.</sub>
</p>
