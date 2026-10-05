// Testy klasyfikatora (node --test). classify.js ładowany w vm z atrapą window.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  return sandbox.window;
}

const { CHRONOS_CLASSIFY: C } = load('classify.js');

const CHROME = 'chrome.exe';
const kind = (app, title) => C.classify(app, title).kind;

test('desktop apps', () => {
  assert.equal(kind('Code.exe', 'app.js - chronos - Visual Studio Code'), 'work');
  assert.equal(kind('steam.exe', 'Steam'), 'chill');
  assert.equal(kind('explorer.exe', 'Downloads'), 'neutral');
});

test('YouTube depends on the topic', () => {
  assert.equal(kind(CHROME, 'React useEffect explained - YouTube - Google Chrome'), 'work');
  assert.equal(kind(CHROME, 'Minecraft speedrun 1.16 WR - YouTube - Google Chrome'), 'chill');
});

test('streaming sites', () => {
  assert.equal(kind(CHROME, 'shroud playing VALORANT - Twitch - Google Chrome'), 'chill');
  assert.equal(kind(CHROME, 'ThePrimeagen - Docker in 10 minutes - Twitch - Google Chrome'), 'work');
  assert.equal(kind(CHROME, 'xQc - Kick - Google Chrome'), 'chill');
});

test('messengers count as work', () => {
  assert.equal(kind(CHROME, '(3) Messenger - Google Chrome'), 'work');
  assert.equal(kind('Discord.exe', 'general - Discord'), 'work');
});

test('no signal means neutral', () => {
  assert.equal(kind(CHROME, 'New tab - Google Chrome'), 'neutral');
});

test('whole-word matching', () => {
  // "dota" nie może złapać się w "dotacja"
  assert.notEqual(kind(CHROME, 'Wniosek o dotacje unijne - Google Chrome'), 'chill');
});

test('browser suffixes are stripped from the tab title', () => {
  assert.equal(C.cleanTab('(2) Inbox - Gmail - Google Chrome'), 'Inbox - Gmail');
  assert.equal(C.cleanTab('Docs and 2 more pages - Personal - Microsoft Edge'), 'Docs');
  assert.equal(C.cleanTab('Mozilla \u2014 Mozilla Firefox'), 'Mozilla');
});

test('short formats are flagged for the daily grace period', () => {
  assert.equal(C.classify(CHROME, 'funny cats #shorts - YouTube - Google Chrome').short, true);
  assert.equal(C.classify(CHROME, 'TikTok - Google Chrome').short, true);
  assert.equal(C.classify(CHROME, 'React hooks - YouTube - Google Chrome').short, false);
});

test('meeting detection', () => {
  assert.equal(C.meeting('chrome.exe', 'Meet - abc-defg-hij - Google Chrome'), 'Google Meet');
  assert.equal(C.meeting('zoom.exe', 'Zoom Meeting'), 'Zoom');
  // "Meet the team" to nie spotkanie
  assert.equal(C.meeting('chrome.exe', 'Meet the team - Acme - Google Chrome'), null);
  assert.equal(C.meeting('lockapp.exe', ''), null);
});
