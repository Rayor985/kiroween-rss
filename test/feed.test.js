'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { parseFeed, parseOpml, toOpml, sanitize } = require('../lib/feed');

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel><title>Crypt &amp; Co</title><link>https://crypt.example</link>
<item><title><![CDATA[Night of the Living Feeds]]></title><link>https://crypt.example/1</link><guid>g1</guid>
<pubDate>Fri, 31 Oct 2025 23:00:00 GMT</pubDate><description>&lt;p&gt;Boo&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;</description></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Graveyard</title>
<link rel="self" href="https://g.example/feed"/><link href="https://g.example/"/>
<entry><id>tag:g,1</id><title>Rise</title><link rel="alternate" href="https://g.example/rise"/>
<updated>2026-10-31T00:00:00Z</updated><summary>Up we go</summary></entry></feed>`;

test('parses RSS 2.0', () => {
  const f = parseFeed(RSS);
  assert.equal(f.title, 'Crypt & Co');
  assert.equal(f.items.length, 1);
  assert.equal(f.items[0].title, 'Night of the Living Feeds');
  assert.equal(f.items[0].guid, 'g1');
  assert.ok(f.items[0].published > 0);
  assert.ok(!/script/i.test(f.items[0].summary));
});

test('parses Atom 1.0', () => {
  const f = parseFeed(ATOM);
  assert.equal(f.title, 'Graveyard');
  assert.equal(f.siteUrl, 'https://g.example/');
  assert.equal(f.items[0].link, 'https://g.example/rise');
});

test('rejects non-feeds', () => {
  assert.throws(() => parseFeed('<html><body>hi</body></html>'));
});

test('OPML round trip', () => {
  const xml = toOpml([{ title: 'A & B', url: 'https://a.example/rss', siteUrl: '' }]);
  assert.deepEqual(parseOpml(xml), [{ url: 'https://a.example/rss', title: 'A & B' }]);
});

test('sanitize strips handlers and js urls', () => {
  const out = sanitize('<a href="javascript:x()" onclick="y()">x</a><iframe src="z"></iframe>');
  assert.ok(!/onclick|javascript|iframe/i.test(out));
});
