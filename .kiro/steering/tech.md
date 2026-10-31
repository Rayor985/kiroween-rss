# Tech

- Runtime: Node.js >= 18, **no npm dependencies** (use built-in `http`, `fetch`, `fs`, `node:test`).
- Front end: vanilla HTML/CSS/JS, no build step.
- Storage: single JSON file at `data/db.json` (gitignored).
- Parsing: hand-written tolerant parser for RSS 2.0, Atom 1.0, OPML.
- Security: escape all feed HTML before rendering; strip scripts; only fetch http(s) URLs.
- Tests: `npm test` must pass before every commit.
