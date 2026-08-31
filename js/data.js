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

// Text cards live in the same grid as the films and are clickable.
export const CARDS = [
  { text: 'about',   route: 'about'   },
  { text: 'contact', route: 'contact' }
];
