# Privacy Policy — GSC Bulk Indexer

_Developer: Nasratul nayem_

This extension does not collect, transmit, sell, or share any personal information. Everything stays in your browser.

## Local storage

Uses `chrome.storage.local` to remember your URL list, timing settings, and run results on your device only. Never sent off-device.

## Runtime behavior

When you click EXEC, URLs are sent to a content script in your Search Console tab. All traffic is between your browser and Google — same as using Search Console manually.

## Permissions

- `storage` — save URL list and settings locally
- `tabs` — find the active Search Console tab
- `scripting` — inject the content script
- `https://search.google.com/*` — only domain the extension interacts with

## Contact

Nasratul nayem
