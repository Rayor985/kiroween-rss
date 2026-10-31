# 🪦 Lazarus Reader — kiroween-rss

> Google Reader died on July 1, 2013. On Halloween, we dig it back up.

Lazarus Reader is a lightweight, self-hosted RSS / Atom reader built for **Kiroween 2026** in the **Resurrection** category: bringing a "dead" technology back to life with modern tooling, built spec-first with [Kiro](https://kiro.dev).

## Features (v0.1)

- Subscribe to any RSS 2.0 or Atom feed by URL
- Unified "River of News" timeline across all feeds, newest first
- Mark items read / unread, filter to unread only
- Keyboard navigation: `j` / `k` next / previous, `o` open, `m` toggle read
- OPML import / export so you can bring your old Google Reader list back
- Zero dependencies: plain Node.js server + vanilla JS front end
- Haunted dark theme 🎃

## Quick start

```bash
git clone https://github.com/Rayor985/kiroween-rss.git
cd kiroween-rss
npm start
# open http://localhost:3666
```

Requires Node.js 18 or newer. Subscriptions and read state are stored in `data/db.json`.

## How it was built with Kiro

Everything Kiro used lives in [`.kiro/`](.kiro):

| Path | Purpose |
|------|---------|
| `.kiro/steering/` | Product, tech and structure steering docs |
| `.kiro/specs/rss-reader/` | Requirements (EARS), design, and task list |
| `.kiro/hooks/` | Agent hooks (e.g. run tests on save) |

## Project structure

```
server.js        HTTP server, feed fetching, JSON API
lib/feed.js      RSS / Atom / OPML parsing (no deps)
lib/store.js     JSON file storage
public/          Front end (HTML, CSS, JS)
test/            node:test unit tests
```

## License

[MIT](LICENSE)
