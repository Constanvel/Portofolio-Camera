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
// `blurb` and `points` are what opens when a tile or a works card is
// pressed. `href` is optional and renders only when it is there — a project
// with no repo yet gets no link rather than a dead one.
//
// `year` and `role` are read off each project's own git history, not
// remembered: the span is first commit to last, and `role` is how many people
// appear in `git shortlog`. artvault is the one exception — it has no repo, so
// its dates come from the files and nothing proves who else touched it.
// Everything in `blurb` and `points` describes what is on the screenshots.
export const WORKS = [
  {
    src: './assets/tiles/lensa.jpg', label: 'lensa',
    year: 'aug 2026', role: 'solo',
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
    year: 'aug 2026', role: 'solo',
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
    year: 'may–jun 2026', role: 'one of four',
    blurb: 'Pocket-money tracking on a phone. Adding a transaction is one sheet and nothing else: in or out, an amount, a category, and a note only if it needs one.',
    points: [
      'Money in and money out on a single toggle',
      'Categories: food, transport, entertainment, other',
      'An optional note, dated for you'
    ]
  },
  {
    src: './assets/tiles/smk-telkom-purwokerto.jpg', label: 'smk telkom purwokerto',
    year: 'jul–aug 2026', role: 'two of us',
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
    year: 'aug 2026', role: 'solo',
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
  { text: 'works',        route: 'works'        },
  { text: 'experience',   route: 'experience'   },
  { text: 'services',     route: 'services'     },
  { text: 'achievements', route: 'achievements' },
  { text: 'contact',      route: 'contact'      }
];
