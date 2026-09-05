// Generate the no-JS gallery from the same records as the interactive gallery.
// Run `node tools/fallback.mjs` after editing project content.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function renderFallback(works) {
  return '<ul class="rows">\n' + works.map(w =>
    `          <li class="rows__r"><span class="rows__k">${escape(w.label)}</span>` +
    `<span class="rows__v">${escape(w.note)} <a class="rows__a" href="${escape(w.href || w.src)}"` +
    ` target="_blank" rel="noopener">${w.href ? 'open the project' : 'view the screenshot'}</a></span></li>`
  ).join('\n') + '\n        </ul>';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { WORKS } = await import('../js/data.js');
  const file = join(dirname(fileURLToPath(import.meta.url)), '../index.html');
  const source = readFileSync(file, 'utf8');
  const marker = /(<noscript id="worksFallback">)[\s\S]*?(<\/noscript>)/;
  if (!marker.test(source)) throw new Error('Missing worksFallback in index.html');
  writeFileSync(file, source.replace(marker, (_, start, end) =>
    `${start}\n        ${renderFallback(WORKS)}\n      ${end}`));
  console.log('Updated no-JS works fallback.');
}
