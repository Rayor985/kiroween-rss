# Requirements — Lazarus Reader

## R1 Subscribe
**User story:** As a reader, I want to add a feed by URL so that its posts appear in my timeline.
- WHEN the user submits a valid RSS or Atom URL THEN the system SHALL fetch it, store the feed title, and import its items.
- IF the URL is not http(s) or the response is not a parsable feed THEN the system SHALL show an error and SHALL NOT save the feed.
- WHEN a feed is already subscribed THEN the system SHALL NOT create a duplicate.

## R2 Timeline
**User story:** As a reader, I want one timeline of all feeds so that I can skim everything in one place.
- The system SHALL list items from all feeds sorted by publish date, newest first.
- WHEN "unread only" is enabled THEN the system SHALL hide read items.
- WHEN a feed is selected THEN the system SHALL show only that feed's items.

## R3 Read state
- WHEN the user opens or marks an item THEN the system SHALL persist it as read.
- The system SHALL show an unread count per feed.

## R4 Refresh
- WHEN the user clicks refresh, or every 30 minutes while running, THEN the system SHALL re-fetch all feeds and add only new items (deduplicated by guid/link).

## R5 OPML
- WHEN the user uploads an OPML file THEN the system SHALL subscribe to every feed in it.
- WHEN the user exports THEN the system SHALL download an OPML file of all subscriptions.

## R6 Keyboard
- The system SHALL support `j`/`k` (next/previous), `o` (open), `m` (toggle read), `r` (refresh).

## R7 Safety
- The system SHALL render feed content with scripts, iframes and event handlers removed.

## R8 Graveyard
**User story:** As a reader, I want to see which of my feeds have died so that I can revive or bury them.
- The system SHALL list feeds whose newest item is older than 365 days, or that have no items, oldest first.
- WHEN the user clicks Revive THEN the system SHALL re-fetch that feed and report whether it is still dead.
- WHEN the user clicks Bury and confirms THEN the system SHALL unsubscribe the feed and delete its items.
