'use strict';
const fs = require('fs');
const path = require('path');

const DIR = process.env.LAZARUS_DATA || path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'db.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { feeds: [], items: [] };
  }
}

function save(db) {
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

module.exports = { load, save, FILE };
