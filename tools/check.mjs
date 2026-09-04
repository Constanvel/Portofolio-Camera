// ══ the one check ═══════════════════════════════════════════════════════════
//   node tools/check.mjs
//
// Two things have actually broken in this repo, and this is both of them.
//
//   1. A row gets added and its translation does not. The site then ships half
//      in Indonesian, quietly, because a missing key falls back to the English
//      by design — which is right for a visitor and useless for noticing. This
//      is what caught `d.aug26` sitting in the dictionary with nothing using it.
//   2. A file gets renamed and one reference does not follow. Five tiles went
//      from .jpg to .webp in one commit; a sixth reference somewhere would have
//      been a grey rectangle on the plane and nothing in the console.
//
// No framework and no dependencies, because the site has none either and a
// check that needs an install is a check nobody runs.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const all = (re, s) => [...s.matchAll(re)].map(m => m[1]);

const fail = [];
const note = (what, list) => { if (list.length) fail.push(`${what}:\n    ${list.join('\n    ')}`); };

/* ── 1. the dictionary against every place a key is spelled ──────────────── */
const dict = read('js/i18n.js');
const keys = new Set(all(/^ {2}'([^']+)':/gm, dict));

const markup = ['index.html', '404.html'].map(read).join('\n');
const scripts = ['js/main.js', 'js/scene.js', 'js/canvas.js'].map(read).join('\n');

// data-t / data-ta / data-tc in the markup, and s('...') in the scripts
const used = new Set([
  ...all(/data-t[ac]?="([^"]+)"/g, markup),
  ...all(/\bs\('([^']+)'/g, scripts)
]);

/* Keys built at runtime — s('nav.' + r) and friends — arrive here as the bare
   prefix. Anything under a prefix that is spelled somewhere counts as used,
   and the prefix itself is not a key. */
const prefixes = [...used].filter(k => k.endsWith('.'));
for (const p of prefixes) used.delete(p);
const covered = k => prefixes.some(p => k.startsWith(p));

note('kunci dipakai tapi tidak ada di kamus', [...used].filter(k => !keys.has(k)).sort());
note('entri kamus yang tidak dipakai siapa pun', [...keys].filter(k => !used.has(k) && !covered(k)).sort());

/* ── 2. every asset a file points at is a file that exists ───────────────── */
const sources = ['index.html', '404.html', 'css/style.css',
                 ...readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => `js/${f}`)];
const missing = new Set(), seen = new Set();
for (const src of sources) {
  /* Bare `assets/...` anywhere, not a quoted attribute value: og:image carries
     an absolute url and the crest's srcset lists two paths separated by a width
     descriptor, so neither is wrapped in quotes of its own. */
  for (const ref of all(/(assets\/[A-Za-z0-9/._-]+\.[A-Za-z0-9]+)/g, read(src))) {
    const rel = ref;
    seen.add(rel);
    if (!existsSync(join(ROOT, rel))) missing.add(`${rel}  <- ${src}`);
  }
}
note('rujukan aset yang berkasnya tidak ada', [...missing].sort());

// and the other way round: a file nobody points at is a file being deployed
// for nothing. assets/photo is gitignored and never reaches here.
const walk = d => readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]);
note('aset terkirim yang tidak dirujuk apa pun',
     walk('assets').filter(f => !seen.has(f) && !f.startsWith('assets/photo/')).sort());

/* ── 3. no control characters loose in the source ────────────────────────
   A `\b` inside a regex, written through a tool that ate one backslash, became
   a literal backspace — and `/^id\x08/` matches nothing, so no browser was
   ever detected as Indonesian. It read correctly in every editor and every
   diff, because a backspace is invisible in all of them. Nothing legitimate in
   this repo contains one, so the whole class is worth one pass. */
const ctrl = [];
for (const f of [...sources, 'tools/check.mjs']) {
  [...read(f)].forEach((ch, i) => {
    const c = ch.charCodeAt(0);
    if (c < 32 && ch !== '\n' && ch !== '\r' && ch !== '\t')
      ctrl.push(`${f} — kode ${c} pada offset ${i}`);
  });
}
note('karakter kendali di dalam sumber', ctrl);

/* ── the verdict ─────────────────────────────────────────────────────────── */
if (fail.length) {
  console.error('GAGAL\n\n  ' + fail.join('\n\n  ') + '\n');
  process.exit(1);
}
console.log(`ok — ${keys.size} kunci, ${seen.size} aset, semuanya cocok`);
