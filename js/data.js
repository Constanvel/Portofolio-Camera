// The work. Order is the order they tile across the canvas.
// `src` takes a film (.mp4) or a still (.png .jpg .webp .gif .avif) — a still is
// drawn the same way, minus the decoder. Films need a 640-wide twin in
// assets/tiles-sm/ for phones; stills are served at one size, which is why the
// five below are stills: a screenshot is what these projects look like.
// `label` holds the slot until the picture arrives — canvas.js draws it in
// place of a tile whose file is missing, and nothing once the file is there.
// The extension in `src` is not decoration: it is how canvas.js decides between
// an <img> and a <video>, so a .png dropped in under a .jpg name loads neither.
export const WORKS = [
  { src: './assets/tiles/lensa.jpg',                 label: 'lensa' },
  { src: './assets/tiles/artvault.jpg',              label: 'artvault' },
  { src: './assets/tiles/uang-jajan-tracker.jpg',    label: 'uang jajan tracker' },
  { src: './assets/tiles/smk-telkom-purwokerto.jpg', label: 'smk telkom purwokerto' },
  { src: './assets/tiles/ai-text-summarizer.jpg',    label: 'ai text summarizer' }
];

// Text cards live in the same grid as the films and are clickable. One per
// section in the navbar, so every section can also be stumbled on by dragging
// rather than only reached from the bar. `route` must match the id of a
// <section class="page" id="pageXxx"> in index.html, lowercased — a route with
// no section routes nowhere. Adding one here also needs a slot in SLOTS,
// js/canvas.js: a card with no slot is never drawn.
export const CARDS = [
  { text: 'about',        route: 'about'        },
  { text: 'skills',       route: 'skills'       },
  { text: 'portfolio',    route: 'portfolio'    },
  { text: 'experience',   route: 'experience'   },
  { text: 'services',     route: 'services'     },
  { text: 'achievements', route: 'achievements' },
  { text: 'contact',      route: 'contact'      }
];
