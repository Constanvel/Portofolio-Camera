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
//
// A field spelled `x_id` is the Indonesian for `x` — see t() in js/i18n.js,
// which reads it when the site is in Indonesian and falls back to the English
// when it is not there. The translations sit here rather than in that
// dictionary because this is the file that is open when a project is added,
// and a translation two files away is a translation nobody writes.
// `label` is a project's own name and is not one of them. `year` is, but only
// because the month abbreviations differ: aug is agu, may is mei.
export const WORKS = [
  {
    src: './assets/tiles/lensa.jpg', label: 'lensa',
    href: 'https://github.com/Constanvel/Lensa',
    note: 'A place to read and write about characters and works — essays, read through six lenses.',
    note_id: 'Tempat membaca dan menulis tentang karakter dan karya — esai, dibaca lewat enam lensa.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    blurb: 'A place to read and write criticism. An essay is filed against the characters and works it is about, so a piece has somewhere to live and something to be found from.',
    blurb_id: 'Tempat membaca dan menulis kritik. Sebuah esai diarsipkan pada karakter dan karya yang dibahasnya, jadi tulisan punya tempat tinggal dan punya jalan untuk ditemukan.',
    points: [
      'Search across characters, works and essays at once',
      'A feed, and six lenses to read a work through',
      'Accounts, saved work, settings',
      'Written empty and error states — down to a page listing every component state'
    ],
    points_id: [
      'Pencarian karakter, karya dan esai sekaligus',
      'Sebuah feed, dan enam lensa untuk membaca satu karya',
      'Akun, simpanan, pengaturan',
      'State kosong dan error yang ditulis — sampai satu halaman yang mendaftar setiap state komponen'
    ]
  },
  {
    src: './assets/tiles/artvault.jpg', label: 'artvault',
    note: 'An art community: uploads, discovery, rankings, commissions and contests.',
    note_id: 'Komunitas seni: unggahan, penemuan, peringkat, komisi dan lomba.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    blurb: 'A community for artists to publish and be found. Work arrives in a feed, gets ranked, and can be commissioned or entered into a contest.',
    blurb_id: 'Komunitas tempat perupa menerbitkan karya dan ditemukan. Karya masuk ke feed, diberi peringkat, dan bisa dikomisikan atau diikutkan lomba.',
    points: [
      'Upload, then discovery, rankings and contests',
      'Commissions',
      'Categories — painting, illustration, photography, digital art',
      'Favourites, collections and notifications'
    ],
    points_id: [
      'Unggah, lalu penemuan, peringkat dan lomba',
      'Komisi',
      'Kategori — lukisan, ilustrasi, fotografi, seni digital',
      'Favorit, koleksi dan notifikasi'
    ]
  },
  {
    src: './assets/tiles/uang-jajan-tracker.jpg', label: 'uang jajan tracker',
    href: 'https://github.com/Constanvel/UangJajanTracker',
    note: 'A spending tracker for a phone — money in, money out, by category.',
    note_id: 'Pelacak pengeluaran untuk ponsel — uang masuk, uang keluar, per kategori.',
    year: 'may–jun 2026', role: 'one of four',
    year_id: 'mei–jun 2026', role_id: 'satu dari empat',
    blurb: 'Pocket-money tracking on a phone. Adding a transaction is one sheet and nothing else: in or out, an amount, a category, and a note only if it needs one.',
    blurb_id: 'Melacak uang jajan di ponsel. Menambah transaksi cukup satu lembar dan tidak lebih: masuk atau keluar, nominal, kategori, dan catatan hanya kalau perlu.',
    points: [
      'Money in and money out on a single toggle',
      'Categories: food, transport, entertainment, other',
      'An optional note, dated for you'
    ],
    points_id: [
      'Uang masuk dan uang keluar dalam satu sakelar',
      'Kategori: makan, transport, hiburan, lainnya',
      'Catatan opsional, tanggalnya diisikan untukmu'
    ]
  },
  {
    src: './assets/tiles/smk-telkom-purwokerto.jpg', label: 'smk telkom purwokerto',
    href: 'https://github.com/Constanvel/smk-telkom-purwokerto',
    note: 'The school site: admissions, majors, the job centre, and two assistants.',
    note_id: 'Situs sekolah: PPDB, jurusan, bursa kerja, dan dua asisten.',
    year: 'jul–aug 2026', role: 'two of us',
    year_id: 'jul–agu 2026', role_id: 'berdua',
    blurb: 'The school’s own site — admissions, the majors on offer, the job centre and announcements, with an admin login behind all of it.',
    blurb_id: 'Situs resmi sekolah — PPDB, jurusan yang dibuka, bursa kerja dan pengumuman, dengan login admin di belakang semuanya.',
    points: [
      'PPDB admissions, and the majors',
      'BKK — vacancies, internships, careers',
      'News and announcements',
      'Two assistants: STELA answers questions about the school, NextTel helps choose a major',
      'An admin login'
    ],
    points_id: [
      'PPDB, dan jurusannya',
      'BKK — lowongan, magang, karier',
      'Berita dan pengumuman',
      'Dua asisten: STELA menjawab pertanyaan soal sekolah, NextTel membantu memilih jurusan',
      'Login admin'
    ]
  },
  {
    src: './assets/tiles/ai-text-summarizer.jpg', label: 'ai text summarizer',
    href: 'https://github.com/Constanvel/AI-Text-Summarizer',
    note: 'Long text in, a short summary out, at three lengths. Runs on Groq.',
    note_id: 'Teks panjang masuk, ringkasan pendek keluar, dalam tiga panjang. Jalan di atas Groq.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    blurb: 'Paste something long, get the short version. Three lengths, and it counts the words while you type.',
    blurb_id: 'Tempel sesuatu yang panjang, dapat versi pendeknya. Tiga panjang, dan kata-katanya dihitung sambil kamu mengetik.',
    points: [
      'Short, medium or long summaries',
      'A live word count',
      'Runs on Groq',
      'Ctrl+Enter to summarise'
    ],
    points_id: [
      'Ringkasan pendek, sedang atau panjang',
      'Hitungan kata langsung',
      'Jalan di atas Groq',
      'Ctrl+Enter untuk meringkas'
    ]
  }
];

// Text cards live in the same grid as the films and are clickable. One per
// section in the navbar, so every section can also be stumbled on by dragging
// rather than only reached from the bar. `route` must match the id of a
// <section class="page" id="pageXxx"> in index.html, lowercased — a route with
// no section routes nowhere. Adding one here also needs a slot in SLOTS,
// js/canvas.js: a card with no slot is never drawn.
// `text_id` is the Indonesian, read through the same t() as everything above.
// canvas.js calls it on every frame it paints, so switching language redraws
// the plane on its own rather than needing to be told about it.
export const CARDS = [
  { text: 'about',        text_id: 'tentang',    route: 'about'        },
  { text: 'skills',       text_id: 'keahlian',   route: 'skills'       },
  { text: 'works',        text_id: 'karya',      route: 'works'        },
  { text: 'experience',   text_id: 'pengalaman', route: 'experience'   },
  { text: 'services',     text_id: 'layanan',    route: 'services'     },
  { text: 'achievements', text_id: 'pencapaian', route: 'achievements' },
  { text: 'contact',      text_id: 'kontak',     route: 'contact'      }
];
