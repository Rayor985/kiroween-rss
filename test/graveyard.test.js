'use strict';
process.env.LAZARUS_DATA = require('fs').mkdtempSync(require('os').tmpdir() + '/lz-');
const test = require('node:test');
const assert = require('node:assert');
const { graveyard, db } = require('../server');

test('graveyard lists feeds silent > 365 days or empty', () => {
  const now = Date.parse('2026-10-31T00:00:00Z');
  const day = 86400000;
  db.feeds.push({ id: 'alive', title: 'Alive' }, { id: 'dead', title: 'Dead' }, { id: 'empty', title: 'Empty' });
  db.items.push({ id: 'a', feedId: 'alive', published: now - 10 * day }, { id: 'd', feedId: 'dead', published: now - 400 * day });
  const ids = graveyard(now).map((f) => f.id);
  assert.deepEqual(ids.sort(), ['dead', 'empty']);
  assert.equal(graveyard(now).find((f) => f.id === 'dead').daysSilent, 400);
});
