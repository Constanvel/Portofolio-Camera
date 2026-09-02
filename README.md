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

`assets/mark/crest.webp` dan `assets/mark/ring.webp` — satu gambar diam dan satu
cincin yang berputar di bawahnya. Keduanya PNG transparan bergaris putih yang
dipangkas ke kotak pembatasnya sebelum disimpan, jadi posisinya ditentukan oleh
apa yang benar-benar tergambar, bukan oleh margin kosong sisa penghapus latar.
Karena garisnya terang, `.mark` berlatar `#000` dan bukan kertas, dan `<body>`
mulai dengan `is-dark` supaya `--ink-2` terangkat dan tombol skip serta suara
terbaca di atasnya.

Cincinnya dipersegikan di sekeliling kotak pembatasnya sendiri: sebuah spinner
berputar mengelilingi titik tengah **kotaknya**, jadi cincin yang duduk di luar
pusat sebuah persegi panjang akan oleng, bukan berputar.

`.mark` punya dua baris grid. `place-items` memusatkan tiap anak di barisnya
sendiri; `align-content` yang menahan keduanya tetap bersama di tengah, bukan
membiarkan barisnya melar memenuhi layar.

Lamanya tahap ini ditentukan `markDone` di `js/main.js`, dan sekarang menunggu
sesuatu yang nyata: dua model `.glb` sudah mulai diunduh di atasnya, dan
cincinnya berputar sampai keduanya mendarat. Ada lantai, karena loader yang
berkedip 200ms terbaca sebagai kerusakan, dan ada langit-langit, karena model
yang tidak pernah datang tidak boleh menahan pintu. Di jalur lite tidak ada
model yang ditunggu, jadi lantainya adalah seluruh ketukannya.

Versi sebelumnya klip sepuluh detik, dan seluruh perkakas yang dibutuhkannya
ikut hilang bersamanya: heuristik autoplay, poster untuk menutupi penolakan,
probe untuk menyadari klipnya tidak pernah mulai, `pause()` supaya dekodernya
tidak terus jalan di belakang iPod, dan potongan 12% untuk menyembunyikan tanda
tangan generatornya. Sebuah `<img>` menggambar atau tidak. Berat aset intronya
turun dari 1,86 MB ke 131 KB.

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

## Setelan

Satu tombol di pojok kiri bawah membuka panel berisi tiga baris: tema, suara,
dan volume. Bukan `<dialog>` — modal akan menaruh seluruh situs di balik lembar
gelap hanya untuk mengecilkan volume. Panel biasa yang tertutup oleh Escape atau
tekanan di luar; tekanan yang **membuka**-nya adalah `pointerdown` saat panel
masih tertutup, jadi penangan itu tidak melihat apa-apa dan keduanya tidak
berkelahi.

Tema ada di `<html data-theme>`, **bukan** di `body.is-dark`. Kelas itu milik
sequencer intro yang menyalakan dan mematikannya per babak, dan pilihan
pengunjung tidak boleh sesuatu yang bisa dicabut mark di tengah jalan. Yang
berpindah hanya tokennya; seluruh aturan di stylesheet sudah membacanya.

Kanvas karya ikut. Warnanya dulu literal di `js/canvas.js`, jadi bidangnya akan
tetap jadi lubang putih di halaman gelap. Sekarang dibaca dari custom property
lewat `readPalette()`, dan `applyMode()` memanggilnya lagi tiap tema berganti —
kanvas menyimpan warnanya sebagai string, jadi harus disuruh melihat ulang.
Masker tepi lembut satu-satunya yang tetap literal: ia dikomposisikan pada
**alpha**, jadi warnanya tidak pernah terlihat.

`--scrim` ada karena navbar punya gradien kertasnya sendiri di atas foto. Kalau
itu dibiarkan putih, mode gelap akan dapat pita putih di sepanjang tepi atas.

Volume memiliki `level` di `js/main.js`. Dulu konstanta selagi pilihannya cuma
nyala atau mati; slider membuatnya setelan, dan ramp serta jaring pengaman di
`goAudible()` dua-duanya membidik nilai terakhir yang ditinggalkan pengunjung —
itu sebabnya menggeser slider sebelum ada bunyi pun tetap mendarat di tempat
yang benar.

Tema dan volume disimpan di `localStorage`, dan setiap sentuhannya dibungkus
`try/catch`: di sebagian mode privasi `localStorage` melempar, bukan
mengembalikan `null`. Tema mengikuti `prefers-color-scheme` **hanya** selama
pengunjung belum memilih sendiri; setelah memilih, sistem operasi tidak berhak
membatalkannya.

## Navbar di layar sempit

Delapan tautan butuh sekitar 700px. Di bawah itu bar-nya terpotong, dan strip
yang digeser menyamping tidak memberi tanda apa pun bahwa masih ada lanjutan di
balik tepinya — yang terlihat terakhir cuma separuh kata. Jadi di bawah 760px
`<nav>` yang **sama** berubah jadi dropdown: satu daftar, dua bentuk, tidak ada
salinan kedua yang bisa berbeda isi.

Titik potongnya lebar, bukan `pointer:coarse`. Jendela desktop yang disempitkan
punya masalah yang persis sama, dan tablet lanskap tidak punya masalah itu sama
sekali. Diukur: di 762px bar-nya pas penuh dan tidak melimpah, jadi satu piksel
lebih sempit sudah akan terpotong.

Labelnya bagian yang bekerja. Ia menampilkan **bagian tempatmu berada**, bukan
kata tetap — jadi kontrolnya melaporkan posisimu sekaligus menawarkan pindah,
dan tidak butuh ikon, yang memang tidak ada di mana pun di situs ini. `menu`
adalah kata jujur untuk `home`, di mana tidak ada bagian yang sedang aktif.
`applyRoute()` yang menuliskannya, jadi ia tidak bisa lepas dari rute.

Menutup di tiga jalan: Escape, tekan di luar, dan setiap pergantian rute — menu
yang tetap terbuka di atas bagian yang baru saja dibukanya adalah menu yang
menghalangi. Tekanan yang **membuka**-nya adalah `pointerdown` saat daftar masih
tertutup, jadi penangan tutup-di-luar tidak melihat apa-apa dan keduanya tidak
berkelahi — pola yang sama dengan panel setelan dan backdrop dialog.

Garis bawah geser `.nav__a::after` disembunyikan di dropdown: ia milik satu
baris kata, dan di kolom akan duduk di bawah satu item seperti kesalahan cetak.
Baris aktif ditandai tintanya saja.

## Halaman works

`#/works` adalah galeri: tiap proyek sebagai tangkapan layar 16:9, dengan nama
dan `tahun · peran` di bawahnya, dan menekannya membuka panel penjelasan yang
sama dengan tile kanvas dan baris `portfolio`.

Markup-nya sengaja kosong — `<ul id="worksGrid">` diisi `js/main.js` dari
`WORKS`, tabel yang sama yang dibaca kanvas dan panel. Menambah proyek tetap
satu suntingan di satu berkas, dan ketiga tempatnya tidak bisa berbeda isi.

Kartunya **tidak** `loading="lazy"`. Kartu dibangun selagi `works` masih
`hidden`, dan gambar di dalam `display:none` tidak pernah berpotongan dengan
viewport — jadi yang lazy tidak pernah diminta dan galerinya tinggal kosong.
Memuatnya langsung pun gratis: kanvas sudah mengambil kelima berkas yang sama
untuk tile-nya, jadi semuanya cache hit.

`works` menggantikan `portfolio` sepenuhnya, jadi `portfolio` dibuang: dari
navbar, dari isi cadangan `<canvas>`, dari daftar rute `404.html`, dari kartu
kanvas, dan seksinya sendiri. Tombol "see the canvas" yang dulu ada di sana
sudah tidak relevan bersamanya.

Kartu kanvasnya **diganti di tempat**, bukan dihapus lalu ditambah: `SLOTS` di
`js/canvas.js` merujuk `CARDS` lewat **indeks**, jadi menghapus satu entri akan
menggeser semua indeks sesudahnya dan membuat kartu-kartu lain diam-diam
menunjuk bagian yang salah. Mengganti isinya di posisi yang sama menghindari itu
sekaligus memberi `works` kartu kanvas yang sebelumnya belum ia punya.

Alamat lama `#/portfolio` tidak error: `routeFromHash()` mengembalikan rute
kosong untuk id yang tidak ada, jadi bookmark lama mendarat di kanvas.

`.page__in--wide` ada karena `34rem` itu ukuran untuk **dibaca**. Galeri tidak
dibaca, ia dipindai, jadi ia dapat ruang yang dibutuhkan dua kolom.

