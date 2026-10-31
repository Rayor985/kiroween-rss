'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseFeed, parseOpml, toOpml } = require('./lib/feed');
const store = require('./lib/store');

const PORT = Number(process.env.PORT) || 3666;
const MAX_ITEMS_PER_FEED = 500;
const REFRESH_MS = 30 * 60 * 1000;
const db = store.load();

const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

async function fetchFeed(url) {
  if (!/^https?:\/\//i.test(url)) throw new Error('Only http(s) URLs are allowed');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'LazarusReader/0.1 (+https://github.com/Rayor985/kiroween-rss)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text());
  } finally {
    clearTimeout(timer);
  }
}

function mergeItems(feed, parsed) {
  const known = new Set(db.items.filter((i) => i.feedId === feed.id).map((i) => i.id));
  let added = 0;
  for (const it of parsed.items) {
    const id = 'i_' + hash(feed.id + (it.guid || it.link || it.title));
    if (known.has(id)) continue;
    db.items.push({ id, feedId: feed.id, ...it, published: it.published || Date.now(), read: false });
    added++;
  }
  const mine = db.items.filter((i) => i.feedId === feed.id).sort((a, b) => b.published - a.published);
  if (mine.length > MAX_ITEMS_PER_FEED) {
    const drop = new Set(mine.slice(MAX_ITEMS_PER_FEED).map((i) => i.id));
    db.items = db.items.filter((i) => !drop.has(i.id));
  }
  return added;
}

async function subscribe(url, title) {
  url = url.trim();
  const existing = db.feeds.find((f) => f.url === url);
  if (existing) return existing;
  const parsed = await fetchFeed(url);
  const feed = { id: 'f_' + hash(url), url, title: title || parsed.title, siteUrl: parsed.siteUrl, addedAt: Date.now() };
  db.feeds.push(feed);
  mergeItems(feed, parsed);
  store.save(db);
  return feed;
}

async function refreshAll() {
  let added = 0;
  const errors = [];
  await Promise.all(
    db.feeds.map(async (f) => {
      try {
        added += mergeItems(f, await fetchFeed(f.url));
      } catch (e) {
        errors.push({ feed: f.title, error: e.message });
      }
    })
  );
  store.save(db);
  return { added, errors };
}

const DEAD_AFTER_DAYS = 365;

function graveyard(now = Date.now()) {
  return db.feeds
    .map((f) => {
      const last = db.items.filter((i) => i.feedId === f.id).reduce((m, i) => Math.max(m, i.published || 0), 0);
      const days = last ? Math.floor((now - last) / 86400000) : null;
      return { ...f, lastPublished: last || null, daysSilent: days };
    })
    .filter((f) => f.daysSilent === null || f.daysSilent > DEAD_AFTER_DAYS)
    .sort((a, b) => (a.lastPublished || 0) - (b.lastPublished || 0));
}

function feedsWithCounts() {
  return db.feeds.map((f) => ({ ...f, unread: db.items.filter((i) => i.feedId === f.id && !i.read).length }));
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 5e6) reject(new Error('Body too large'));
    });
    req.on('end', () => resolve(data));
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  try {
    if (p === '/api/feeds' && req.method === 'GET') return send(res, 200, feedsWithCounts());
    if (p === '/api/feeds' && req.method === 'POST') {
      const { url, title } = JSON.parse((await readBody(req)) || '{}');
      return send(res, 201, await subscribe(url || '', title));
    }
    let m = p.match(/^\/api\/feeds\/([\w-]+)$/);
    if (m && req.method === 'DELETE') {
      db.feeds = db.feeds.filter((f) => f.id !== m[1]);
      db.items = db.items.filter((i) => i.feedId !== m[1]);
      store.save(db);
      return send(res, 200, { ok: true });
    }
    m = p.match(/^\/api\/feeds\/([\w-]+)\/revive$/);
    if (m && req.method === 'POST') {
      const f = db.feeds.find((x) => x.id === m[1]);
      if (!f) return send(res, 404, { error: 'Not found' });
      const added = mergeItems(f, await fetchFeed(f.url));
      store.save(db);
      return send(res, 200, { added, stillDead: graveyard().some((g) => g.id === f.id) });
    }
    if (p === '/api/graveyard' && req.method === 'GET') return send(res, 200, graveyard());
    if (p === '/api/refresh' && req.method === 'POST') return send(res, 200, await refreshAll());
    if (p === '/api/items' && req.method === 'GET') {
      const feedId = u.searchParams.get('feed');
      const unread = u.searchParams.get('unread') === '1';
      const items = db.items
        .filter((i) => (!feedId || i.feedId === feedId) && (!unread || !i.read))
        .sort((a, b) => b.published - a.published)
        .slice(0, 300);
      return send(res, 200, items);
    }
    m = p.match(/^\/api\/items\/([\w-]+)\/read$/);
    if (m && req.method === 'POST') {
      const { read = true } = JSON.parse((await readBody(req)) || '{}');
      const it = db.items.find((i) => i.id === m[1]);
      if (!it) return send(res, 404, { error: 'Not found' });
      it.read = !!read;
      store.save(db);
      return send(res, 200, it);
    }
    if (p === '/api/opml' && req.method === 'GET') {
      res.setHeader('Content-Disposition', 'attachment; filename="lazarus-subscriptions.opml"');
      return send(res, 200, toOpml(db.feeds), 'text/x-opml');
    }
    if (p === '/api/opml' && req.method === 'POST') {
      const list = parseOpml(await readBody(req));
      const results = await Promise.allSettled(list.map((f) => subscribe(f.url, f.title)));
      return send(res, 200, { imported: results.filter((r) => r.status === 'fulfilled').length, total: list.length });
    }
    // static files
    const file = path.join(__dirname, 'public', p === '/' ? 'index.html' : path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (file.startsWith(path.join(__dirname, 'public')) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 400, { error: e.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`🪦 Lazarus Reader rising on http://localhost:${PORT}`));
  setInterval(() => refreshAll().catch(() => {}), REFRESH_MS).unref();
}

module.exports = { server, subscribe, refreshAll, graveyard, db, DEAD_AFTER_DAYS };
