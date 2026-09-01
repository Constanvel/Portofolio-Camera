// The work. Order is the order they tile across the canvas.
// `src` takes a film (.mp4) or a still (.png .jpg .webp .gif .avif) — a still is
// drawn the same way, minus the decoder. Films need a 640-wide twin in
// assets/tiles-sm/ for phones; stills are served at one size, which is why the
// five below are stills: a screenshot is what these projects look like.
// `label` holds the slot until the picture arrives — canvas.js draws it in
// place of a tile whose file is missing, and nothing once the file is there.
// The extension in `src` is not decoration: it is how canvas.js decides between
// an <img> and a <video>, so a .png dropped in under a .jpg name loads neither.
//
// `blurb` and `points` are what opens when a tile or a portfolio row is
// pressed. `year`, `role` and `href` are optional and render only when they
// are there — a project with no repo yet simply has no link, rather than a
// dead one. Everything below describes what is actually on the screenshots;
// fill the empty fields in as they become true.
export const WORKS = [
  {
    src: './assets/tiles/lensa.jpg', label: 'lensa',
    blurb: 'A place to read and write criticism. An essay is filed against the characters and works it is about, so a piece has somewhere to live and something to be found from.',
    points: [
      'Search across characters, works and essays at once',
      'A feed, and six lenses to read a work through',
      'Accounts, saved work, settings',
      'Written empty and error states — down to a page listing every component state'
    ]
  },
  {
    src: './assets/tiles/artvault.jpg', label: 'artvault',
    blurb: 'A community for artists to publish and be found. Work arrives in a feed, gets ranked, and can be commissioned or entered into a contest.',
    points: [
      'Upload, then discovery, rankings and contests',
      'Commissions',
      'Categories — painting, illustration, photography, digital art',
      'Favourites, collections and notifications'
    ]
  },
  {
    src: './assets/tiles/uang-jajan-tracker.jpg', label: 'uang jajan tracker',
    blurb: 'Pocket-money tracking on a phone. Adding a transaction is one sheet and nothing else: in or out, an amount, a category, and a note only if it needs one.',
    points: [
      'Money in and money out on a single toggle',
      'Categories: food, transport, entertainment, other',
      'An optional note, dated for you'
    ]
  },
  {
    src: './assets/tiles/smk-telkom-purwokerto.jpg', label: 'smk telkom purwokerto',
    blurb: 'The school’s own site — admissions, the majors on offer, the job centre and announcements, with an admin login behind all of it.',
    points: [
      'PPDB admissions, and the majors',
      'BKK — vacancies, internships, careers',
      'News and announcements',
      'Two assistants: STELA answers questions about the school, NextTel helps choose a major',
      'An admin login'
    ]
  },
  {
    src: './assets/tiles/ai-text-summarizer.jpg', label: 'ai text summarizer',
    blurb: 'Paste something long, get the short version. Three lengths, and it counts the words while you type.',
    points: [
      'Short, medium or long summaries',
      'A live word count',
      'Runs on Groq',
      'Ctrl+Enter to summarise'
    ]
  }
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
