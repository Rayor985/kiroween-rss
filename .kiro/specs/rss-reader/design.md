# Design — Lazarus Reader

## Architecture
Browser (vanilla JS) ⇄ JSON API (Node `http`) ⇄ `data/db.json`
Server fetches feeds (avoids browser CORS limits) with a 10 s timeout and a custom User-Agent.

## Data model
```json
{
  "feeds": [{ "id": "f_x", "url": "", "title": "", "siteUrl": "", "addedAt": 0 }],
  "items": [{ "id": "i_x", "feedId": "f_x", "guid": "", "title": "", "link": "",
              "summary": "", "published": 0, "read": false }]
}
```
Item id = hash(feedId + guid||link). Max 500 items kept per feed.

## Parsing
Regex/tag based tolerant parser: handles `<item>` (RSS) and `<entry>` (Atom), CDATA, HTML entities, `<link href>` for Atom, `pubDate` / `updated` / `published` / `dc:date`.

## Sanitizing
Server strips `<script>`, `<style>`, `<iframe>`, `on*=` attributes and `javascript:` URLs; front end renders summaries in a sandboxed container.

## UI
Three panes: feeds sidebar · item list · reader. Dark "graveyard" theme, accent pumpkin orange #ff7518.

## Graveyard (R8)
`GET /api/graveyard` computes, per feed, `lastPublished = max(item.published)` and `daysSilent`; feeds with `daysSilent > 365` or no items are returned. `POST /api/feeds/:id/revive` re-fetches one feed and returns `{ added, stillDead }`. Bury reuses `DELETE /api/feeds/:id`. UI: a "🪦 Graveyard" entry in the sidebar swaps the item list for tombstone cards with Revive / Bury buttons.
