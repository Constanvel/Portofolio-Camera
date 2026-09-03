// ══ two languages, one document ═════════════════════════════════════════════
// The English is not in here. It stays where it is read — in index.html and in
// js/data.js — because that copy is the one a crawler indexes, the one a
// <noscript> visitor gets, and the one that paints in the frame before this
// module has run. Writing it out a second time in a table would mean every
// future edit had to land in two places, and the day it lands in one is the day
// the site starts saying different things in different languages. So this file
// holds only the Indonesian, and the English is taken off the DOM on the way
// past — see `snap` below.
//
// Three ways in, because the strings arrive three ways:
//   applyLang(l)     everything that IS in the markup, matched by data-t
//   t(obj, 'note')   a field on a WORKS or CARDS entry — reads `note_id`
//   s('nav.about')   a string the markup never had, built by js/main.js
//
// A missing translation falls back to the English every time rather than
// rendering a key or a blank: half-translated is a state this will actually be
// in, every time a row is added and this file is not opened.

export let lang = 'en';
export const LANGS = ['en', 'id'];

/* A field off a data object, in the current language. One helper for every
   translated field in js/data.js — `note` and `note_id`, `blurb` and
   `blurb_id` — so adding a translated field there needs nothing here. */
export const t = (o, k) => (lang === 'id' && o[k + '_id']) || o[k];

/* A string that is generated rather than sitting in the markup: the section
   name on the menu button, the theme name in the panel, the label on the link
   in a project panel. Same table as everything below, so there is no second
   dictionary for the handful of strings JavaScript happens to build. */
export const s = (k, en = k) => (lang === 'id' && ID[k]) || en;

/* The language to open in: a saved choice first, then what the browser asked
   for — navigator.languages is ordered by preference and carries regional
   tags, so id-ID has to match as well as plain id. Anything else, and anything
   at all on a browser that answers nothing, is English, because that is what
   the documents already say.
   Here rather than in js/main.js because 404.html has to reach the same answer
   and has none of main.js — no router, no scene, no storage helpers. */
export function pickLang(saved){
  if (LANGS.includes(saved)) return saved;
  return (navigator.languages || [navigator.language || ''])
    .some(l => /^id/i.test(l)) ? 'id' : 'en';
}

/* Only the Indonesian, keyed by the data-t on the node it replaces.
   ponytail: the four credit rows carry their <a href> in here as well as in
   index.html, so those five urls exist twice and a link that moves has to move
   in both. The alternative was cutting each sentence into fragments around its
   links, which fixes word order in English and is a worse thing to do to a
   translation. If a fifth borrowed part shows up, this is still the cheaper
   side of the trade. */
const ID = {
  /* the sections. One entry each, used by the nav link, the heading on the
     section itself, the card on the canvas and the menu button — same word in
     all four places, so it is the same key in all four. */
  'nav.home':         'beranda',
  'nav.about':        'tentang',
  'nav.skills':       'keahlian',
  'nav.works':        'karya',
  'nav.experience':   'pengalaman',
  'nav.services':     'layanan',
  'nav.achievements': 'pencapaian',
  'nav.contact':      'kontak',
  'nav.menu':         'menu',
  'nav.label':        'bagian',

  /* the furniture */
  'ui.back':      'kembali',
  'ui.skip':      'lewati intro',
  'ui.settings':  'pengaturan',
  'ui.drag':      'geser untuk menjelajah',
  'ui.canvas':    'Karya, dijejer di bidang yang bisa digeser. Setiap bagian juga tersedia sebagai tautan di bawah.',
  'set.theme':    'tema',
  'set.volume':   'volume',
  'set.lang':     'bahasa',
  // painted into the iPod's screen by js/scene.js rather than laid out by the
  // browser, which is why the switch has to ask that act to repaint
  'ipod.play':    'tekan play',
  'mode.light':   'terang',
  'mode.dark':    'gelap',

  /* The document's only <h1>. Visually hidden, so this is a string almost
     nobody sees and everybody using a reader hears first. */
  'h1': 'Constantine Rainer Simanjuntak — siswa PPLG di SMK Telkom Purwokerto',

  /* about */
  'about.body': 'Constantine Rainer Simanjuntak — PPLG, SMK Telkom Purwokerto. Saya membangun untuk web dengan React, Tailwind dan Node — platform baca dan esai, komunitas seni, situs sekolah saya sendiri, pelacak pengeluaran — dan perkakas AI di atas model terbuka. Finalis lomba UI/UX Design di Sevent 9.0, Telkom University Purwokerto. Di luar jam kerja saya bikin video desktop aesthetic untuk TikTok, biasanya dengan lagu shoegaze.',
  'about.credits': 'Dibangun dengan bagian-bagian pinjaman, didaftar di sini justru karena dipinjam — semuanya di bawah lisensi yang mengizinkannya. Foto, tulisan dan kodenya milik saya.',
  'cr.cam.k': '3d · kamera',
  'cr.cam.v': '<a class="rows__a" href="https://sketchfab.com/3d-models/digital-camera-5b2573eab7bf48f2bb8cd5a6026795b1" target="_blank" rel="noopener">Digital Camera</a> oleh Dokono Kinokoda — <a class="rows__a" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>, mesh dan teksturnya dikompres ulang.',
  'cr.ipod.v': '<a class="rows__a" href="https://sketchfab.com/3d-models/ipod-classic-13dbe30b0e45408c8bfaddfe6a4e8786" target="_blank" rel="noopener">iPod Classic</a> oleh Timothy Ahene — <a class="rows__a" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>, teksturnya diperkecil separuh dan dikompres ulang.',
  'cr.type.k': 'huruf',
  'cr.type.v': 'VCR OSD Mono oleh Riciery Leal. Selebihnya memakai huruf antarmuka sistem.',
  'cr.music.k': 'musik',
  'cr.music.v': '“<a class="rows__a" href="https://www.nihilore.com/postrock" target="_blank" rel="noopener">Something Meaningful</a>” oleh Nihilore — <a class="rows__a" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> — loop 48 detik dari bagian pembuka, dikodekan ulang lebih pelan dan lebih kecil.',

  /* skills. The values that are nothing but product names are not in here:
     "React 19, Next.js 16 (App Router), Vite" reads the same in both, and a
     row with no entry keeps its English rather than needing a copy of itself. */
  'sk.lang.k':    'bahasa',
  'sk.design.k':  'desain',
  'sk.tools.k':   'perkakas',
  'sk.back.v':    'Supabase — Postgres dengan migrasi skema, autentikasi, penyimpanan, dan Edge Functions dalam TypeScript',
  'sk.ai.v':      'API model bahasa dengan cadangan penyedia dan pembatas biaya, dikirim sebagai edge function',
  'sk.design.v':  'UI/UX, Figma, sistem desain dan state komponen, motion dan penyuntingan video',
  'sk.tools.v':   'Git, Vite, ESLint, Node — termasuk plugin dev-server Vite yang ditulis untuk salah satu proyek ini',

  /* the date keys. Only the ones that actually differ: feb, mar and jun are
     spelled the same way in both, and jan–mar reads the same too. */
  'd.now':      'sekarang',
  'd.aug26':    'agu 2026',
  'd.ongoing':  'berjalan',

  /* experience */
  'xp.now.v':     'PPLG, SMK Telkom Purwokerto — jurusan rekayasa perangkat lunak.',
  'xp.club.v':    'Klub AI sekolah — model bahasa, dari purwarupa sampai demo.',
  'xp.kumpul.v':  'AI Ignition Training, KUMPUL.ID — tiga puluh jam dalam sembilan modul, di bawah AI Opportunity Fund bersama Google.org dan AVPN.',
  'xp.own.v':     'Proyek pribadi — React, Tailwind dan Node, dikerjakan dari awal sampai rilis.',

  /* services */
  'sv.web.v':     'React, Next.js dan Tailwind, di atas Supabase — dari repo kosong sampai sesuatu yang tayang.',
  'sv.ux.v':      'Tata letak, tipografi dan alur. Dari Figma sampai kode yang merilisnya.',
  'sv.plat.k':    'platform',
  'sv.plat.v':    'Akun, unggahan, feed dan setiap halaman di antaranya.',
  'sv.ai.k':      'integrasi ai',
  'sv.ai.v':      'Asisten dan peringkas di atas API model bahasa.',
  'sv.video.v':   'Edit video pendek dan motion untuk web.',
  'sv.cta':       'mulai sesuatu',

  /* achievements. The certificate titles are what is printed on the
     certificates, so only the words around them move. */
  'ach.sevent.v': 'Finalis — lomba UI/UX Design, Sevent 9.0, Telkom University Purwokerto.',
  'ach.toeic.v':  'TOEIC Excellence Program, English Discoveries — Edusoft, anak perusahaan ETS.',
  'ach.wise.v':   'Lomba Desain UI/UX Nasional, WISE InnoVera — Universitas Widyatama.',
  'ach.asean.v':  'AI Ready ASEAN — seluruh modul AI selesai. ASEAN Foundation, bersama Google.org.',
  'ach.efun.v':   'English Fun (E-Fun) — presentasi ala TED, Cabang Dinas Pendidikan Wilayah X, Jawa Tengah.',
  'ach.google.v': 'Google, AI untuk pendidik jenjang dasar dan menengah — selesai, nilai 100.',

  /* contact */
  'ct.body': 'Terbuka untuk kolaborasi, lomba, dan apa pun yang perlu dibangun.',
  'ct.cta':  'kirim pesan',

  /* the page that is not a page.
     No toggle over there: there is nothing on a 404 to change your mind about,
     so it only honours the choice already made on the real page. */
  'e404.title': 'Tidak ada di sini — Constantine Rainer Simanjuntak',
  'e404.t':     'tidak ada di sini',
  'e404.body':  'Alamat itu tidak ada. Semua bagiannya tinggal di satu halaman.',
  'e404.cta':   'ke halaman awal',

  /* what the page says about itself before anyone opens it.
     ponytail: a scraper never runs this — WhatsApp, Twitter and Facebook read
     the markup and stop, so what they quote is the English above, always. Only
     a crawler that renders (Googlebot does) ever sees these, and it renders
     with no saved choice and a browser that asks for English, so it indexes
     the English too. They are here so the document is not describing itself in
     the wrong language to anyone who does read the DOM, and so the mechanism
     is already in place the day a real /id/ url exists — which is the only
     thing that would actually serve Indonesian to a scraper. */
  'meta.desc': 'Constantine Rainer Simanjuntak — siswa PPLG di SMK Telkom Purwokerto. Aplikasi web dan perkakas AI, dibangun dari awal sampai rilis.',
  'meta.og':   'Siswa PPLG di SMK Telkom Purwokerto. Aplikasi web dan perkakas AI, dibangun dari awal sampai rilis.',

  /* the two panels that open over the page */
  'wk.repo': 'buka repo di GitHub',
  'wk.open': 'buka proyeknya',
  'wk.file': 'buka berkasnya langsung'
};

/* Two things get swapped: what a node says, and what it says to a screen
   reader. A handful of controls here are named only by an aria-label — the
   plane you drag, the nav, the settings group — and leaving those behind would
   translate the site for everyone except the people reading it through a
   reader.
   innerHTML rather than textContent because several of these are sentences
   with a link inside them, and every value above is a literal in this file. */
const SLOTS = [
  ['t',  el => el.innerHTML,                  (el, v) => { el.innerHTML = v; }],
  ['ta', el => el.getAttribute('aria-label'), (el, v) => el.setAttribute('aria-label', v)],
  // `content`, for the <meta> description and its open-graph twin — see the
  // note on meta.desc above for how little that is worth and why it is here
  ['tc', el => el.getAttribute('content'),    (el, v) => el.setAttribute('content', v)]
];

/* The English, taken off the DOM the first time a key is asked for. Keyed by
   the data-t rather than by the element, which is also what makes eight `back`
   buttons one entry instead of eight. */
const snap = new Map();

export function applyLang(l){
  lang = LANGS.includes(l) ? l : 'en';
  document.documentElement.lang = lang;
  for (const [attr, read, write] of SLOTS){
    for (const el of document.querySelectorAll('[data-' + attr + ']')){
      const k = el.dataset[attr], id = attr + ':' + k;
      if (!snap.has(id)) snap.set(id, read(el));
      const v = lang === 'id' ? ID[k] : snap.get(id);
      if (v != null) write(el, v);
    }
  }
}
