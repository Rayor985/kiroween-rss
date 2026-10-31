# Lazarus Reader — Devpost write-up (draft)

**Tagline:** Google Reader died in 2013. This Halloween, we dug it back up.

**Category:** Resurrection

## Inspiration
On July 1, 2013, Google Reader was shut down, and with it a whole way of reading the web: calm, chronological, and owned by you. Today our feeds are run by algorithms tuned for outrage and ads. RSS never actually died. Millions of sites still publish feeds. It just lost its home. Lazarus Reader gives it one again.

## What it does
- Subscribe to any RSS 2.0 or Atom feed and read everything in one chronological "river of news"
- Unread tracking, per-feed counts, and Google Reader-style keyboard shortcuts (j / k / o / m / r)
- OPML import and export, so you can bring your 2013 subscription list back from the dead
- **The Graveyard:** a view of every feed that has been silent for over a year, with its last words and days of silence. Hit **Revive** to try to bring it back, or **Bury** to lay it to rest
- Self-hosted, private, zero dependencies, with a haunted dark theme

## How we built it
We built Lazarus Reader spec-first with Kiro:
- **Steering docs** (`.kiro/steering/`) fixed the product principles (self-hosted, keyboard-first, no lock-in) and tech constraints (Node.js only, zero npm dependencies, sanitize all feed HTML)
- **Spec** (`.kiro/specs/rss-reader/`): requirements written in EARS format (R1–R8), a design doc with the data model and API, and a task list that Kiro worked through one task at a time
- **Agent hook** (`.kiro/hooks/`): every time a parser or server file is saved, Kiro runs the test suite and proposes a fix if anything breaks
- The stack is deliberately "resurrected" too: plain Node.js `http`, a hand-written RSS/Atom/OPML parser, a JSON file for storage, and vanilla JavaScript in the browser. No frameworks, no build step

## Challenges we ran into
- Real-world feeds are messy: CDATA, double-escaped HTML, Atom vs RSS links, missing dates. The parser had to be tolerant without pulling in a dependency
- Feed content is untrusted HTML, so we strip scripts, iframes, event handlers and `javascript:` URLs before rendering
- Deciding when a feed is "dead": we settled on 365 days of silence, then let the user try a resurrection before burying it

## Accomplishments that we're proud of
- A fully working reader with zero dependencies that starts with one command
- The Graveyard, which turns a boring maintenance chore into a small Halloween ritual
- Specs, steering and hooks that make the project easy for anyone to extend with Kiro

## What we learned
Writing requirements first made the AI-assisted work dramatically more predictable. When Kiro had clear acceptance criteria, its code matched our intent on the first pass far more often, and the test hook caught regressions immediately.

## What's next
- Full-text search across all items
- Auto-refresh with a "new posts" toast
- Feed discovery from any website URL
- A "Séance" mode that finds archived copies of dead feeds on the Wayback Machine

## Try it
```bash
git clone https://github.com/Rayor985/kiroween-rss.git
cd kiroween-rss && npm start   # http://localhost:3666
```

**Built with:** Kiro, Node.js, JavaScript, HTML, CSS, RSS, Atom, OPML
