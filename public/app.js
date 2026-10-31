'use strict';
const $ = (s) => document.querySelector(s);
const state = { feeds: [], items: [], feed: null, idx: -1 };

const api = async (path, opts = {}) => {
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
};
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); };
const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };

async function loadFeeds() {
  state.feeds = await api('/api/feeds');
  const total = state.feeds.reduce((n, f) => n + f.unread, 0);
  $('#feeds').innerHTML =
    `<div data-id="" class="${state.feed ? '' : 'active'}"><span>🌕 All feeds</span><span class="count">${total || ''}</span></div>` +
    state.feeds.map((f) => `<div data-id="${f.id}" class="${state.feed === f.id ? 'active' : ''}"><span>${esc(f.title)}</span><span><span class="count">${f.unread || ''}</span> <span class="del" data-del="${f.id}">✕</span></span></div>`).join('');
}

async function loadItems() {
  const q = new URLSearchParams();
  if (state.feed) q.set('feed', state.feed);
  if ($('#unread-only').checked) q.set('unread', '1');
  state.items = await api('/api/items?' + q);
  const names = Object.fromEntries(state.feeds.map((f) => [f.id, f.title]));
  $('#items').innerHTML = state.items.length
    ? state.items.map((it, i) => `<div class="item ${it.read ? 'read' : ''} ${i === state.idx ? 'active' : ''}" data-i="${i}"><div>${esc(it.title)}</div><div class="meta">${esc(names[it.feedId])} · ${ago(it.published)}</div></div>`).join('')
    : '<p class="empty" style="padding:14px">Nothing stirs in the graveyard. Summon a feed above.</p>';
}

async function setRead(it, read) {
  if (it.read === read) return;
  it.read = read;
  await api(`/api/items/${it.id}/read`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read }) });
  loadFeeds();
}

function show(i) {
  if (i < 0 || i >= state.items.length) return;
  state.idx = i;
  const it = state.items[i];
  document.querySelectorAll('.item').forEach((el) => el.classList.toggle('active', +el.dataset.i === i));
  document.querySelector(`.item[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  $('#reader').innerHTML = `<h2><a href="${esc(it.link)}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a></h2><p class="empty">${new Date(it.published).toLocaleString()}</p><div class="content">${it.summary || ''}</div>`;
  $('#reader').querySelectorAll('a').forEach((a) => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  setRead(it, true).then(() => document.querySelector(`.item[data-i="${i}"]`)?.classList.add('read'));
}

async function refresh() {
  toast('Raising the dead…');
  const r = await api('/api/refresh', { method: 'POST' });
  toast(`${r.added} new post${r.added === 1 ? '' : 's'}${r.errors.length ? ` · ${r.errors.length} feed(s) failed` : ''}`);
  await loadFeeds(); await loadItems();
}

$('#add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const f = await api('/api/feeds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: $('#add-url').value }) });
    $('#add-url').value = '';
    toast(`🧟 ${f.title} has risen`);
    await loadFeeds(); await loadItems();
  } catch (err) { toast('⚠️ ' + err.message); }
});

$('#feeds').addEventListener('click', async (e) => {
  const del = e.target.dataset.del;
  if (del) {
    if (!confirm('Bury this feed?')) return;
    await api('/api/feeds/' + del, { method: 'DELETE' });
    if (state.feed === del) state.feed = null;
  } else {
    const row = e.target.closest('[data-id]');
    if (!row) return;
    state.feed = row.dataset.id || null;
  }
  state.idx = -1;
  await loadFeeds(); await loadItems();
});

$('#items').addEventListener('click', (e) => { const row = e.target.closest('.item'); if (row) show(+row.dataset.i); });
$('#unread-only').addEventListener('change', () => { state.idx = -1; loadItems(); });
$('#refresh').addEventListener('click', refresh);
$('#opml').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast('Importing…');
  const r = await api('/api/opml', { method: 'POST', body: await file.text() });
  toast(`Imported ${r.imported} of ${r.total} feeds`);
  await loadFeeds(); await loadItems();
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'j') show(state.idx + 1);
  else if (e.key === 'k') show(state.idx - 1);
  else if (e.key === 'o' && state.items[state.idx]) window.open(state.items[state.idx].link, '_blank', 'noopener');
  else if (e.key === 'm' && state.items[state.idx]) { const it = state.items[state.idx]; setRead(it, !it.read).then(loadItems); }
  else if (e.key === 'r') refresh();
});

loadFeeds().then(loadItems);
