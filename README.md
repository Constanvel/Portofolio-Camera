# Portofolio-Camera

Portofolio pribadi Constantine Rainer Simanjuntak — PPLG, SMK Telkom Purwokerto.

Situs statis, tanpa build step. Buka `index.html` lewat server statis apa pun:

```
python -m http.server 8000
```

- `index.html` — struktur halaman
- `css/style.css` — seluruh gaya
- `js/data.js` — daftar karya dan kartu; ini yang diedit saat menambah karya
- `js/main.js` — orkestrasi intro (mark → iPod → kamera → kanvas karya)
- `js/scene.js`, `js/env.js` — WebGL, three.js
- `js/canvas.js` — kanvas karya yang bisa di-drag
- `assets/tiles/` — berkas karya; film `.mp4` butuh kembaran 640px di `assets/tiles-sm/` untuk HP, gambar diam tidak
- `assets/certs/` — berkas sertifikat yang ditautkan dari baris `achievements` dan `experience`

## Bagian halaman

`home` (kanvas karya) → `about` → `skills` → `portfolio` → `experience` →
`services` → `achievements` → `contact`. Navbar di atas menautkan semuanya;
`testimonials` masih dikomentari di `index.html`, tinggal dibuka kalau sudah
ada kutipan asli.

Tiap bagian adalah satu `<section class="page" id="pageXxx">`. `js/main.js`
menyusun tabel rute dari id itu, jadi menambah bagian = satu `<section>` baru
plus satu `<a class="nav__a" href="#/xxx">` di navbar.

Tiap bagian juga punya kartu teks di kanvas karya, supaya bisa ditemukan
sambil menggeser, bukan cuma lewat navbar. Kartu itu butuh dua hal: satu entri
di `CARDS` (`js/data.js`) dan satu slot di `SLOTS` (`js/canvas.js`). `SLOTS`
adalah blok 4×5 yang berulang menutupi seluruh bidang — kartu tanpa slot tidak
akan pernah muncul, sejauh apa pun digeser.

Karya di `WORKS` bekerja lewat pasangan yang sama, dan sekarang isinya lima
gambar diam, bukan delapan film. `src` menentukan pemuatnya lewat ekstensi:
`.mp4` jadi `<video>`, `.png/.jpg/.webp/.gif/.avif` jadi `<img>` — jadi berkas
PNG yang ditaruh dengan nama `.jpg` tidak termuat sebagai keduanya. `label`
menahan slotnya selama berkasnya belum ada: `paintWork` menggambar namanya di
petak kosong itu, dan berhenti menggambarnya begitu gambarnya datang. Menambah
karya berarti menambah slot `work` di `SLOTS` juga — `LIVE` memangkas slot yang
menunjuk ke luar `WORKS`, jadi yang kelebihan hilang diam-diam, bukan error.

Baris yang punya sertifikat dibungkus `<a class="rows__a">` ke berkasnya di
`assets/certs/`; garis rambut di bawah teks itulah penandanya, jadi baris tanpa
berkas sengaja dibiarkan polos. `contact` memakai daftar baris yang sama untuk
kanalnya — alamatnya sendiri yang ditulis, bukan deretan logo. Baris untuk
handel yang belum ada nomor/username aslinya dibiarkan sebagai komentar di
`index.html`, bukan diisi contoh. Tiap kanal punya mark mereknya, di-inline
sebagai `<svg class="rows__i">` di dalam `.rows__k` — jalur path-nya dari
Simple Icons (CC0). Ditempel di berkas, bukan ditarik dari CDN, jadi situsnya
tetap utuh tanpa jaringan; dan digambar dengan `currentColor`, karena lima
merek berwarna penuh akan jadi hal paling berisik di halaman yang selebihnya
tinta di atas kertas. Mau warna aslinya: beri `fill` sendiri per baris.

Sertifikat dibuka di tempat, bukan di tab baru: `<dialog id="cert">` — tab baru
tidak punya riwayat, jadi tidak pernah ada tombol kembali di sana. Tautannya
tetap menunjuk ke berkas dan tetap `target="_blank"`, jadi tanpa JS itulah
fiturnya, dan itu pula jalan keluarnya kalau peramban ponsel menolak menggambar
PDF di dalam bingkai.

Lagu bisa dimatikan lewat tombol `#mute` di pojok kiri bawah, ada di setiap
tahap. Penjaganya satu, `userMuted` di `goAudible()` — semua jalan menuju suara
lewat sana, jadi pengunjung yang minta sunyi tidak dibujuk balik oleh tombol
skip atau gerakan pertama mana pun.

Labelnya dibaca dari elemen `<audio>`, bukan ditulis oleh penanganan kliknya:
sampai ada gerakan, peramban menahan lagu apa pun yang diminta, jadi label yang
menyatakan niat akan berbohong di muat pertama. Dan volume dihitung sebagai
bagian dari "bunyi" — ramp 1400ms itu jalan di atas frame, dan tab yang
di-throttle tidak dapat satu pun. `setTimeout` di `goAudible()` yang memastikan
levelnya sampai walau tidak ada frame sama sekali; tanpa itu lagu berputar di
volume nol dan tombolnya benar tapi tidak terdengar.

Rute mengakhiri intro. Membuka `#/about` langsung, atau memencet navbar saat
urutan intro masih jalan, memanggil `endIntro()` di `js/main.js` — teardown yang
sama dengan tombol skip. Halaman itu buram tapi *fade*, jadi selama 620ms apa
pun yang masih hidup di bawahnya kelihatan tembus.

Rute juga menghentikan kanvas karya (`work.stop()`) dan menyalakannya lagi saat
kembali. Halaman menutupi layar sepenuhnya, jadi delapan video dan seluruh
bidang tidak perlu digambar ulang enam puluh kali sedetik di bawahnya.

## Tayang

Berkas statis, tanpa langkah build — arahkan GitHub Pages ke branch `main`,
folder root. `.nojekyll` ada supaya Pages tidak membuang apa pun yang berawalan
garis bawah; `404.html` menangkap alamat yang tidak ada, dan meneruskan
`/experience` ke `#/experience` karena itu bukan alamat salah, cuma alamat yang
ditulis dengan cara lama. Alamat kanonik dan semua tag `og:` menunjuk ke
`https://constanvel.github.io/Portofolio-Camera/` — ubah keduanya kalau
domainnya pindah, termasuk `og:image`, yang **harus** absolut: setiap pengambil
pratinjau menariknya tanpa halaman untuk melandaskan path relatif.

`assets/og.jpg` (1200×630) dibuat ulang dengan skrip di riwayat commit, memakai
`assets/fonts/SFProDisplay-*.woff2` — kartu bagikan pakai huruf yang sama dengan
halamannya.

Halaman ini juga punya versi tanpa JS. Tiap bagian dimulai `hidden` dan dibuka
oleh router, jadi tanpa skrip yang tampil bukan versi polos melainkan halaman
putih; `<noscript>` di `index.html` membuka semuanya dan membuang urutan intro.
Kanvas karya punya `aria-label` dan isi cadangan di dalam elemennya, karena
halaman `home` itu kanvas, dan kanvas tidak mengatakan apa pun ke pembaca layar.

## Mark pembuka

`assets/video/mark.mp4` itu klip 1280x720 sepuluh detik, terang di atas hitam,
jadi `.mark` berlatar `#000` dan bukan kertas, dan `<body>` mulai dengan
`is-dark` supaya `--ink-2` terangkat dan tombol skip serta suara terbaca di
atasnya. Tidak ada `mix-blend-mode`: multiply itu untuk klip tinta hitam di
atas kertas putih, dan pada klip ini akan menenggelamkan semuanya jadi hitam.

Pembuatnya menandatangani karyanya di kanan bawah, kotak 48x48 di `x 1136-1183,
y 576-623`. Memotong bagian bawah akan ikut memotong crest-nya (crest sampai
`y 626`, tandanya mulai `y 576`), tapi sisi kiri-kanan kosong: crest berhenti di
`x 1076`. Jadi `clip-path:inset(0 12%)` — kanan untuk membuang tandanya, kiri
hanya supaya crest tetap di tengah. Latar klipnya `#000` di semua tepi, jadi
potongan itu tidak meninggalkan jahitan.

Batas 5600ms di `markDone` menahan tahap ini, dan crest-nya mencapai puncak di
4,9 detik — jadi penonton melihat gambarnya selesai, lalu diserahkan. Sisa klip
setelah itu cuma menahan di separuh terang. `markVideo.pause()` dipanggil saat
serah terima, bukan cuma di `endIntro()`: klip yang lebih panjang dari tahapnya
akan terus mendekode di belakang iPod kalau tidak.

Posternya frame TERAKHIR, dipotong 12% yang sama. Klip ini menggambar dirinya
selama sepuluh detik, jadi frame nol hampir kosong — perangkat yang menolak
memutar video harus melihat crest yang sudah jadi.

## Panel proyek

Menekan sebuah karya membuka penjelasannya, dari dua arah: tile di kanvas
`home`, atau baris di halaman `portfolio`. Keduanya membaca `WORKS` di
`js/data.js`, jadi tile dan penjelasannya tidak bisa berbeda isi.

`blurb` dan `points` wajib; `href` opsional dan hanya digambar kalau ada —
proyek yang belum punya repo tidak mendapat tautan mati.

`year` dan `role` dibaca dari riwayat git tiap proyek, bukan diingat: rentangnya
commit pertama sampai terakhir, dan `role` dari berapa nama yang muncul di
`git shortlog`. artvault satu-satunya pengecualian — tidak ada repo di sana,
jadi tanggalnya dari berkas dan tidak ada yang membuktikan siapa lagi yang
menyentuhnya. Kalau salah satu proyek dipindah atau reponya berubah, angkanya
tidak ikut berubah sendiri; periksa ulang dengan cara yang sama.

Tile bisa diklik karena kanvas sudah menyimpan `_tileRects` tiap frame; yang
ditambahkan cuma indeksnya, satu `_tileAt()`, dan cabang pada gerbang
tap-vs-drag yang sudah dipakai kartu. Kartu menang saat berimpit: kartu punya
slotnya sendiri, tapi padding ujung jari bisa menjangkau tile tetangga.

Dialognya ber-id `workPanel`, **bukan** `work` — `<main class="work" id="work">`
adalah kanvas karya, dan `getElementById` akan mengembalikan itu.

Barisnya `<button>` yang membungkus `<span class="rows__a">`, bukan `<a>`: tidak
ada url di bawah sebuah proyek, hanya panel ini. Span-nya harus ada karena
`<button>` tidak bisa `display:inline` — peramban memblokkannya, dan garis
rambutnya jadi jatuh di bawah kotak selebar penuh alih-alih mengikuti teks.

`closeOnBackdrop()` menanyakan di mana tekanan **dimulai**, bukan di mana ia
berakhir. Kanvas membuka panel pada `pointerup`, lalu `click` penutup dari
gerakan yang sama mendarat di backdrop panel yang baru terbuka dan menutupnya
sebelum sempat terlihat.

