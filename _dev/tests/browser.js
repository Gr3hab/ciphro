/* Browser-Hilfen für die Spieltests (Playwright, Chromium). */
'use strict';
const { chromium } = require('playwright');
const server = require('../tools/server');
const { loadNF } = require('./helpers');

const NF = loadNF();
const SEEN = { v: 2, seenHelp: true, days: {}, daysEn: {} };

async function setup() {
  const srv = await server.start();
  const browser = await chromium.launch();
  return { srv, browser, async close() { await browser.close(); await srv.close(); } };
}

// Neue Seite mit fester Uhrzeit (Wien), Sprache und optionalem Spielstand
async function openPage(env, opt = {}) {
  const ctx = opt.context || await env.browser.newContext({
    viewport: { width: opt.width || 390, height: opt.height || 844 },
    locale: opt.locale || 'de-AT', colorScheme: opt.scheme || 'light',
    timezoneId: opt.timezone || 'Europe/Vienna', serviceWorkers: opt.sw ? 'allow' : 'block',
    hasTouch: !!opt.mobile, isMobile: !!opt.mobile, reducedMotion: opt.motion ? 'no-preference' : 'reduce',
    ...(opt.ua ? { userAgent: opt.ua } : {}),
    permissions: opt.clipboard ? ['clipboard-read', 'clipboard-write'] : []
  });
  if (!opt.context) await ctx.clock.install({ time: new Date(opt.time || '2026-10-24T10:00:00+02:00') });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
  const store = opt.store === null ? null : JSON.stringify(opt.store || SEEN);
  if (store && !opt.context) {
    await ctx.addInitScript(s => {
      try { if (!localStorage.getItem('numfact.test.seeded')) { localStorage.setItem('numfact.v2', s); localStorage.setItem('numfact.test.seeded', '1'); } } catch (e) { /* egal */ }
    }, store);
  }
  if (opt.init) await ctx.addInitScript(opt.init);
  await page.goto(env.srv.url + (opt.url || ''));
  await page.waitForFunction(() => document.querySelector('#issue') && document.querySelector('#issue').textContent);
  return page;
}

const keyOf = n => NF.keyOfNumber(n);
function solution(n, lang, mode) { return NF.buildDay(keyOf(n), lang).puzzles[mode].words.map(w => w.plain); }
function puzzle(n, lang, mode) { return NF.buildDay(keyOf(n), lang).puzzles[mode]; }

async function store(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('numfact.v2'))); }
async function state(page, key, mode, lang = 'de') {
  const s = await store(page);
  return (lang === 'en' ? s.daysEn : s.days)[key][mode];
}
async function timer(page) { return (await page.textContent('#timerText')).trim(); }
// Tippt ein Wort wie ein Mensch: Buchstaben über die echte Tastatur, Ä Ö Ü ß über die Bildschirmtastatur
async function typeWord(page, w) {
  for (const ch of w) {
    if (/[A-Z]/.test(ch)) await page.keyboard.press(ch);
    else await page.click(`#kb .k[data-k="${ch}"] button`);
  }
}
async function issueNumber(page) { return +((await page.textContent('#issue')).match(/#(\d+)/)[1]); }

module.exports = { NF, SEEN, setup, openPage, solution, puzzle, keyOf, store, state, timer, typeWord, issueNumber };
