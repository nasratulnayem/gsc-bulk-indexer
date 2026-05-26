// Content script for GSC Bulk Request Indexing extension.
// Runs the per-URL workflow inside a Google Search Console tab.

(() => {
  if (window.__gscBulkLoaded) return;
  window.__gscBulkLoaded = true;

  const REQUEST_PHRASES = [
    'request indexing',
    'request index',
    'requesting indexing',
    '请求编入索引',
    '请求建立索引',
    '请求索引',
    '编入索引',
    'demander une indexation',
    'solicitar indexación',
    'indexierung anfordern',
  ];
  const CLOSE_PHRASES = [
    'got it',
    'ok',
    'okay',
    'close',
    'dismiss',
    'done',
    '知道了',
    '确定',
    '关闭',
    '了解了',
    '完成',
    'compris',
    'entendido',
    'verstanden',
  ];
  const INDEXING_DIALOG_PHRASES = [
    'indexing requested',
    'request submitted',
    'request indexing',
    'url was added',
    'priority crawl queue',
    'quota',
    'exceeded',
    'temporarily unavailable',
    '请求编入索引',
    '请求建立索引',
    '请求索引',
    '已请求',
    '请求已提交',
    '配额',
    '暂时无法',
  ];
  const INDEXED_PHRASES = [
    'url is on google',
    'url is live',
    '索引盖',
    '已编入索引',
    '已索引',
    'indexiert',
    'indexée',
    'indexada',
  ];
  const NOT_INDEXED_PHRASES = [
    'url is not on google',
    'not indexed',
    '未编入索引',
    '未索引',
    'nicht indexiert',
    'non indexée',
    'no indexada',
  ];
  const QUOTA_DIALOG_PHRASES = [
    'quota exceeded',
    'exceeded quota',
    'daily quota',
    '超出了配额',
    '每日配额',
  ];

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  let stopRequested = false;

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    try {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = window.getComputedStyle(el);
      return (
        cs.display !== 'none' &&
        cs.visibility !== 'hidden' &&
        cs.opacity !== '0'
      );
    } catch {
      return false;
    }
  }

  function isClickable(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    if (tag === 'BUTTON' || tag === 'A') return true;
    const role = el.getAttribute?.('role');
    if (role === 'button' || role === 'link') return true;
    if (el.hasAttribute?.('jsaction')) return true;
    if (el.hasAttribute?.('jslog')) return true;
    if (el.hasAttribute?.('onclick')) return true;
    if (el.hasAttribute?.('data-action')) return true;
    try {
      if (window.getComputedStyle(el).cursor === 'pointer') return true;
    } catch {}
    return false;
  }

  function* eachDocument(root = document) {
    yield root;
    const iframes = root.querySelectorAll('iframe');
    for (const ifr of iframes) {
      try {
        if (ifr.contentDocument) yield* eachDocument(ifr.contentDocument);
      } catch {}
    }
  }

  function getOwnText(el) {
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += n.textContent;
    }
    return s.trim();
  }

  function findByText(phrases) {
    const lc = phrases.map((p) => p.toLowerCase());
    const matches = [];
    for (const doc of eachDocument()) {
      const els = doc.querySelectorAll('*');
      for (const el of els) {
        if (!isVisible(el)) continue;
        const own = getOwnText(el).toLowerCase();
        if (!own) continue;
        // require either exact-ish match or short-enough container that includes phrase
        if (
          lc.some(
            (p) =>
              own === p ||
              (own.length <= p.length + 30 && own.includes(p)),
          )
        ) {
          matches.push(el);
        }
      }
    }
    if (matches.length === 0) return null;
    // prefer the smallest / deepest match
    matches.sort((a, b) => {
      const da = depth(a),
        db = depth(b);
      if (da !== db) return db - da;
      return (a.textContent?.length || 0) - (b.textContent?.length || 0);
    });
    const leaf = matches[0];
    // walk up to find clickable ancestor (cap at 8 levels)
    let cur = leaf;
    for (let i = 0; i < 8 && cur; i++) {
      if (isClickable(cur) && isVisible(cur)) return cur;
      cur = cur.parentElement;
    }
    return leaf;
  }

  function depth(el) {
    let d = 0;
    while (el && el.parentElement) {
      d++;
      el = el.parentElement;
    }
    return d;
  }

  async function waitForText(phrases, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (stopRequested) throw new Error('Stopped by user');
      const el = findByText(phrases);
      if (el) return el;
      await wait(500);
    }
    return null;
  }

  function robustClick(el) {
    try {
      el.focus?.();
    } catch {}
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const mouseInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
      clientX: x,
      clientY: y,
    };
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', { ...mouseInit, pointerType: 'mouse' }));
    } catch {}
    el.dispatchEvent(new MouseEvent('mousedown', mouseInit));
    try {
      el.dispatchEvent(new PointerEvent('pointerup', { ...mouseInit, pointerType: 'mouse' }));
    } catch {}
    el.dispatchEvent(new MouseEvent('mouseup', mouseInit));
    el.dispatchEvent(new MouseEvent('click', mouseInit));
    // fallback to native click() too — covers some handlers
    try {
      el.click?.();
    } catch {}
  }

  function findInspectInput() {
    const sels = [
      'input[aria-label*="Inspect" i]',
      'input[aria-label*="检查" i]',
      'input[aria-label*="检测" i]',
      'input[placeholder*="Inspect" i]',
      'input[placeholder*="检查" i]',
      'input[placeholder*="检测" i]',
      'input[type="text"]',
      'input[type="url"]',
      'input[type="search"]',
    ];
    for (const sel of sels) {
      const inputs = document.querySelectorAll(sel);
      for (const el of inputs) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 200 && rect.top < 200 && isVisible(el)) return el;
      }
    }
    return document.querySelector('input');
  }

  async function typeAndSubmit(url) {
    const input = findInspectInput();
    if (!input) throw new Error('Could not find the Search Console URL inspection input');

    input.focus();
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set;
    setter.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(80);
    setter.call(input, url);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(80);

    const keyOpts = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
    };
    input.dispatchEvent(new KeyboardEvent('keydown', keyOpts));
    input.dispatchEvent(new KeyboardEvent('keypress', keyOpts));
    input.dispatchEvent(new KeyboardEvent('keyup', keyOpts));
  }

  async function setStatePatch(patch) {
    const { state } = await chrome.storage.local.get('state');
    const next = { ...(state || {}), ...patch };
    await chrome.storage.local.set({ state: next });
    return next;
  }

  async function appendLog(msg, level = 'info') {
    const { state } = await chrome.storage.local.get('state');
    const logs = (state?.logs || []).concat([{ t: Date.now(), level, msg }]);
    while (logs.length > 500) logs.shift();
    await chrome.storage.local.set({ state: { ...state, logs } });
  }

  async function recordResult(url, ok, note) {
    const { state } = await chrome.storage.local.get('state');
    const results = (state?.results || []).concat([
      { url, ok, note, t: Date.now() },
    ]);
    await chrome.storage.local.set({ state: { ...state, results } });
  }

  function dumpCandidates() {
    // for debugging: list any visible element whose own-text contains key tokens
    const tokens = ['index', '索引', 'request', '请求', '编入'];
    const out = [];
    for (const doc of eachDocument()) {
      for (const el of doc.querySelectorAll('button, a, [role="button"], [role="link"], [jsaction], [jslog]')) {
        if (!isVisible(el)) continue;
        const t = (el.innerText || el.textContent || '').trim();
        if (!t || t.length > 60) continue;
        if (tokens.some((tok) => t.toLowerCase().includes(tok))) {
          out.push(`<${el.tagName.toLowerCase()}> "${t}"`);
        }
      }
    }
    return out.slice(0, 12);
  }

  async function interruptibleWait(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (stopRequested) throw new Error('Stopped by user');
      await wait(500);
    }
  }

  async function processOne(url, waitInspect, waitRequest) {
    await appendLog(`▶ ${url}`, 'info');

    const leftoverDialog = isAnyDialogOpen();
    if (leftoverDialog) {
      if (isQuotaDialog(leftoverDialog)) {
        await appendLog('  ⚠ Daily quota exceeded, halting queue', 'err');
        await closeAnyOpenDialog(4000);
        await recordResult(url, false, 'Quota exceeded');
        stopRequested = true;
        return;
      }
      await appendLog('  ⓘ Leftover dialog detected, closing first', 'pending');
      await closeAnyOpenDialog(4000);
    }

    await typeAndSubmit(url);
    await appendLog('  URL entered, checking status…', 'pending');

    // poll for indexed/not-indexed status first (fast path)
    const indexedEl = await waitForText(INDEXED_PHRASES, 3000);
    if (indexedEl) {
      await appendLog('  ✓ Already indexed, skipping', 'ok');
      await recordResult(url, true, 'Already indexed');
      return;
    }

    const notIndexedEl = await waitForText(NOT_INDEXED_PHRASES, 4000);

    // poll up to 30s for the Request Indexing button (polls every 500ms, no fixed delay)
    const reqBtn = await waitForText(REQUEST_PHRASES, 30000);
    if (!reqBtn) {
      const dump = dumpCandidates();
      if (dump.length) {
        await appendLog(
          `  ⚠ Request Indexing button not found. Candidates: ${dump.join(' | ')}`,
          'err',
        );
      } else {
        await appendLog(
          '  ⚠ Request Indexing button not found (no clickable element matched "index"/"索引")',
          'err',
        );
      }
      await recordResult(url, false, 'Request button not found');
      return;
    }
    await appendLog(
      `  Button matched: <${reqBtn.tagName.toLowerCase()}> "${(
        reqBtn.innerText ||
        reqBtn.textContent ||
        ''
      )
        .trim()
        .slice(0, 60)}"`,
      'info',
    );
    robustClick(reqBtn);
    await appendLog('  Clicked, waiting for dialog…', 'pending');

    // poll for the result dialog and dismiss immediately (up to 30s safety)
    let dialogTimeout = 30000;
    const dialogInterval = 500;
    let dialogFound = false;
    while (dialogTimeout > 0) {
      if (stopRequested) throw new Error('Stopped by user');
      const resultDialog = isAnyDialogOpen();
      if (resultDialog) {
        if (isQuotaDialog(resultDialog)) {
          await appendLog('  ⚠ Daily quota exceeded, halting queue', 'err');
          await closeAnyOpenDialog(4000);
          await recordResult(url, false, 'Quota exceeded');
          stopRequested = true;
          return;
        }
        dialogFound = true;
        await appendLog('  ✓ Dialog appeared, dismissing…', 'info');
        await closeAnyOpenDialog(4000);
        break;
      }
      await wait(dialogInterval);
      dialogTimeout -= dialogInterval;
    }

    if (!dialogFound) {
      await appendLog('  ⚠ No result dialog appeared', 'err');
      await recordResult(url, false, 'No dialog');
      return;
    }
    await recordResult(url, true);
  }

  function isAnyDialogOpen() {
    for (const doc of eachDocument()) {
      const dialogs = doc.querySelectorAll(
        '[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]',
      );
      for (const d of dialogs) {
        if (isVisible(d) && isIndexingDialog(d)) return d;
      }
    }
    return null;
  }

  function isIndexingDialog(dialog) {
    const text = (dialog.innerText || dialog.textContent || '').trim().toLowerCase();
    if (!text) return false;
    return INDEXING_DIALOG_PHRASES.some((phrase) =>
      text.includes(phrase.toLowerCase()),
    );
  }

  function isQuotaDialog(dialog) {
    const text = (dialog.innerText || dialog.textContent || '').trim().toLowerCase();
    if (!text) return false;
    return QUOTA_DIALOG_PHRASES.some((phrase) => text.includes(phrase.toLowerCase()));
  }

  function findCloseButtonInDialog(dialog) {
    if (!dialog) return null;
    // 1. By aria-label
    const ariaSel =
      '[aria-label*="close" i],[aria-label*="dismiss" i],[aria-label*="关闭"],[aria-label*="知道了"],[aria-label*="确定"]';
    for (const el of dialog.querySelectorAll(ariaSel)) {
      if (isVisible(el)) return el;
    }
    // 2. By button/link text inside dialog
    const lc = CLOSE_PHRASES.map((p) => p.toLowerCase());
    const cands = dialog.querySelectorAll(
      'button, a, [role="button"], [role="link"], [jsaction], [jslog]',
    );
    for (const el of cands) {
      if (!isVisible(el)) continue;
      const t = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!t || t.length > 30) continue;
      if (lc.some((p) => t === p || t.includes(p))) return el;
    }
    // 3. Deepest text-node match within dialog → walk up
    const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
    let node;
    let best = null;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim().toLowerCase();
      if (!t) continue;
      if (lc.some((p) => t === p || (t.length <= p.length + 10 && t.includes(p)))) {
        best = node.parentElement;
        break;
      }
    }
    if (best) {
      let cur = best;
      for (let i = 0; i < 8 && cur; i++) {
        if (isClickable(cur) && isVisible(cur)) return cur;
        cur = cur.parentElement;
      }
      return best;
    }
    return null;
  }

  async function closeAnyOpenDialog(timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (stopRequested) throw new Error('Stopped by user');
      const dialog = isAnyDialogOpen();
      if (!dialog) return true;
      // try click first
      const btn = findCloseButtonInDialog(dialog) || findByText(CLOSE_PHRASES);
      if (btn) {
        robustClick(btn);
        await wait(800);
        if (!isAnyDialogOpen()) return true;
      }
      // try Esc — dispatch on document, body, and dialog itself
      const escInit = {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      };
      document.dispatchEvent(new KeyboardEvent('keydown', escInit));
      document.body?.dispatchEvent(new KeyboardEvent('keydown', escInit));
      dialog.dispatchEvent(new KeyboardEvent('keydown', escInit));
      (document.activeElement || document.body)?.dispatchEvent(
        new KeyboardEvent('keydown', escInit),
      );
      await wait(800);
      if (!isAnyDialogOpen()) return true;
      // try clicking outside (backdrop)
      const backdrop = document.querySelector(
        '[role="presentation"][aria-hidden], .cdk-overlay-backdrop, .modal-backdrop',
      );
      if (backdrop && isVisible(backdrop)) {
        robustClick(backdrop);
        await wait(800);
        if (!isAnyDialogOpen()) return true;
      }
      await wait(500);
    }
    return !isAnyDialogOpen();
  }

  async function runAll() {
    const { state } = await chrome.storage.local.get('state');
    if (!state || state.status !== 'running') return;

    const { urls, waitInspect, waitRequest } = state;
    const okSet = new Set(
      (state.results || []).filter((r) => r.ok).map((r) => r.url),
    );

    for (let i = 0; i < urls.length; i++) {
      if (stopRequested) break;
      await setStatePatch({ currentIndex: i });
      if (okSet.has(urls[i])) {
        // already successful in a prior pass — skip silently
        continue;
      }
      try {
        await processOne(urls[i], waitInspect, waitRequest);
      } catch (e) {
        if (e.message === 'Stopped by user') {
          await appendLog('  ✋ Stopped by user', 'err');
          break;
        }
        await appendLog(`  ❌ ${e.message}`, 'err');
        await recordResult(urls[i], false, e.message);
      }
      if (i < urls.length - 1) await wait(2000);
    }

    const final = stopRequested ? 'stopped' : 'done';
    await setStatePatch({ status: final });
    await appendLog(`Finished — status: ${final}`, 'info');
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'START') {
      stopRequested = false;
      runAll().catch(async (e) => {
        await appendLog(`Runtime error: ${e.message}`, 'err');
        await setStatePatch({ status: 'error', error: e.message });
      });
      sendResponse({ ok: true });
    } else if (msg?.type === 'STOP') {
      stopRequested = true;
      sendResponse({ ok: true });
    } else if (msg?.type === 'PING') {
      sendResponse({ ok: true });
    } else if (msg?.type === 'PROBE') {
      // debug helper: list candidate buttons on current page
      const dump = dumpCandidates();
      sendResponse({ ok: true, dump });
    }
    return true;
  });
})();
