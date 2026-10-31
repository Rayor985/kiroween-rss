'use strict';
// Tolerant, dependency-free RSS 2.0 / Atom 1.0 / OPML parsing.

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .trim();
}

function tag(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = xml.match(re);
  return m ? decode(m[1]) : '';
}

function attr(xml, name, attrName, filter) {
  const re = new RegExp(`<${name}\\b([^>]*)/?>`, 'gi');
  let m;
  while ((m = re.exec(xml))) {
    const attrs = m[1];
    if (filter && !filter(attrs)) continue;
    const a = attrs.match(new RegExp(`${attrName}\\s*=\\s*["']([^"']*)["']`, 'i'));
    if (a) return decode(a[1]);
  }
  return '';
}

function blocks(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function toTime(s) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

function sanitize(html) {
  return (html || '')
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

function parseFeed(xml) {
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('Empty feed');
  const isAtom = /<feed\b[^>]*>/i.test(xml) && !/<rss\b/i.test(xml);
  if (isAtom) {
    const head = xml.split(/<entry\b/i)[0];
    const items = blocks(xml, 'entry').map((e) => ({
      guid: tag(e, 'id'),
      title: tag(e, 'title') || '(untitled)',
      link: attr(e, 'link', 'href', (a) => !/rel\s*=\s*["'](?!alternate)/i.test(a)),
      summary: sanitize(tag(e, 'content') || tag(e, 'summary')),
      published: toTime(tag(e, 'published') || tag(e, 'updated')),
    }));
    return {
      title: tag(head, 'title') || 'Untitled feed',
      siteUrl: attr(head, 'link', 'href', (a) => !/rel\s*=\s*["']self/i.test(a)),
      items,
    };
  }
  if (!/<(rss|rdf:RDF|channel)\b/i.test(xml)) throw new Error('Not an RSS or Atom feed');
  const head = xml.split(/<item\b/i)[0];
  const items = blocks(xml, 'item').map((e) => {
    const link = tag(e, 'link');
    return {
      guid: tag(e, 'guid') || link,
      title: tag(e, 'title') || '(untitled)',
      link,
      summary: sanitize(tag(e, 'content:encoded') || tag(e, 'description')),
      published: toTime(tag(e, 'pubDate') || tag(e, 'dc:date')),
    };
  });
  return { title: tag(head, 'title') || 'Untitled feed', siteUrl: tag(head, 'link'), items };
}

function parseOpml(xml) {
  const out = [];
  const re = /<outline\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const url = (m[1].match(/xmlUrl\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!url) continue;
    const title = (m[1].match(/(?:title|text)\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    out.push({ url: decode(url), title: decode(title) });
  }
  return out;
}

const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

function toOpml(feeds) {
  const body = feeds
    .map((f) => `    <outline type="rss" text="${esc(f.title)}" title="${esc(f.title)}" xmlUrl="${esc(f.url)}" htmlUrl="${esc(f.siteUrl)}"/>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head><title>Lazarus Reader subscriptions</title></head>\n  <body>\n${body}\n  </body>\n</opml>\n`;
}

module.exports = { parseFeed, parseOpml, toOpml, sanitize, decode };
