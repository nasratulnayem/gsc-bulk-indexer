const $ = (id) => document.getElementById(id);
const URL_REGEX = /https?:\/\/[^\s<>"'`]+/g;

function parseUrls(text) {
  const matches = text.match(URL_REGEX) || [];
  const cleaned = matches
    .map((u) => u.replace(/[)\].,;]+$/, ''))
    .filter((u) => /^https?:\/\//.test(u));
  return [...new Set(cleaned)];
}

function renderLog(entries) {
  const log = $('log');
  log.innerHTML = '';
  for (const e of entries) {
    const div = document.createElement('div');
    div.className = e.level || 'info';
    div.textContent = `[${new Date(e.t).toLocaleTimeString()}] ${e.msg}`;
    log.appendChild(div);
  }
  log.scrollTop = log.scrollHeight;
}

function shortUrl(u) {
  try {
    const x = new URL(u);
    return x.pathname + x.search;
  } catch {
    return u;
  }
}

function renderUrls(state) {
  const panel = $('urlsPanel');
  panel.innerHTML = '';
  const urls = state.urls || [];
  const results = state.results || [];
  const resultByUrl = new Map(results.map((r) => [r.url, r]));
  const currentIdx = state.currentIndex ?? -1;
  const running = state.status === 'running';
  let scrollTarget = null;
  urls.forEach((u, i) => {
    const div = document.createElement('div');
    div.className = 'u';
    const icon = document.createElement('span');
    icon.className = 'icon';
    const text = document.createElement('span');
    text.className = 'text';
    text.title = u;
    text.textContent = shortUrl(u);
    const r = resultByUrl.get(u);
    if (r) {
      if (r.ok) {
        div.classList.add('ok');
        icon.textContent = '●';
      } else {
        div.classList.add('err');
        icon.textContent = '×';
        text.title = `${u}\n${r.note || ''}`;
      }
    } else if (running && i === currentIdx) {
      div.classList.add('current');
      icon.textContent = '▶';
      scrollTarget = div;
    } else {
      div.classList.add('pending');
      icon.textContent = '○';
    }
    div.appendChild(icon);
    div.appendChild(text);
    panel.appendChild(div);
  });
  if (scrollTarget) scrollTarget.scrollIntoView({ block: 'nearest' });
}

function fmtETA(state) {
  if (state.status !== 'running' || !state.startedAt) return '';
  const done = state.results?.length || 0;
  if (done === 0) return '';
  const elapsed = Date.now() - state.startedAt;
  const perItem = elapsed / done;
  const remaining = (state.urls.length - done) * perItem;
  const mins = Math.round(remaining / 60000);
  return ` · ETA ${mins}m`;
}

function pad(n, w = 3) {
  return String(n).padStart(w, '0');
}

function renderStatus(state) {
  const total = state.urls?.length || 0;
  const done = state.results?.length || 0;
  const ok = (state.results || []).filter((r) => r.ok).length;
  const fail = done - ok;
  const pct = total ? Math.min(100, (done / total) * 100) : 0;
  $('progress').style.width = `${pct}%`;
  const sum = $('summary');
  sum.innerHTML = '';
  const w = (cls, text) => {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  };
  if (state.status === 'running') {
    sum.append(
      w('', '▶ TRANSMITTING · '),
      w('', `${pad(done)}/${pad(total)} `),
      w('', `· ✓${ok} ✗${fail}`),
      w('', fmtETA(state)),
    );
  } else if (state.status === 'done') {
    sum.append(
      w('', '◉ COMPLETE · '),
      w('', `✓${ok} ✗${fail} / ${total}`),
    );
  } else if (state.status === 'stopped') {
    sum.append(
      w('', '■ HALTED · '),
      w('', `${pad(done)}/${pad(total)} · ✓${ok} ✗${fail}`),
    );
  } else if (state.status === 'error') {
    sum.append(w('', `✗ FAULT · ${state.error || ''}`));
  } else if (total) {
    sum.append(w('', `READY · ${total} URLs in buffer`));
  } else {
    sum.append(w('', 'IDLE · load URLs to begin'));
  }
  renderUrls(state);
  renderLog(state.logs || []);
  const running = state.status === 'running';
  $('start').disabled = running;
  $('stop').disabled = !running;
}

async function getState() {
  const { state } = await chrome.storage.local.get('state');
  return state || { status: 'idle', logs: [], results: [], urls: [] };
}

async function setState(patch) {
  const current = await getState();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ state: next });
  return next;
}

async function getActiveGscTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !/^https:\/\/search\.google\.com\//.test(tab.url || '') || !tab.url.includes('search-console')) {
    return null;
  }
  return tab;
}

// Persist textarea content on every input
let saveTimer = null;
$('input').addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ inputText: $('input').value });
  }, 250);
});
$('waitInspect').addEventListener('change', () => {
  chrome.storage.local.set({ waitInspect: $('waitInspect').value });
});
$('waitRequest').addEventListener('change', () => {
  chrome.storage.local.set({ waitRequest: $('waitRequest').value });
});

function fireSweep() {
  const el = $('sweep');
  if (!el) return;
  el.classList.remove('run');
  // force reflow so the animation can restart
  void el.offsetWidth;
  el.classList.add('run');
  setTimeout(() => el.classList.remove('run'), 700);
}

$('start').addEventListener('click', async () => {
  const urls = parseUrls($('input').value);
  if (urls.length === 0) {
    alert('No http(s):// URLs found in input.');
    return;
  }
  fireSweep();
  const tab = await getActiveGscTab();
  if (!tab) {
    alert(
      'Open the Search Console URL Inspection tab first:\nhttps://search.google.com/search-console\nSelect your property, then click RUN.',
    );
    return;
  }
  const waitInspect = Math.max(3, parseInt($('waitInspect').value, 10) || 20);
  const waitRequest = Math.max(5, parseInt($('waitRequest').value, 10) || 40);

  const prev = await getState();
  const sameList =
    Array.isArray(prev.urls) &&
    prev.urls.length === urls.length &&
    prev.urls.every((u, i) => u === urls[i]);
  const prevOk = sameList
    ? (prev.results || []).filter((r) => r.ok).length
    : 0;

  const baseLogs = sameList ? (prev.logs || []) : [];
  const resumed = sameList && prevOk > 0;
  baseLogs.push({
    t: Date.now(),
    level: 'info',
    msg: resumed
      ? `Resuming — skipping ${prevOk} already-succeeded, ${urls.length - prevOk} remaining`
      : `Starting — ${urls.length} URLs queued`,
  });

  await chrome.storage.local.set({
    state: {
      status: 'running',
      urls,
      currentIndex: 0,
      results: sameList ? prev.results || [] : [],
      logs: baseLogs,
      waitInspect,
      waitRequest,
      tabId: tab.id,
      startedAt: resumed ? prev.startedAt || Date.now() : Date.now(),
    },
  });

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'START' });
  } catch (e) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js'],
    });
    await new Promise((r) => setTimeout(r, 500));
    await chrome.tabs.sendMessage(tab.id, { type: 'START' });
  }
});

$('stop').addEventListener('click', async () => {
  const tab = await getActiveGscTab();
  if (tab) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'STOP' });
    } catch {}
  }
  await setState({ status: 'stopped' });
});

$('clear').addEventListener('click', async () => {
  await setState({ logs: [], results: [] });
});

$('probe').addEventListener('click', async () => {
  const tab = await getActiveGscTab();
  if (!tab) {
    alert('Switch to a Search Console tab first.');
    return;
  }
  try {
    let resp;
    try {
      resp = await chrome.tabs.sendMessage(tab.id, { type: 'PROBE' });
    } catch {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js'],
      });
      await new Promise((r) => setTimeout(r, 400));
      resp = await chrome.tabs.sendMessage(tab.id, { type: 'PROBE' });
    }
    const state = await getState();
    const logs = (state.logs || []).concat([
      { t: Date.now(), level: 'info', msg: '— probe —' },
      ...(resp?.dump || ['(no candidates)']).map((d) => ({
        t: Date.now(),
        level: 'info',
        msg: '  ' + d,
      })),
    ]);
    await chrome.storage.local.set({ state: { ...state, logs } });
  } catch (e) {
    alert('Probe failed: ' + e.message);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.state) {
    renderStatus(changes.state.newValue);
  }
});

(async () => {
  const stored = await chrome.storage.local.get([
    'state',
    'inputText',
    'waitInspect',
    'waitRequest',
  ]);
  if (stored.inputText) $('input').value = stored.inputText;
  if (stored.waitInspect) $('waitInspect').value = stored.waitInspect;
  if (stored.waitRequest) $('waitRequest').value = stored.waitRequest;
  renderStatus(stored.state || { status: 'idle', logs: [], results: [], urls: [] });
})();
