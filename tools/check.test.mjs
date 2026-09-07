// Fixtures prove the checker rejects deployable-looking but broken projects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function fixture(run) {
  const temp = mkdtempSync(join(tmpdir(), 'portfolio-check-'));
  const site = join(temp, 'site');
  mkdirSync(site);
  for (const file of ['index.html', '404.html', 'robots.txt', 'sitemap.xml',
    'vercel.json', 'css', 'js', 'assets', 'tools']) {
    cpSync(join(root, file), join(site, file), { recursive: true });
  }
  const redirect = join(temp, 'redirect-portofolio-camera');
  mkdirSync(redirect);
  const redirectFile = join(root, '../redirect-portofolio-camera/vercel.json');
  writeFileSync(join(redirect, 'vercel.json'), existsSync(redirectFile)
    ? readFileSync(redirectFile) : '{"redirects":[]}');
  const edit = (file, transform) => writeFileSync(join(site, file), transform(readFileSync(join(site, file), 'utf8')));
  const check = (...args) => {
    const result = spawnSync(process.execPath, ['tools/check.mjs', ...args], { cwd: site, encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  };
  try { run({ edit, check }); } finally {
    // Only remove the unique fixture directory created by this invocation.
    assert.equal(dirname(resolve(temp)), resolve(tmpdir()));
    assert.ok(basename(temp).startsWith('portfolio-check-'));
    rmSync(temp, { recursive: true, force: true });
  }
}

test('valid site passes', () => fixture(({ check }) => {
  const result = check(); assert.equal(result.status, 0, result.output);
}));
for (const file of ['vercel.json', '../redirect-portofolio-camera/vercel.json']) {
  test(`reject invalid JSON in ${file}`, () => fixture(({ edit, check }) => {
    edit(file, source => source + '\ngit add index.html\n');
    const result = check(); assert.equal(result.status, 1); assert.match(result.output, /vercel\.json/);
  }));
}
test('an explicitly requested missing redirect configuration fails', () => fixture(({ check }) => {
  const result = check('--redirect-config', '../missing.json');
  assert.equal(result.status, 1); assert.match(result.output, /missing\.json/);
}));
test('a new project without a canvas slot fails', () => fixture(({ edit, check }) => {
  edit('js/data.js', source => source + '\nWORKS.push({ ...WORKS[0], label: "new project" });\n');
  const result = check(); assert.equal(result.status, 1); assert.match(result.output, /slot/i);
}));
test('a missing project translation fails', () => fixture(({ edit, check }) => {
  edit('js/data.js', source => source + '\ndelete WORKS[0].note_id;\n');
  const result = check(); assert.equal(result.status, 1); assert.match(result.output, /note_id/);
}));
test('a card pointing at a missing section fails', () => fixture(({ edit, check }) => {
  edit('js/data.js', source => source.replace("route: 'about'", "route: 'missing'"));
  const result = check(); assert.equal(result.status, 1); assert.match(result.output, /missing/);
}));
test('invalid application syntax fails', () => fixture(({ edit, check }) => {
  edit('js/main.js', source => source + '\nconst broken = ;\n');
  const result = check(); assert.equal(result.status, 1); assert.match(result.output, /main\.js/);
}));
test('outdated no-JS project text fails', () => fixture(({ edit, check }) => {
  edit('js/data.js', source => source + '\nWORKS[0].note = "Updated project description";\n');
  const result = check(); assert.equal(result.status, 1); assert.match(result.output, /fallback/i);
}));

test('skills show a monochrome logo beside every named technology', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  const technologies = [
    'react', 'nextjs', 'vite', 'react-router', 'tailwind',
    'typescript', 'javascript', 'html', 'css', 'sql',
    'supabase', 'postgresql', 'llm-api', 'figma', 'git', 'eslint', 'nodejs'
  ];

  for (const technology of technologies) {
    assert.match(html, new RegExp(
      `<span class="skill" data-skill="${technology}">\\s*`
      + '<svg class="skill__icon"[^>]*aria-hidden="true"', 's'
    ), `${technology} needs a decorative logo beside its name`);
  }
  assert.match(css, /\.skill__icon\s*\{[^}]*fill:\s*currentColor/s,
    'skill logos must inherit the monochrome theme colour');
});

test('about page shows an optimised colour portrait with a responsive crop', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  const portrait = join(root, 'assets/profile/rainer.webp');

  assert.ok(existsSync(portrait), 'the optimised portrait asset must exist');
  assert.match(html,
    /<figure class="about__portrait">\s*<img[^>]*src="\.\/assets\/profile\/rainer\.webp"[^>]*alt="Constantine Rainer Simanjuntak"/s);
  assert.match(css, /\.about__portrait img\s*\{[^}]*object-fit:\s*cover/s);
  assert.doesNotMatch(css, /\.about__portrait img\s*\{[^}]*filter:\s*grayscale/s,
    'the portrait must keep its original colour');
});

test('portfolio copy states AI experience and achievement status clearly', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const i18n = readFileSync(join(root, 'js/i18n.js'), 'utf8');

  assert.match(html, /YOLO, RAG and language-model chatbots/,
    'English experience copy should name the AI work');
  assert.match(i18n, /YOLO, RAG dan chatbot model bahasa/,
    'Indonesian experience copy should name the AI work');
  assert.match(html, /Participant — National UI\/UX Design Competition/,
    'English achievement copy should state the WISE participant status');
  assert.match(i18n, /Peserta — Lomba Desain UI\/UX Nasional/,
    'Indonesian achievement copy should state the WISE participant status');
  assert.match(html, /Completed the TOEIC Excellence Program/,
    'English achievement copy should state TOEIC completion');
  assert.match(i18n, /Menyelesaikan TOEIC Excellence Program/,
    'Indonesian achievement copy should state TOEIC completion');
});

test('home stays visually clear while contact exposes professional paths', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');

  assert.doesNotMatch(html, /class="home-id"/,
    'the work stage must not restore the removed identity card');
  assert.match(html, /Constantine Rainer Simanjuntak/);
  assert.match(html, /href="\.\/output\/pdf\/constantine-rainer-simanjuntak-cv\.pdf"/,
    'the home or contact page needs a downloadable CV');
  assert.match(html, /href="https:\/\/www\.behance\.net\/constanrainer"/,
    'the verified Behance profile needs to be available');
});

test('every project contains a structured bilingual case study', () => {
  const data = readFileSync(join(root, 'js/data.js'), 'utf8');
  const fields = ['challenge', 'contribution', 'approach', 'outcome', 'stack'];

  for (const field of fields) {
    const english = [...data.matchAll(new RegExp(`\\b${field}:`, 'g'))].length;
    const indonesian = [...data.matchAll(new RegExp(`\\b${field}_id:`, 'g'))].length;
    assert.ok(english >= 6, `${field} needs one English value for every project`);
    assert.ok(indonesian >= 6, `${field}_id needs one Indonesian value for every project`);
  }
  assert.match(data, /label: 'ai ninja challenge'/,
    'the applied pose-classification project needs a portfolio entry');
  assert.match(data, /demo: '\.\/demos\/ai-ninja\/'/,
    'AI Ninja needs a first-party direct demo');
});

test('site includes structured data and reproducible verification', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, 'index needs JSON-LD');
  const jsonLd = JSON.parse(jsonLdMatch[1]);
  assert.ok(Array.isArray(jsonLd['@graph']), 'JSON-LD needs a graph');
  assert.ok(jsonLd['@graph'].some(item => item['@type'] === 'Person'));
  assert.ok(jsonLd['@graph'].some(item => item['@type'] === 'WebSite'));

  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  for (const script of ['check', 'test', 'test:browser', 'verify']) {
    assert.equal(typeof pkg.scripts?.[script], 'string', `package script ${script} is required`);
  }
  assert.ok(existsSync(join(root, '.github/workflows/verify.yml')),
    'GitHub Actions verification workflow is required');

  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const headers = JSON.stringify(vercel.headers);
  for (const name of ['Content-Security-Policy', 'Permissions-Policy',
    'Referrer-Policy', 'X-Content-Type-Options']) {
    assert.match(headers, new RegExp(name), `${name} header is required`);
  }
});

test('production CSP permits the bundled Meshopt WebAssembly decoder', () => {
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const csp = vercel.headers
    .flatMap(rule => rule.headers || [])
    .find(header => header.key === 'Content-Security-Policy')?.value || '';

  assert.match(csp, /script-src[^;]*'wasm-unsafe-eval'/,
    'the 3D intro decoder needs wasm-unsafe-eval in script-src');
});

test('entry document cannot reuse stale security headers', () => {
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const cache = vercel.headers
    .find(rule => rule.source === '/')?.headers
    ?.find(header => header.key === 'Cache-Control')?.value || '';

  assert.match(cache, /\bno-store\b/,
    'the root document must fetch fresh security headers after deployment');
});

test('shared interface keeps its accessibility affordances', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const css = readFileSync(join(root, 'css/style.css'), 'utf8');
  const i18n = readFileSync(join(root, 'js/i18n.js'), 'utf8');
  const bodyRule = css.match(/\nbody\{([\s\S]*?)\}/)?.[1] || '';

  assert.equal((html.match(/class="cert__close"/g) || []).length, 2,
    'both long dialogs need a close control at the top');
  assert.match(html, /id="workPanel"[^>]*aria-describedby="workBlurb"/,
    'the project dialog needs its overview as an accessible description');
  assert.doesNotMatch(bodyRule, /user-select\s*:\s*none/,
    'readable page text must remain selectable');
  assert.match(css, /--tap-target\s*:\s*44px/,
    'shared controls need one explicit minimum target token');
  assert.match(css, /--label-size\s*:\s*\.75rem/,
    'small interface labels need one readable size token');
  assert.match(i18n, /'ui\.close'\s*:\s*'tutup'/,
    'the visible close control needs an Indonesian translation');
});
