// Optional regression checks. Requires Playwright, never shipped to visitors.
// PLAYWRIGHT_MODULE may point to an existing Playwright package directory.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.opus': 'audio/ogg',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  // Do not expose environment files, repository metadata, or test dependencies.
  if (!/^(index\.html|404\.html|css\/style\.css|js\/[\w./-]+\.js|assets\/[\w./-]+)$/.test(rel)
      || rel.includes('..') || !existsSync(join(root, rel))) {
    res.writeHead(404).end(); return;
  }
  res.setHeader('Content-Type', mime[extname(rel)] || 'application/octet-stream');
  res.end(readFileSync(join(root, rel)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser, failures = 0, count = 0;

async function test(name, run, options = {}) {
  if (process.env.TEST_FILTER && !name.includes(process.env.TEST_FILTER)) return;
  count++;
  const context = await browser.newContext(options);
  await context.addInitScript(() => localStorage.setItem('pf.vol', '0'));
  const page = await context.newPage();
  page.setDefaultTimeout(2500);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await run(page, context);
    assert.deepEqual(errors, [], 'uncaught browser errors');
    console.log(`PASS ${name}`);
  } catch (e) {
    failures++; console.error(`FAIL ${name}: ${e.message}`);
  } finally { await context.close(); }
}
const visiblePages = page => page.locator('.page').evaluateAll(els =>
  els.filter(el => !el.hidden).map(el => el.id));
async function open(page, hash = '#/about') {
  await page.goto(origin + '/' + hash);
  await page.waitForFunction(() => !!window.__PORTFOLIO);
}
async function home(page) {
  await open(page);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.waitForTimeout(350); // the outgoing page has a 260ms transition
}

try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  await test('route focus reaches the section heading', async page => {
    await open(page);
    assert.equal(await page.evaluate(() => document.activeElement.className), 'page__t');
  });
  await test('latest route wins over a closing transition', async page => {
    await open(page);
    await page.evaluate(() => { location.hash = '#/skills'; setTimeout(() => { location.hash = '#/about'; }, 20); });
    await page.waitForTimeout(650);
    assert.deepEqual(await visiblePages(page), ['pageAbout']);
  });
  await test('returning home keeps the canvas running', async page => {
    await open(page);
    await page.evaluate(() => { location.hash = '#/skills'; setTimeout(() => { location.hash = '#/'; }, 20); });
    await page.waitForTimeout(650);
    assert.deepEqual(await visiblePages(page), []);
    assert.equal(await page.evaluate(() => __PORTFOLIO.work.running), true);
  });
  await test('volume slider owns its arrow keys', async page => {
    await home(page);
    await page.locator('#settingsBtn').click();
    await page.locator('#volRange').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#volRange').inputValue(), '1');
  });
  await test('background audio pauses while hidden and resumes when visible', async page => {
    await open(page);
    await page.locator('#settingsBtn').click();
    await page.locator('#volRange').fill('66');
    await page.waitForFunction(() => !document.querySelector('#theme').paused);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await page.locator('#theme').evaluate(audio => audio.paused), true);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => !document.querySelector('#theme').paused);
  });
  await test('focused canvas can still move with arrow keys', async page => {
    await home(page);
    await page.locator('#cv').focus();
    const before = await page.evaluate(() => __PORTFOLIO.work.tx);
    await page.keyboard.press('ArrowRight');
    assert.ok(await page.evaluate(x => __PORTFOLIO.work.tx < x, before));
  });
  await test('reduced motion stops decorative trackers', async page => {
    await home(page);
    const before = await page.evaluate(() => __PORTFOLIO.work.trackers.t);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => __PORTFOLIO.work.trackers.t), before);
  }, { reducedMotion: 'reduce' });
  await test('certificate direct link opens the actual file', async page => {
    await open(page, '#/achievements');
    await page.locator('a[href$="wise-innovera-uiux.webp"]').click();
    const popup = page.waitForEvent('popup');
    await page.locator('#certOpen').click();
    const file = await popup;
    await file.waitForLoadState();
    assert.equal(new URL(file.url()).pathname, '/assets/certs/wise-innovera-uiux.webp');
  });
  for (const width of [1280, 390]) {
    await test(`no-JS ${width}: scroll, navigation and works remain usable`, async page => {
      await page.goto(origin);
      assert.equal(await page.locator('#nav').isVisible(), true);
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(200);
      assert.ok(await page.evaluate(() => scrollY > 0), 'document scrolls');
      await page.locator('#nav a').filter({ hasText: /^contact$/ }).click();
      assert.ok(await page.locator('#pageContact').evaluate(el => {
        const rect = el.getBoundingClientRect(); return rect.top < innerHeight && rect.bottom > 0;
      }));
      assert.equal(await page.locator('#worksFallback li').count(), 5);
      assert.equal(await page.locator('#worksFallback a').count(), 5);
    }, { javaScriptEnabled: false, viewport: { width, height: 844 } });
  }
  await test('failed scene import falls back to works', async page => {
    await page.route('**/js/scene.js', route => route.abort());
    await open(page, '');
    await page.waitForFunction(() => document.body.dataset.stage === 'work');
    assert.equal(await page.locator('#mark').isVisible(), false);
  });
  await test('missing WebGL falls back to works', async page => {
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /^(webgl|experimental-webgl)/.test(type) ? null : get.call(this, type, ...args);
      };
    });
    await open(page, '');
    await page.waitForFunction(() => document.body.dataset.stage === 'work');
    assert.equal(await page.locator('#mark').isVisible(), false);
  });
  await test('skip is available while the scene module is loading', async page => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/js/scene.js', async route => { await gate; await route.continue(); });
    try {
      await open(page, '');
      await page.locator('#skip').click();
      assert.equal(await page.evaluate(() => document.body.dataset.stage), 'work');
    } finally { release(); }
  });
  await test('routing during import never resurrects WebGL', async page => {
    let release, requested;
    const started = new Promise(resolve => { requested = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/js/scene.js', async route => { requested(); await gate; await route.continue(); });
    try {
      await open(page, ''); await started;
      await page.evaluate(() => { location.hash = '#/about'; });
      await page.waitForFunction(() => document.body.dataset.stage === 'page');
      release();
      await page.waitForTimeout(1400);
      assert.equal(await page.evaluate(() => __PORTFOLIO.gl === null), true);
      assert.deepEqual(await visiblePages(page), ['pageAbout']);
    } finally { release(); }
  });
  await test('models arriving after navigation cannot restart the intro', async page => {
    let release, requested;
    const started = new Promise(resolve => { requested = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/assets/models/camera.glb', async route => {
      requested(); await gate; await route.continue();
    });
    try {
      await open(page, ''); await started;
      await page.evaluate(() => { location.hash = '#/contact'; });
      await page.waitForFunction(() => document.body.dataset.stage === 'page');
      const received = page.waitForResponse('**/assets/models/camera.glb');
      release(); await received;
      await page.waitForTimeout(800);
      assert.equal(await page.evaluate(() => __PORTFOLIO.gl === null), true);
      assert.deepEqual(await visiblePages(page), ['pageContact']);
    } finally { release(); }
  });
  await test('mobile lite path, native anchors and project dialog', async page => {
    await open(page, '');
    await page.waitForFunction(() => document.body.dataset.stage === 'work');
    assert.equal(await page.evaluate(() => __PORTFOLIO.lite && __PORTFOLIO.gl === null), true);
    await page.locator('#navBtn').click();
    await page.locator('#nav a[href="#pageWorks"]').click();
    assert.deepEqual(await visiblePages(page), ['pageWorks']);
    assert.equal(await page.locator('#navBtn').getAttribute('aria-expanded'), 'false');
    await page.locator('#worksGrid button').first().click();
    assert.equal(await page.locator('#workTitle').textContent(), 'lensa');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#workPanel').evaluate(el => el.open), false);
    await page.locator('#settingsBtn').click();
    await page.locator('#langBtn').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'id');
    assert.match(await page.locator('#worksGrid button').first().textContent(), /Tempat membaca/);
  }, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  await test('full desktop intro completes and releases WebGL', async page => {
    await open(page, '');
    await page.waitForFunction(() => __PORTFOLIO.ipod?.armed, null, { timeout: 15000 });
    const point = await page.evaluate(() => {
      const { ipod, gl } = __PORTFOLIO;
      const position = ipod.hit.position.clone().set(0, 0, 0);
      ipod.hit.localToWorld(position).project(gl.camera);
      return { x: (position.x + 1) * innerWidth / 2, y: (1 - position.y) * innerHeight / 2 };
    });
    await page.mouse.click(point.x, point.y);
    await page.waitForFunction(() => __PORTFOLIO.cam?.running, null, { timeout: 10000 });
    await page.waitForFunction(() => document.body.dataset.stage === 'work' && __PORTFOLIO.gl === null,
      null, { timeout: 10000 });
    assert.equal(await page.evaluate(() => __PORTFOLIO.work.running), true);
    assert.equal(await page.locator('#mark').isVisible(), false);
    await page.locator('#nav a[href="#pageAbout"]').click();
    assert.deepEqual(await visiblePages(page), ['pageAbout']);
  });
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`${count - failures}/${count} browser checks passed`);
if (failures) process.exitCode = 1;
