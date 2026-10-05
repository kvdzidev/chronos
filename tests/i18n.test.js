// Testy słownika (node --test).
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const sandbox = { window: { navigator: { languages: ['en-GB'] } }, localStorage: null };
vm.runInNewContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), sandbox);
const I18N = sandbox.window.CHRONOS_I18N;

test('every key has both languages', () => {
  for (const [key, entry] of Object.entries(I18N.DICT)) {
    assert.ok(entry.pl, 'missing pl: ' + key);
    assert.ok(entry.en, 'missing en: ' + key);
  }
});

test('every key used in the code exists in the dictionary', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-html)?="([^"]+)"/g)) used.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(',')) used.add(pair.split(':')[1].trim());
  }
  for (const m of js.matchAll(/\btr\('([\w.]+)'/g)) used.add(m[1]);
  for (const key of used) assert.ok(I18N.DICT[key], 'unknown key: ' + key);
});

test('placeholders are filled in', () => {
  I18N.set('en', false);
  assert.equal(I18N.t('toast.saved', { time: '25m', name: 'Work' }), 'Saved 25m - Work');
  I18N.set('pl', false);
  assert.equal(I18N.t('toast.saved', { time: '25m', name: 'Praca' }), 'Zapisano 25m - Praca');
});

test('classifier names are translated for display', () => {
  I18N.set('en', false);
  assert.equal(I18N.label('Eksplorator plików'), 'File Explorer');
  assert.equal(I18N.label('Chrome - inne'), 'Chrome - other');
  assert.equal(I18N.label('GitHub'), 'GitHub');
  I18N.set('pl', false);
  assert.equal(I18N.label('Eksplorator plików'), 'Eksplorator plików');
});
