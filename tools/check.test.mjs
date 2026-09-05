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
