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
// an <img> and a <video>, so keep an image extension for stills and .mp4 for video.
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
    src: './assets/tiles/lensa.webp', label: 'lensa',
    href: 'https://github.com/Constanvel/Lensa',
    note: 'A publishing platform for essays about fictional characters and works, organised through six critical lenses.',
    note_id: 'Platform publikasi esai tentang karakter dan karya fiksi, disusun melalui enam lensa analisis.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    challenge: 'Long-form character analysis is difficult to discover, source and discuss when every essay is presented as an isolated post.',
    challenge_id: 'Analisis karakter yang panjang sulit ditemukan, diberi sumber, dan didiskusikan ketika setiap esai berdiri sebagai tulisan yang terpisah.',
    contribution: 'Defined the product, designed the interface, implemented the Next.js application and modelled its Supabase schema, authentication and content rules.',
    contribution_id: 'Menentukan produk, merancang antarmuka, mengimplementasikan aplikasi Next.js, serta memodelkan skema Supabase, autentikasi, dan aturan kontennya.',
    approach: 'Structured discovery around six critical lenses, connected essays to characters and source works, and represented claims, citations and counterpoints as explicit data.',
    approach_id: 'Menyusun penemuan melalui enam lensa analisis, menghubungkan esai dengan karakter dan karya asal, serta menjadikan klaim, sitasi, dan counterpoint sebagai data yang jelas.',
    outcome: 'Produced a complete product prototype with search, reading, authoring, account flows, database migrations and automated checks for its core writing rules.',
    outcome_id: 'Menghasilkan prototipe produk lengkap dengan pencarian, pembacaan, penulisan, alur akun, migrasi database, dan pemeriksaan otomatis untuk aturan utama penulisan.',
    stack: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL'],
    stack_id: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL'],
    blurb: 'Lensa gives long-form criticism a clear structure. Readers can discover an essay through its character, source work, or critical lens, while writers get a focused place to publish.',
    blurb_id: 'Lensa memberi struktur yang jelas untuk tulisan analisis panjang. Pembaca dapat menemukan esai melalui karakter, karya asal, atau lensa analisisnya, sementara penulis mendapat tempat yang fokus untuk menerbitkan tulisan.',
    points: [
      'Unified search across characters, works and essays',
      'Essay pages connected to the character and source work they discuss',
      'A discovery feed organised through six critical lenses',
      'Accounts, saved reading, settings, and complete empty and error states'
    ],
    points_id: [
      'Pencarian terpadu untuk karakter, karya, dan esai',
      'Halaman esai yang terhubung ke karakter dan karya yang dibahas',
      'Feed penemuan yang disusun melalui enam lensa analisis',
      'Akun, bacaan tersimpan, pengaturan, serta state kosong dan error yang lengkap'
    ]
  },
  {
    src: './assets/tiles/artvault.webp', label: 'artvault',
    note: 'An art-community interface for publishing, discovering and commissioning creative work.',
    note_id: 'Antarmuka komunitas seni untuk menerbitkan, menemukan, dan memesan karya kreatif.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    challenge: 'Art platforms often separate discovery, competition and commission flows, making it harder for a new artist to move from publishing work to finding an audience.',
    challenge_id: 'Platform seni sering memisahkan alur penemuan, lomba, dan komisi sehingga seniman baru lebih sulit bergerak dari menerbitkan karya menuju menemukan audiens.',
    contribution: 'Created the product direction, information architecture, visual system and interactive frontend concept.',
    contribution_id: 'Membuat arah produk, arsitektur informasi, sistem visual, dan konsep frontend interaktif.',
    approach: 'Placed discovery, ranking, commissions and contests in one navigation system, then designed complete states for publishing, profiles, collections and notifications.',
    approach_id: 'Menempatkan penemuan, peringkat, komisi, dan lomba dalam satu sistem navigasi, lalu merancang state lengkap untuk publikasi, profil, koleksi, dan notifikasi.',
    outcome: 'Completed an interface concept that demonstrates the main journey from uploading artwork to receiving engagement and commission enquiries.',
    outcome_id: 'Menyelesaikan konsep antarmuka yang menunjukkan perjalanan utama dari mengunggah karya sampai menerima interaksi dan permintaan komisi.',
    stack: ['React', 'JavaScript', 'CSS', 'Figma'],
    stack_id: ['React', 'JavaScript', 'CSS', 'Figma'],
    blurb: 'ARTVAULT is an interface concept for an artist community. It brings discovery, rankings, commissions and contests into one clear path from publishing work to finding an audience.',
    blurb_id: 'ARTVAULT adalah konsep antarmuka komunitas seniman. Penemuan karya, peringkat, komisi, dan lomba dirangkai dalam satu alur yang jelas dari menerbitkan karya hingga menemukan audiens.',
    points: [
      'Publishing and discovery flows for new artwork',
      'Rankings, contests, and tiered commission packages',
      'Categories for painting, illustration, photography, and digital art',
      'Favourites, collections, notifications, and artist profiles'
    ],
    points_id: [
      'Alur publikasi dan penemuan karya baru',
      'Peringkat, lomba, dan paket komisi bertingkat',
      'Kategori lukisan, ilustrasi, fotografi, dan seni digital',
      'Favorit, koleksi, notifikasi, dan profil seniman'
    ]
  },
  {
    src: './assets/tiles/uang-jajan-tracker.webp', label: 'uang jajan tracker',
    href: 'https://github.com/Constanvel/UangJajanTracker',
    note: 'A mobile-first allowance tracker that makes daily income and spending quick to record.',
    note_id: 'Pelacak uang jajan mobile-first yang mempercepat pencatatan pemasukan dan pengeluaran harian.',
    year: 'may–jun 2026', role: 'one of four',
    year_id: 'mei–jun 2026', role_id: 'satu dari empat',
    challenge: 'Students need to record small daily income and expenses quickly, without the complexity of a full personal-finance application.',
    challenge_id: 'Pelajar perlu mencatat pemasukan dan pengeluaran kecil dengan cepat tanpa kerumitan aplikasi keuangan pribadi yang lengkap.',
    contribution: 'Worked in a four-person team on the product direction and user experience for the mobile transaction flow.',
    contribution_id: 'Bekerja dalam tim beranggotakan empat orang pada arah produk dan pengalaman pengguna untuk alur transaksi mobile.',
    approach: 'Reduced entry to one transaction sheet with a direction toggle, amount, category, automatic date and optional note.',
    approach_id: 'Menyederhanakan input menjadi satu lembar transaksi berisi pilihan jenis, nominal, kategori, tanggal otomatis, dan catatan opsional.',
    outcome: 'Delivered a mobile application flow backed by an API and database, with clear recording paths for common student spending.',
    outcome_id: 'Menghasilkan alur aplikasi mobile yang didukung API dan database, dengan jalur pencatatan yang jelas untuk pengeluaran umum pelajar.',
    stack: ['Flutter', 'Dart', 'Node.js', 'MySQL'],
    stack_id: ['Flutter', 'Dart', 'Node.js', 'MySQL'],
    blurb: 'Uang Jajan Tracker keeps everyday money records simple on a phone. A single transaction sheet captures the direction, amount and category, with an optional note for extra context.',
    blurb_id: 'Uang Jajan Tracker menyederhanakan pencatatan uang harian di ponsel. Satu lembar transaksi mencatat jenis, nominal, dan kategori, dengan catatan opsional untuk konteks tambahan.',
    points: [
      'Income and expenses through one clear toggle',
      'Categories for food, transport, entertainment, and other needs',
      'Automatic dates and optional notes for each transaction'
    ],
    points_id: [
      'Pemasukan dan pengeluaran melalui satu sakelar yang jelas',
      'Kategori makan, transportasi, hiburan, dan kebutuhan lainnya',
      'Tanggal otomatis dan catatan opsional untuk setiap transaksi'
    ]
  },
  {
    src: './assets/tiles/smk-telkom-purwokerto.webp', label: 'smk telkom purwokerto',
    href: 'https://github.com/Constanvel/smk-telkom-purwokerto',
    demo: 'https://smk-telkom-purwokerto.vercel.app',
    note: 'A team-built school platform covering admissions, news, careers and student-facing assistants.',
    note_id: 'Platform sekolah yang dibangun bersama tim untuk PPDB, berita, karier, dan asisten siswa.',
    year: 'jul–aug 2026', role: 'two of us',
    year_id: 'jul–agu 2026', role_id: 'berdua',
    challenge: 'Public school information and the content behind it were spread across separate flows, while administrators needed one consistent place to keep them current.',
    challenge_id: 'Informasi publik sekolah dan konten di baliknya tersebar dalam alur terpisah, sementara admin membutuhkan satu tempat konsisten untuk memperbaruinya.',
    contribution: 'Designed and implemented the admin dashboard interface and management flows within the team project.',
    contribution_id: 'Merancang dan mengimplementasikan antarmuka dashboard admin serta alur pengelolaannya dalam proyek tim.',
    approach: 'Built reusable React and Tailwind patterns for dashboard navigation, overview states, tables and CRUD flows across school content.',
    approach_id: 'Membangun pola React dan Tailwind yang dapat digunakan ulang untuk navigasi dashboard, state ringkasan, tabel, dan alur CRUD konten sekolah.',
    outcome: 'The deployed platform now connects public admissions, news, achievements and career information with an administration experience for maintaining that content.',
    outcome_id: 'Platform yang telah di-deploy menghubungkan informasi PPDB, berita, prestasi, dan karier dengan pengalaman administrasi untuk mengelola konten tersebut.',
    stack: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    stack_id: ['React', 'JavaScript', 'Tailwind CSS', 'Vite'],
    blurb: 'The platform brings public school information and content management into one system. My scope focused on the admin dashboard interface used to manage the content behind the public site.',
    blurb_id: 'Platform ini menyatukan informasi publik sekolah dan pengelolaan konten dalam satu sistem. Bagian saya berfokus pada antarmuka dashboard admin untuk mengelola konten di balik situs publik.',
    points: [
      'PPDB information and major profiles',
      'BKK listings for vacancies, internships, and careers',
      'News, announcements, achievements, and admin content management',
      'STELA answers school questions; NextTel helps prospective students choose a major',
      'My contribution: the admin dashboard UI and its management flows'
    ],
    points_id: [
      'Informasi PPDB dan profil jurusan',
      'Daftar BKK untuk lowongan, magang, dan karier',
      'Berita, pengumuman, prestasi, dan pengelolaan konten admin',
      'STELA menjawab pertanyaan sekolah; NextTel membantu calon siswa memilih jurusan',
      'Kontribusi saya: UI dashboard admin dan alur pengelolaannya'
    ]
  },
  {
    src: './assets/tiles/ai-text-summarizer.webp', label: 'ai text summarizer',
    href: 'https://github.com/Constanvel/AI-Text-Summarizer',
    note: 'A focused web tool that turns long text into summaries at three selectable lengths using Groq.',
    note_id: 'Perkakas web yang mengubah teks panjang menjadi ringkasan dalam tiga pilihan panjang menggunakan Groq.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    challenge: 'Long source text takes time to review, while a useful summary still needs to respect the reader\'s preferred level of detail.',
    challenge_id: 'Teks sumber yang panjang membutuhkan waktu untuk ditinjau, sedangkan ringkasan yang berguna tetap harus mengikuti tingkat detail yang dibutuhkan pembaca.',
    contribution: 'Designed and built the complete interface, request flow, validation and Groq API integration.',
    contribution_id: 'Merancang dan membangun seluruh antarmuka, alur permintaan, validasi, dan integrasi API Groq.',
    approach: 'Kept the interaction to one focused input and three output lengths, with live word counting, keyboard submission and inline failure feedback.',
    approach_id: 'Memusatkan interaksi pada satu input dan tiga panjang keluaran, dilengkapi hitungan kata langsung, pengiriman lewat keyboard, dan pesan kegagalan di dalam halaman.',
    outcome: 'Produced a working summarisation tool with predictable controls and resilient error states instead of leaving failed requests unexplained.',
    outcome_id: 'Menghasilkan perkakas peringkasan yang berfungsi dengan kontrol yang jelas dan state error yang tetap informatif saat permintaan gagal.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Groq API'],
    stack_id: ['HTML', 'CSS', 'JavaScript', 'Groq API'],
    blurb: 'AI Text Summarizer reduces long input into a useful reading length. The interface keeps the task focused with live word counting, clear length controls and inline feedback when a request fails.',
    blurb_id: 'AI Text Summarizer memadatkan teks panjang menjadi bacaan dengan panjang yang dibutuhkan. Antarmukanya tetap fokus dengan hitungan kata langsung, pilihan panjang yang jelas, dan pesan error di dalam halaman.',
    points: [
      'Short, medium, and long summary modes',
      'Live word count and input validation',
      'Groq API integration with inline error feedback',
      'Ctrl+Enter keyboard shortcut for faster submission'
    ],
    points_id: [
      'Mode ringkasan pendek, sedang, dan panjang',
      'Hitungan kata langsung dan validasi input',
      'Integrasi API Groq dengan pesan error di dalam halaman',
      'Pintasan Ctrl+Enter agar pengiriman lebih cepat'
    ]
  },
  {
    src: './assets/tiles/ai-ninja.webp', label: 'ai ninja challenge',
    demo: './demos/ai-ninja/',
    note: 'A browser pose-classification game that turns live camera predictions into timed ninja challenges.',
    note_id: 'Game klasifikasi pose di browser yang mengubah prediksi kamera langsung menjadi tantangan ninja berbatas waktu.',
    year: 'aug 2026', role: 'solo',
    year_id: 'agu 2026', role_id: 'sendiri',
    challenge: 'A pose model is difficult to understand from confidence numbers alone; it needs an interaction that makes recognition quality visible and engaging.',
    challenge_id: 'Model pose sulit dipahami hanya dari angka confidence; dibutuhkan interaksi yang membuat kualitas pengenalannya terlihat dan menarik.',
    contribution: 'Trained and integrated the pose model, matched its exact labels to the game logic, and built the complete scoring, character and history systems.',
    contribution_id: 'Melatih dan mengintegrasikan model pose, mencocokkan label persisnya dengan logika game, serta membangun sistem skor, karakter, dan riwayat.',
    approach: 'Runs a MobileNetV1-based Teachable Machine pose classifier in the browser, selects the highest-confidence class and validates Attack, Deffend or Dodge during each timed challenge.',
    approach_id: 'Menjalankan pengklasifikasi pose Teachable Machine berbasis MobileNetV1 di browser, memilih kelas dengan confidence tertinggi, lalu memvalidasi Attack, Deffend, atau Dodge pada setiap tantangan.',
    outcome: 'Created a direct camera demo with three character strategies, combo scoring, HP, boss rounds, persistent high scores and ten-match local history.',
    outcome_id: 'Menghasilkan demo kamera langsung dengan tiga strategi karakter, skor combo, HP, ronde boss, high score tersimpan, dan riwayat sepuluh pertandingan.',
    stack: ['JavaScript', 'TensorFlow.js', 'Teachable Machine Pose', 'MobileNetV1'],
    stack_id: ['JavaScript', 'TensorFlow.js', 'Teachable Machine Pose', 'MobileNetV1'],
    blurb: 'AI Ninja turns real-time pose classification into a small game. The camera stays in the browser while model predictions drive challenges, score, combo and character abilities.',
    blurb_id: 'AI Ninja mengubah klasifikasi pose real-time menjadi game kecil. Kamera tetap diproses di browser sementara prediksi model menggerakkan tantangan, skor, combo, dan kemampuan karakter.',
    points: [
      'Live classification for Attack, Deffend and Dodge poses',
      'Confidence-gated challenge validation and countdowns',
      'Swift, Tank and Berserker characters with different trade-offs',
      'Local high score and ten-match history'
    ],
    points_id: [
      'Klasifikasi langsung untuk pose Attack, Deffend, dan Dodge',
      'Validasi tantangan berbasis confidence dan hitung mundur',
      'Karakter Swift, Tank, dan Berserker dengan kelebihan berbeda',
      'High score lokal dan riwayat sepuluh pertandingan'
    ]
  }
];

// Text cards live in the same grid as the project images and are clickable. One per
// section in the navbar, so every section can also be stumbled on by dragging
// rather than only reached from the bar. `route` must match the id of a
// <section class="page" id="pageXxx"> in index.html, lowercased — a route with
// no section routes nowhere. Adding one here also needs a slot in SLOTS,
// this file: a card with no slot is never drawn.
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

// Canvas positions: every work and card needs at least one slot.
export const COLS = 4, ROWS = 5;
export const SLOTS = [
  { c:0, r:0, kind:'work', i:0 },
  { c:2, r:0, kind:'card', i:0 },   // about

  { c:1, r:1, kind:'card', i:1 },   // skills
  { c:3, r:1, kind:'work', i:1 },

  { c:0, r:2, kind:'work', i:2 },
  { c:2, r:2, kind:'card', i:2 },   // works
  { c:3, r:2, kind:'card', i:3 },   // experience

  { c:1, r:3, kind:'work', i:3 },
  { c:3, r:3, kind:'card', i:4 },   // services

  { c:0, r:4, kind:'card', i:5 },   // achievements
  { c:1, r:4, kind:'work', i:5 },
  { c:2, r:4, kind:'work', i:4 },
  { c:3, r:4, kind:'card', i:6 }    // contact
];
