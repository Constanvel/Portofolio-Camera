// The work. Order is the order they tile across the canvas.
// `src` takes a film (.mp4) or a still (.png .jpg .webp .gif .avif) — a still is
// drawn the same way, minus the decoder. Everything is served at one size; the
// five below are stills, because a screenshot is what these projects look like.
// A film would be the first thing here big enough to be worth a phone-sized
// second copy, and canvas.js has no such swap any more — the folder it used to
// point at was never created.
// `label` holds the slot until the picture arrives — canvas.js draws it in
// place of a tile whose file is missing, and nothing once the file is there.
// The extension in `src` is not decoration: it is how canvas.js decides between
// an <img> and a <video>, so a .png dropped in under a .jpg name loads neither.
//
// `href` is the project's own home — read off each repo's git remote, not
// typed from memory, and every one checked for a 200 before it went in: a link
// to a private repo is a 404 to everyone but its owner. artvault has none
// because it has no repo, and the panel simply leaves the row out.
//
// The two team projects point at forks under this account rather than at the
// repos they were built in — KiandrAHD/smk-telkom-purwokerto and
// AvilaSavero/UangJajanTracker. GitHub still prints "forked from …" under the
// title, which is the honest part and cannot be turned off. A fork is a
// snapshot of the moment it was taken: if either upstream moves on, these go
// stale and have to be synced.
//
// `note` is the single line under a card in `works`; `blurb` and `points` are
// the longer version, and open when a tile or a works card is pressed. Two
// fields rather than one derived from the other: taking the first sentence of
// `blurb` would work for four of these and swallow the whole paragraph for smk
// telkom, whose first full stop is at the very end. `href` is optional and renders only when it is there — a project
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
    href: 'https://github.com/Constanvel/Lensa',
    note: 'A place to read and write about characters and works — essays, read through six lenses.',
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
    note: 'An art community: uploads, discovery, rankings, commissions and contests.',
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
    href: 'https://github.com/Constanvel/UangJajanTracker',
    note: 'A spending tracker for a phone — money in, money out, by category.',
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
    href: 'https://github.com/Constanvel/smk-telkom-purwokerto',
    note: 'The school site: admissions, majors, the job centre, and two assistants.',
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
    href: 'https://github.com/Constanvel/AI-Text-Summarizer',
    note: 'Long text in, a short summary out, at three lengths. Runs on Groq.',
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
