# Structure

- `server.js` — routes: `GET /api/feeds`, `POST /api/feeds`, `DELETE /api/feeds/:id`, `POST /api/refresh`, `GET /api/items`, `POST /api/items/:id/read`, `GET /api/opml`, `POST /api/opml`.
- `lib/feed.js` — `parseFeed(xml)`, `parseOpml(xml)`, `toOpml(feeds)`.
- `lib/store.js` — load/save JSON DB.
- `public/` — `index.html`, `app.js`, `style.css`.
- `test/` — unit tests per lib module.
- `.kiro/` — steering, specs, hooks. Must stay committed.
