// The work. Order is the order they tile across the canvas.
// `src` takes a film (.mp4) or a still (.png .jpg .webp .gif .avif) — a still is
// drawn the same way, minus the decoder. Films need a 640-wide twin in
// assets/tiles-sm/ for phones; stills are served at one size.
// `label` is optional — leave it empty and the tile shows the work alone.
export const WORKS = [
  { src: './assets/tiles/scape-final.mp4',       label: '' },
  { src: './assets/tiles/bubu-bar-directed.mp4', label: '' },
  { src: './assets/tiles/hyde-park.mp4',         label: '' },
  { src: './assets/tiles/video-2.mp4',           label: '' },
  { src: './assets/tiles/bubu-promo.mp4',        label: '' },
  { src: './assets/tiles/nomad-mograph.mp4',     label: '' },
  { src: './assets/tiles/scape-loop.mp4',        label: '' },
  { src: './assets/tiles/bububar.mp4',           label: '' }
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
