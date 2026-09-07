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
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json',
  '.bin': 'application/octet-stream' };
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const rel = pathname === '/' ? 'index.html'
    : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  // Do not expose environment files, repository metadata, or test dependencies.
  if (!/^(index\.html|404\.html|css\/style\.css|js\/[\w./-]+\.js|assets\/[\w./-]+|demos\/[\w./-]+|output\/pdf\/[\w.-]+\.pdf)$/.test(rel)
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
async function startCamera(page) {
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
  await test('home stage presents identity and primary actions', async page => {
    await open(page, '');
    await page.locator('#skip').click();
    await page.waitForFunction(() => document.body.dataset.stage === 'work');
    await page.locator('.home-id').waitFor({ state:'visible' });
    assert.match(await page.locator('.home-id__name').textContent(), /Constantine Rainer Simanjuntak/);
    assert.equal(await page.locator('.home-id a[href="#pageWorks"]').count(), 1);
    assert.equal(await page.locator('.home-id a[href="#pageContact"]').count(), 1);
    assert.equal(await page.locator('.home-id a[href$="constantine-rainer-simanjuntak-cv.pdf"]').count(), 1);
    const cv = await page.request.get(origin + '/output/pdf/constantine-rainer-simanjuntak-cv.pdf');
    assert.equal(cv.status(), 200);
    assert.match(cv.headers()['content-type'] || '', /application\/pdf/);
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
  await test('home canvas has no orbiting constellation ornament', async page => {
    await home(page);
    assert.equal(await page.evaluate(() => 'blobs' in __PORTFOLIO.work.trackers), false);
  });
  await test('cursor grid stays outside project tiles', async page => {
    await home(page);
    await page.waitForFunction(() => __PORTFOLIO.work._tileRects?.length);
    const changedPixels = await page.evaluate(() => {
      const work = __PORTFOLIO.work;
      work.stop();
      work.drawPlane(0);
      const tile = work._tileRects.find(r => r.x >= 0 && r.y >= 0
        && r.x + r.w <= work.w && r.y + r.h <= work.h);
      if (!tile) throw new Error('no fully visible project tile');

      const dpr = work.cv.width / work.w;
      const x = Math.ceil((tile.x + 2) * dpr);
      const y = Math.ceil((tile.y + 2) * dpr);
      const width = Math.floor((tile.w - 4) * dpr);
      const height = Math.floor((tile.h - 4) * dpr);
      const pixels = () => work.ctx.getImageData(x, y, width, height).data;

      work.mx = work.px = -9999;
      work.my = work.py = -9999;
      work.drawGrid();
      const before = pixels();

      work.mx = work.px = tile.x + tile.w / 2;
      work.my = work.py = tile.y + tile.h / 2;
      work.drawGrid();
      const after = pixels();

      let changed = 0;
      for (let i = 0; i < before.length; i += 4){
        if (before[i] !== after[i] || before[i + 1] !== after[i + 1]
            || before[i + 2] !== after[i + 2] || before[i + 3] !== after[i + 3]) changed++;
      }
      return changed;
    });
    assert.equal(changedPixels, 0);
  });
  await test('reduced motion stops autofocus breathing', async page => {
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
      assert.equal(await page.locator('#worksFallback li').count(), 6);
      assert.equal(await page.locator('#worksFallback a').count(), 6);
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
    assert.match(await page.locator('#worksGrid button').first().textContent(), /Platform publikasi/);
  }, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  await test('3D project deck navigates projects and releases WebGL on exit', async page => {
    await open(page, '#/works');
    await page.waitForFunction(() => __PORTFOLIO.deck?.cardCount === 6, null, { timeout:8000 });
    assert.equal(await page.locator('#projectDeck').getAttribute('data-ready'), 'true');
    assert.equal(await page.locator('#deckTitle').textContent(), 'lensa');

    await page.locator('#deckNext').click();
    assert.equal(await page.locator('#deckTitle').textContent(), 'artvault');
    await page.locator('#settingsBtn').click();
    await page.locator('#langBtn').click();
    assert.match(await page.locator('#deckNote').textContent(), /Antarmuka komunitas seni/);
    const lightCard = await page.evaluate(() => __PORTFOLIO.deck.bodyMaterial.color.getHexString());
    await page.locator('#themeBtn').click();
    const darkCard = await page.evaluate(() => __PORTFOLIO.deck.bodyMaterial.color.getHexString());
    assert.notEqual(darkCard, lightCard);
    await page.locator('#deckOpen').click();
    assert.equal(await page.locator('#workTitle').textContent(), 'artvault');
    await page.keyboard.press('Escape');

    await page.evaluate(() => { location.hash = '#/about'; });
    await page.waitForFunction(() => __PORTFOLIO.deck === null);
    assert.equal(await page.locator('#projectDeck').getAttribute('data-ready'), null);
  });
  await test('project panel presents case study, demo and source actions', async page => {
    await open(page, '#/works');
    await page.locator('button[data-work="smk telkom purwokerto"]').click();
    await page.locator('#workPanel').waitFor({ state:'visible' });
    assert.equal(await page.locator('#workPanel').evaluate(panel => panel.scrollTop), 0,
      'a case study must open at its screenshot and title');
    for (const section of ['challenge', 'contribution', 'approach', 'outcome', 'stack']) {
      assert.equal(await page.locator(`#workPanel [data-case="${section}"]`).count(), 1);
    }
    await page.locator('#workDemo').waitFor({ state:'visible' });
    assert.equal(await page.locator('#workDemo').getAttribute('href'),
      'https://smk-telkom-purwokerto.vercel.app');
    await page.locator('#workRepo').waitFor({ state:'visible' });
    assert.match(await page.locator('#workRepo').getAttribute('href'), /github\.com\/Constanvel/);
  });
  await test('AI Ninja is listed with its first-party demo', async (page, context) => {
    await open(page, '#/works');
    await page.locator('button[data-work="ai ninja challenge"]').click();
    await page.locator('#workPanel').waitFor({ state:'visible' });
    assert.equal(await page.locator('#workDemo').getAttribute('href'), './demos/ai-ninja/');
    assert.match(await page.locator('[data-case="approach"]').textContent(), /pose|classification|klasifikasi/i);
    const demo = await context.newPage();
    const response = await demo.goto(origin + '/demos/ai-ninja/');
    assert.equal(response.status(), 200);
    assert.match(await demo.title(), /AI Ninja Challenge/);
  });
  await test('completed intro stays skipped after a same-tab reload', async page => {
    await open(page, '');
    await page.locator('#skip').click();
    await page.waitForFunction(() => document.body.dataset.stage === 'work');
    await page.evaluate(() => localStorage.setItem('pf.vol', '66'));
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.stage === 'work', null, { timeout:1500 });
    assert.equal(await page.locator('#mark').isVisible(), false);
    assert.equal(await page.locator('#gl').isVisible(), false);
    await page.locator('#settingsBtn').click();
    await page.waitForFunction(() => !document.querySelector('#theme').paused);
  });
  await test('dark 3D deck keeps project textures at full brightness', async page => {
    await page.addInitScript(() => localStorage.setItem('pf.mode', 'dark'));
    await open(page, '#/works');
    await page.waitForFunction(() => __PORTFOLIO.deck?.textures.size === 6, null, { timeout:8000 });
    const materials = await page.evaluate(() => ({
      card: __PORTFOLIO.deck.bodyMaterial.color.getHexString(),
      images: [...__PORTFOLIO.deck.materials]
        .filter(material => material.map)
        .map(material => material.color.getHexString())
    }));
    assert.notEqual(materials.card, '0e0e11');
    assert.deepEqual([...new Set(materials.images)], ['ffffff']);
  });
  await test('failed 3D deck import leaves the project grid usable', async page => {
    await page.route('**/js/project-deck.js', route => route.abort());
    await open(page, '#/works');
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#projectDeck').getAttribute('data-ready'), null);
    assert.equal(await page.locator('#worksGrid button').count(), 6);
    await page.locator('#worksGrid button').first().click();
    assert.equal(await page.locator('#workTitle').textContent(), 'lensa');
  });
  await test('camera zoom uses one frozen portfolio frame', async page => {
    await startCamera(page);
    await page.evaluate(() => __PORTFOLIO.freeze('cam', 3000));
    await page.waitForTimeout(80);
    const result = await page.evaluate(async () => {
      const running = __PORTFOLIO.work.running;
      const before = __PORTFOLIO.cam.mtex.version;
      await new Promise(resolve => setTimeout(resolve, 160));
      return { running, textureUpdates: __PORTFOLIO.cam.mtex.version - before };
    });
    assert.deepEqual(result, { running: false, textureUpdates: 0 });
  });
  await test('full desktop intro completes and releases WebGL', async page => {
    await startCamera(page);
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
