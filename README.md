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
- `assets/tiles/` — berkas karya, satu ukuran untuk semua layar; kelimanya gambar diam
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

Lagu diatur dari satu kontrol saja, slider volume di panel `settings`, ada di
setiap tahap. Dulu ada baris `sound on/off` di sebelahnya; itu dihapus karena
dua kontrol untuk satu hal bisa saling bertentangan — mute menyala sementara
slidernya di 70 adalah keadaan yang harus dipikirkan pengunjung sebelum ia tahu
kenapa sunyi. Ujung kiri slider itulah mute-nya, dan menyeretnya juga gerakan
yang boleh menyalakan lagu, jadi ia tetap bisa dibatalkan di kunjungan yang lagunya
belum pernah sempat berputar.

Nilainya satu, `level`, dan semua jalan menuju suara membacanya — tombol skip,
jaring gerakan, akhir sekuens — jadi tidak ada bendera mute kedua yang harus
dijaga tetap sinkron. `level` juga tujuan ramp 1400ms yang jalan di atas frame,
dan tab yang di-throttle tidak dapat satu pun; `setTimeout` di `goAudible()`
yang memastikan levelnya sampai walau tanpa frame sama sekali. Tanpa itu lagu
berputar di volume nol dan slidernya benar tapi tidak terdengar.

Rute mengakhiri intro. Membuka `#/about` langsung, atau memencet navbar saat
urutan intro masih jalan, memanggil `endIntro()` di `js/main.js` — teardown yang
sama dengan tombol skip. Halaman itu buram tapi *fade*, jadi selama 620ms apa
pun yang masih hidup di bawahnya kelihatan tembus.

Rute juga menghentikan kanvas karya (`work.stop()`) dan menyalakannya lagi saat
kembali. Halaman menutupi layar sepenuhnya, jadi delapan video dan seluruh
bidang tidak perlu digambar ulang enam puluh kali sedetik di bawahnya.

## Tayang

Berkas statis, tanpa langkah build. Di Vercel: impor repo-nya, lalu **kosongkan
Build Command, Output Directory dan Install Command**, dan setel Framework
Preset ke **Other**. Dibiarkan menebak, Vercel akan mencari `package.json` yang
tidak ada di sini dan build-nya gagal. Root Directory default sudah benar —
akar git repo ini memang akar situsnya.

`404.html` menangkap alamat yang tidak ada, dan meneruskan `/experience` ke
`#/experience` karena itu bukan alamat salah, cuma alamat yang ditulis dengan
cara lama. Skripnya jalan di sisi klien, jadi tidak bergantung pada host.

`.nojekyll` sudah tidak berguna di Vercel — itu khusus GitHub Pages, supaya ia
tidak membuang berkas berawalan garis bawah. Dibiarkan karena tidak mengganggu
dan berguna kalau suatu saat kembali ke Pages.

**Lima alamat harus ikut pindah kalau domainnya berubah**, dan semuanya mutlak:

    index.html   canonical, og:url, og:image
    sitemap.xml  <loc>
    robots.txt   Sitemap:

Satu perintah mengganti kelimanya:

    grep -rl 'portofolio-camera.vercel.app' index.html sitemap.xml robots.txt       | xargs sed -i 's|https://portofolio-camera.vercel.app/|https://DOMAIN-BARU/|g'

`og:image` yang paling tidak memaafkan: setiap pengambil pratinjau menariknya
**tanpa halaman** untuk melandaskan path relatif, jadi alamat yang salah berarti
kartu bagikan di WhatsApp dan LinkedIn jadi kotak abu-abu. `canonical` yang
menunjuk ke alamat mati juga memberi tahu mesin pencari bahwa halaman aslinya
ada di tempat yang 404.

Path aset tidak perlu disentuh — semuanya relatif, dan justru lebih aman di akar
domain daripada di sub-direktori.

`assets/og.jpg` (1200×630) dibuat ulang dengan skrip di riwayat commit. Skrip itu
memakai SF Pro, yang sudah tidak ada di repo ini — lihat bagian lisensi aset —
jadi membuatnya ulang sekarang perlu huruf pengganti.

Halaman ini juga punya versi tanpa JS. Tiap bagian dimulai `hidden` dan dibuka
oleh router, jadi tanpa skrip yang tampil bukan versi polos melainkan halaman
putih; `<noscript>` di `index.html` membuka semuanya dan membuang urutan intro.
Kanvas karya punya `aria-label` dan isi cadangan di dalam elemennya, karena
halaman `home` itu kanvas, dan kanvas tidak mengatakan apa pun ke pembaca layar.

Ada tepat satu `<h1>` di dokumen ini dan isinya nama. Ia tidak terlihat —
`.vh` di `css/style.css` memotongnya jadi kotak 1px, bukan `display:none`,
karena itu akan menyembunyikannya dari pembaca layar juga dan justru itu yang
tidak diinginkan. Sebelumnya tiap bagian mengaku `<h1>` sendiri, jadi ada tujuh
yang bersaing dan namanya sendiri tidak pernah jadi heading sama sekali, cuma
ada di `<title>`, `<meta>`, dan satu kalimat prosa di `about`. Mesin pencari
yang memeringkat halaman ini atas nama penulisnya tidak punya apa pun di atas
prosa untuk dijadikan pegangan. Ketujuhnya `<h2>` sekarang.

Konsekuensinya ada di `js/main.js`: `applyRoute()` memilih apa yang difokuskan
lewat `querySelector`, dan salah satu pilihannya dulu `h1` — cocok karena tag.
Sekarang `.page__t`. Kalau dibiarkan, selektornya akan mengembalikan `null` di
tiap bagian yang tidak punya tombol kembali atau cta, dan `null.focus?.()`
melempar: optional chaining menjaga metodenya, bukan objek tempat ia menempel.

## Membongkar intro

Intro itu satu-satunya yang pernah memakai WebGL, dan tidak ada jalan kembali
ke sana setelah selesai. Dulu `finish()` cuma memanggil `gl.stop()` — itu
menghentikan loop-nya, dan meninggalkan semua yang sudah diunggah tetap duduk
di driver sepanjang sisa kunjungan sambil tidak menggambar apa pun.

Terukur di jalur skip, sebelum dan sesudah:

| | sebelum | sesudah |
|---|---|---|
| geometri | 33 | **0** |
| program shader | 13 | **0** |
| tekstur | 17 | 3 |
| konteks WebGL | hidup | dilepas |

Tiga hal yang tidak terduga muncul waktu mengerjakannya.

**PMREM tidak bisa dibebaskan lewat teksturnya.** `js/env.js` dulu
mengembalikan `pmrem.fromEquirectangular(tex).texture` dan membuang render
target-nya. Memanggil `dispose()` pada tekstur render target tidak melakukan
apa-apa — memorinya milik target, dan `pmrem.dispose()` juga tidak menutupnya,
itu cuma membebaskan buffer kerja generatornya. Dua kubus mip half-float per
kunjungan, tidak pernah dikembalikan. Sekarang fungsinya mengembalikan
target-nya utuh dan pemanggilnya membaca `.texture`.

**`renderer.dispose()` tidak menutup konteksnya.** Ia membebaskan apa yang
three.js alokasikan; konteks WebGL-nya sendiri hidup terus. `forceContextLoss()`
yang benar-benar mengembalikannya.

**`warm()` mengunggah dua model, dan skip cuma membuang satu.** Ia menggambar
keduanya satu frame sebelum salah satunya jadi act, jadi pengunjung yang skip
saat iPod sudah mengunggah seluruh kamera dan tidak pernah membuat `CameraAct`
untuk membuangnya — 44 ribu vertex plus teksturnya, cuma bisa dicapai lewat
promise tempatnya datang. Itu 25 geometri yang tertinggal. `finish()` sekarang
melepasnya lewat `landed`, pegangan sinkron ke model yang sudah mendarat:
`finish()` bukan fungsi async dan tidak bisa menunggu promise, dan melepasnya
di dalam `.then()` menaruhnya sesudah konteksnya hilang — dan three.js
mengabaikan `dispose()` sesudah itu, karena peta properti yang mau ia kurangi
sudah ikut hilang. Urutannya penting: model dulu, konteks terakhir.

Sisa tiga teksturnya internal three.js, di atas konteks yang sudah dilepas.

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

## Rana

Tiap bagian membuka seperti lensa, dan menutup dengan cara yang sama waktu
ditinggalkan. Ini satu-satunya bagian kosakata intro yang bisa diulang tanpa
biaya: tidak ada model, tidak ada renderer, tidak ada berkas — cuma `clip-path`
dan easing yang sudah ada.

**75% bukan angka selera.** `circle()` menghitung radius persen terhadap
`sqrt(w²+h²)/sqrt(2)`, jadi radius yang tepat mencapai sudut dari tengah adalah
`sqrt(2)/2` = 70,71% — angka yang sama di setiap rasio layar, dan itulah kenapa
ini tidak butuh breakpoint. 75% adalah angka itu plus margin.

**Rana menggantikan fade, bukan menghiasinya.** Percobaan pertama menjalankan
keduanya bersamaan dan apertur-nya hilang sama sekali: pada 140 ms lingkarannya
sudah setengah terbuka tapi dibaca lewat lembar beropasitas 22%, jadi tidak ada
tepi yang terlihat. Rana tidak melarut — ia opak, dan yang bergerak cuma
bukaannya. Karena itu kedua kelasnya memaksa `opacity:1; transition:none`.

**Tema gelap butuh tepinya sendiri.** Di tema terang lingkaran putih di atas
bidang gelap sudah kontras. Di tema gelap `--paper` dan bidang di belakangnya
cuma beda beberapa level, dan apertur-nya praktis tak terlihat. `--iris-glow`
memberi cahaya yang bocor lewat tepi bilahnya, dan itu ditaruh **di dalam
keyframe**, bukan di kelasnya — `.is-lit` menetap selamanya, jadi filter yang
ditaruh di sana akan membebani setiap frame scroll seumur kunjungan. Di dalam
keyframe ia ikut hilang begitu rananya terbuka. Kebetulan yang menguntungkan:
blur-nya paling besar justru saat bentuk terkliping paling kecil, jadi lintasan
mahalnya tidak pernah bertepatan dengan area besar.

**`iris` sengaja tanpa fill mode, dan itu keputusan keamanan.** `backwards`
memang menggambar keadaan tertutup sebelum frame pertama, tapi artinya di mana
pun animasinya tidak maju, bagian itu tetap terkliping jadi nol dan halamannya
diam-diam kosong permanen. Tanpa itu, kasus terburuknya cuma satu frame konten
tanpa klip. Tidak ada delay yang perlu ditutup: animasi menerapkan keyframe
pertamanya di paint yang sama saat ia mulai. `irisOut` justru **butuh**
`forwards` — `applyRoute()` menunggu 260 ms sebelum menyetel `hidden`, dan tanpa
menahan frame terakhir rananya membuka lagi tepat sebelum elemennya hilang.

Di ponsel rana ini dipasang di `lite()`, bukan di `showWork()`. Jalur desktop
memanggil `showWork()` juga, dan di sana bidangnya sudah disingkap oleh monitor
kamera yang menutup ke tepi viewport — apertur di atasnya berarti dua penyingkap
berebut. Jalur LITE tidak punya apa-apa di sana, dan itu justru alasannya.

## Kilatan

Klik nav memicu kilatan putih sepersekian detik sebelum bagiannya membuka. Nol
aset, nol dependensi.

**Kilatannya tidak simetris.** Naik 8%, turun 92%. Kilatan sungguhan itu
lonjakan — terang hampir seketika, lalu peluruhan yang panjang dibanding
naiknya. Kurva simetris terbaca sebagai kartu putih yang di-fade, dan itu
dissolve, bukan eksposur. Ia juga putih di kedua tema dengan sengaja: ini
tabung xenon, bukan permukaan, jadi tidak ikut palet halaman.

Kurvanya terukur: penuh sampai 60 ms, 0,30 di 100 ms, 0,12 di 150 ms, praktis
habis di 200 ms.

`prefers-reduced-motion` mematikannya sepenuhnya — kilatan itu strobo, satu-
satunya hal di sini yang benar-benar bisa menyakiti orang.

### Iris 3D yang dicabut lagi

Sempat ada objek 3D di sini: apertur ter-rig milik forneha, CC BY, delapan
bilah yang membuka saat kilatannya surut. Secara mekanis ia bekerja — bilahnya
diambil lewat nama karena eksportir Sketchfab menulis pivotnya dalam urutan
yang salah, dan ayunannya 1,20 rad diukur dari luas jendela yang terbuka.

Ia tetap dibuang. Di tema terang rumahnya adalah cincin nyaris hitam yang
menutupi tengah bagian selama 1,2 detik — sebuah lubang yang dilubangkan
menembus teks yang baru saja diklik orang untuk dibaca. Mengecilkannya dari
49% ke 26% tinggi viewport membantu, tapi tidak mengubah bahwa benda paling
menonjol di sebuah bagian jadi bukan isinya.

Yang tersisa dari percobaan itu satu perbaikan yang layak disimpan, dan ia ada
di `GL.start()` — lihat di bawah.

## Kartu works

Galeri masuk dengan cara yang sama dengan daftar-daftar lain, dan alasannya
sama dengan yang membuat `.rows` harus ditulis dua kali: `<ul>`-nya satu slot
anak tapi isinya lima kartu, jadi pada hitungan biasa kelimanya mendarat
serentak sebagai satu blok — sementara isi tiap bagian lain datang satu per
satu. `works` satu-satunya bagian yang isinya tidak bergerak, dan justru itu
bagian yang memuat karyanya.

Selektornya `.grid > li`, bukan kelas: `<li>`-nya dibangun di `js/main.js` dan
tidak membawa kelas apa pun, dan daftarnya `list-style:none` yang tidak pernah
berisi hal lain.

Dua aturan tambahan yang bukan hiasan, keduanya menyalin pelajaran dari
`.rows`. Pertama, tutup ekornya: kartu keenam yang ditambahkan ke `data.js`
akan jatuh balik ke 0 ms dan mendarat **paling dulu**, mendahului kartu satu —
diuji dengan menyisipkan dua kartu palsu, keduanya mendarat di 480 ms. Kedua,
tombol `back` harus melewati kelimanya: pada hitungan biasa ia anak ketiga dan
mendarat di 180 ms, bersama kartu pertama dan di atas empat yang belum datang.

## Warna teks paling sunyi

`--ink-3` dulu `#a9a7b0`, yang mengukur **2,38** terhadap kertas — separuh dari
4,5 yang diminta WCAG AA untuk teks normal. Dan yang memakainya bukan hiasan:
tahun dan peran di bawah tiap kartu karya pada 11 px, dan blok kredit di
`about` pada 13 px — yang justru **atribusi yang disyaratkan CC BY**. Atribusi
yang tidak terbaca cara yang lemah untuk memenuhi syarat lisensi.

Sekarang `#77757c` (4,55) di terang dan `#7b7988` (4,53) di gelap. Hue-nya
dipertahankan, dan hierarki tiga tingkatnya utuh:

| | ink | ink-2 | ink-3 |
|---|---|---|---|
| terang | 18,95 | 6,68 | **4,55** |
| gelap | 16,99 | 7,31 | **4,53** |

## Kapan musiknya diunduh

`preload="none"` di markup, tapi atribut itu cuma separuhnya: `main.js` dulu
memanggil `rollMuted()` di baris pertamanya, dan `play()` mengunduh berkasnya
**apa pun isi atribut itu**. Jadi 563 KB berlomba dengan three.js, dua model,
dan huruf di satu-satunya koneksi yang penting — untuk sesuatu yang **tidak
bisa terdengar** sampai ada gerakan. Di jalur LITE ia 52% dari seluruh yang
diambil ponsel.

**`load` sendirian bukan sinyalnya**, dan pengukuran yang mengatakan itu: ia
menyala di 33 ms sementara `camera.glb` baru selesai di 274 ms. Model diambil
oleh skrip, dan event `load` cuma menunggu apa yang ditemukan parser. Jadi
jalur penuh menunggu **modelnya sendiri**, dan hanya jalur LITE — yang tidak
punya model — yang jatuh ke `load`.

Terbukti dari log server, yang mencatat urutan permintaan dari luar peramban:

    GET /js/vendor/three.module.js
    GET /assets/models/ipod.glb
    GET /assets/models/camera.glb
    GET /assets/audio/theme.mp3     <- terakhir

Ada jalur ketiga yang tidak melewati keduanya: membuka `#/about` langsung
membuat `main()` keluar lebih awal, jadi tidak ada pra-buffer sama sekali. Itu
disengaja dan diuji — pengunjung yang datang untuk membaca satu bagian tidak
perlu membayar musiknya di muka, dan gerakan pertamanya tetap menyalakan lewat
`goAudible()`: terukur, dari `buffered 0, paused` ke `buffered 48, volume 0.66`
dalam satu klik.

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

Satu tombol di pojok kiri bawah membuka panel berisi tiga baris: tema, bahasa,
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

Tema, bahasa dan volume disimpan di `localStorage`, dan setiap sentuhannya dibungkus
`try/catch`: di sebagian mode privasi `localStorage` melempar, bukan
mengembalikan `null`. Tema mengikuti `prefers-color-scheme` **hanya** selama
pengunjung belum memilih sendiri; setelah memilih, sistem operasi tidak berhak
membatalkannya.

## Dua bahasa

Bahasa Inggrisnya **tidak** ada di kamus. Ia tetap di tempat ia dibaca — di
`index.html` dan `js/data.js` — karena salinan itulah yang diindeks perayap,
yang didapat pengunjung `<noscript>`, dan yang tergambar di frame sebelum modul
mana pun sempat jalan. Menuliskannya sekali lagi di tabel berarti setiap suntingan
berikutnya harus mendarat di dua tempat, dan hari ia mendarat di satu tempat saja
adalah hari situs ini mulai mengatakan hal berbeda dalam bahasa berbeda.

`js/i18n.js` karena itu hanya memuat bahasa Indonesianya. Bahasa Inggrisnya
diambil dari DOM saat pertama kali sebuah kunci diminta, dan disimpan di `snap`
— dikunci oleh `data-t`, bukan oleh elemennya, yang juga alasan sembilan tombol
`back` jadi satu entri dan bukan sembilan.

Tiga jalan masuk, karena stringnya datang lewat tiga jalan:

| | untuk |
|---|---|
| `applyLang(l)` | semua yang **ada** di markup, dicocokkan lewat `data-t` |
| `t(obj, 'note')` | satu field di `WORKS` atau `CARDS` — membaca `note_id` |
| `s('nav.about')` | string yang tidak pernah ada di markup, dibangun `js/main.js` |

Terjemahan proyek duduk di `js/data.js` sebagai `note_id`, `blurb_id`,
`points_id` — bukan di kamus. File itulah yang terbuka saat sebuah proyek
ditambahkan, dan terjemahan yang tinggal dua file jauhnya adalah terjemahan yang
tidak ditulis siapa pun. Terjemahan yang hilang jatuh ke bahasa Inggris, bukan ke
kunci atau ke kosong: setengah-diterjemahkan adalah keadaan yang benar-benar akan
dialami situs ini, setiap kali satu baris ditambah tanpa membuka `i18n.js`.

`year` ikut diterjemahkan, tapi hanya karena singkatan bulannya berbeda — `aug`
jadi `agu`, `may` jadi `mei`. `label` sebuah proyek adalah namanya sendiri dan
tidak ikut. Begitu juga nama kanal di `contact` dan judul yang tercetak di
sertifikat: yang berpindah cuma kata-kata di sekelilingnya.

Yang berpindah bukan hanya apa yang **terbaca**, tapi juga apa yang
**dibacakan**. Beberapa kontrol di sini hanya bernama lewat `aria-label` —
bidang yang digeser, navbar, grup setelan — dan meninggalkannya berarti
menerjemahkan situs untuk semua orang kecuali yang membacanya lewat pembaca
layar. `data-ta` menangani itu, lewat tabel `SLOTS` yang sama.

Kanvas tidak perlu diberi tahu apa-apa. Bidangnya digambar ulang dari nol tiap
frame, jadi membaca label kartu lewat `t()` sudah seluruh biayanya. Lebar kotak
sentuhnya diukur dari kata yang benar-benar dilukis — `achievements` dan
`pencapaian` tidak selebar itu sama.

Mengganti bahasa **tidak** memanggil `applyRoute()`. Fungsi itu memicu kilatan
dan memindahkan fokus, dan itu bukan yang pantas dilakukan sebuah setelan pada
halaman di belakangnya; label tombol menu satu-satunya bagian rute yang benar-benar
soal bahasa, dan `labelNav()` yang mengurusnya. Panel proyek yang sedang terbuka
ditulis ulang di tempat, bukan ditutup.

Pilihan yang tersimpan menang. Kalau belum ada, `navigator.languages` yang
ditanya — dan pengujiannya berjangkar, `/^id\b/i`, bukan “mengandung id”. Mesin
tempat ini diuji melaporkan `["en-US", "en-ID"]`: orang berbahasa Inggris di
Indonesia. Uji substring akan membalik mereka ke bahasa Indonesia, begitu juga
untuk `nl-ID` dan `ide`. Selain itu, dan pada peramban yang tidak menjawab apa
pun, jawabannya bahasa Inggris — itu yang sudah tertulis di dokumennya.

Satu hal yang tidak ikut: `404.html` tetap bahasa Inggris. Halaman itu `noindex`,
tidak punya panel setelan, dan hanya melempar orang kembali ke indeks.

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

`#/works` adalah galeri: tiap proyek sebagai tangkapan layar 16:9, lalu nama,
satu kalimat, dan `tahun · peran` — urutan itu disengaja, karena baris meta yang
paling insidental dari ketiganya dan tidak layak duduk di antara nama dan
kalimat yang menjelaskannya. Menekan kartunya membuka panel penjelasan yang sama
dengan tile kanvas.

`href` adalah rumah proyeknya sendiri, dan panel yang menampilkannya — bukan
kartunya, karena kartu itu sendiri sebuah `<button>` dan menaruh tautan di
dalam tombol adalah HTML yang tidak sah. Labelnya diturunkan dari URL-nya, jadi
mengarahkan sebuah proyek ke demo langsung nanti tidak meninggalkan tulisan yang
mengumumkan repo yang tidak ada. `new URL()` melempar untuk apa pun yang tidak
bisa ia urai, dan itu berjalan tepat saat pengunjung membuka sebuah proyek, jadi
ia dibungkus.

Kalimatnya `note` di `WORKS`, bidang tersendiri dan bukan diturunkan dari
`blurb`. Mengambil kalimat pertama `blurb` akan benar untuk empat proyek dan
menelan seluruh paragraf untuk `smk telkom purwokerto`, yang titik pertamanya
baru ada di ujung — persis jenis kepintaran yang gagal tanpa bersuara. `note`
disetel huruf normal tanpa tracking: ia satu-satunya hal di kartu yang
dimaksudkan untuk **dibaca**, bukan dipindai, dan menyetelnya seperti label di
sekelilingnya akan menguburnya di antara mereka.

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


## Lisensi aset

Kode, tulisan, dan tangkapan layar proyek di repo ini milik Constantine Rainer
Simanjuntak. Yang berikut **bukan**, dan didaftar di sini serta di bagian
`about` situs karena lisensinya memang mensyaratkan itu.

| berkas | pembuat | lisensi |
|---|---|---|
| `assets/models/camera.glb` | [Dokono Kinokoda](https://sketchfab.com/JunkWren) — [Digital Camera](https://sketchfab.com/3d-models/digital-camera-5b2573eab7bf48f2bb8cd5a6026795b1) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `assets/models/ipod.glb` | [Timothy Ahene](https://sketchfab.com/timothyahene) — [iPod Classic](https://sketchfab.com/3d-models/ipod-classic-13dbe30b0e45408c8bfaddfe6a4e8786) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `assets/fonts/VCR.woff2` | Riciery Leal — VCR OSD Mono | bebas, termasuk untuk komersial dan redistribusi |
| `assets/audio/theme.mp3` | [Nihilore](https://www.nihilore.com/) — [Something Meaningful](https://www.nihilore.com/postrock), putaran 48 detik | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Keduanya sudah dimodifikasi: tekstur dan geometrinya dikemas ulang, dan
materialnya ditukar saat runtime di `js/scene.js`. CC BY mengizinkan itu
selama perubahannya disebut, dan baris di atas menyebutnya.

### Mengecilkan `camera.glb`

Dugaan pertama saya salah. Tekstur biasanya yang paling berat di berkas glTF,
tapi di sini kedelapan gambarnya sudah WebP dan cuma 0,33 MB — **11%** dari
berkas. Yang berat justru vertex-nya, 2,61 MB untuk 44.117 titik:

| | sebelum | sesudah | cara |
|---|---|---|---|
| indeks | 684 KB | 342 KB | u32 → u16 |
| normal | 529 KB | 353 KB | f32 → i16 ternormalisasi |
| tangen | 533 KB | 267 KB | f32 → i16 ternormalisasi |
| posisi | 529 KB | 529 KB | tidak disentuh |
| uv | 335 KB | 335 KB | tidak disentuh |

Indeksnya u32 padahal primitif terbesar cuma 21.960 titik — Sketchfab menulis
u32 tanpa melihat isinya, dan setengah dari 684 KB itu nol semua. Normal dan
tangen aman diringkas karena keduanya vektor satuan: tidak butuh skala maupun
offset, jadi tidak ada transform node yang harus ikut bergeser. **Posisi
sengaja tidak diringkas** — itu perlu skalanya dilipat ke transform node, dan
`CameraAct` mengukur koordinat dari hierarki itu.

Hasilnya 2,97 MB → 2,19 MB mentah, 1,41 MB → 1,15 MB ter-gzip. Diverifikasi
dengan memuat kedua berkas lewat GLTFLoader yang sama lalu membandingkan:
44.117 posisi **sama persis bit demi bit**, uv sama persis, buffer indeks
sama, tanda handedness tangen tidak ada yang terbalik, galat komponen normal
1,53e-5 — tepat setengah langkah 16-bit, seminimal yang mungkin. Render kedua
model ke framebuffer yang sama: **nol piksel berbeda** dari 167.096 piksel
yang tersinari.

`ipod.glb` dilewatkan pass yang sama: 249 KB → 220 KB.

### Yang tidak jadi saya lakukan

Membuang TANGENT sama sekali menghemat jauh lebih banyak — 1,83 MB mentah,
0,98 MB gzip — karena three.js bisa menyusun tangent frame dari turunan
layar kalau atributnya tidak ada. Tapi diukur, itu **bukan** gratis: 23% dari
piksel tersinari berubah lebih dari 2/255, rata-rata 5,88, dan perubahannya
menumpuk persis di tempat normal map bekerja — tekstur grip bergerigi dan
huruf timbul di ring lensa. Itu detail yang sengaja dibuat perancangnya, di
objek utama intro.

`geometry.computeTangents()` bawaan three.js juga dicoba untuk mengembalikannya
di sisi klien. Hasilnya lebih buruk daripada tidak punya tangen sama sekali
(34,55% piksel, rata-rata 12,69) dan memakan 20 ms saat muat, jadi dibuang.

Tidak ada lagi yang terbuka: keempatnya kini punya izin.

Sebelumnya di sini ada "No One Talks About It Anymore" milik Parannoul. Halaman
Bandcamp-nya menulis **all rights reserved** dengan harga *name your price* —
jadi mengunduhnya gratis memang sah, tapi *name your price* bukan lisensi untuk
menaruhnya di situs. Itu dua hal berbeda, dan yang kedua tidak pernah diberikan.

Nihilore menyatakan seluruh musiknya CC BY 4.0 di [halaman lisensinya
sendiri](https://www.nihilore.com/license). Berkasnya diambil dari situsnya,
bukan dari Free Music Archive: di sana beberapa lagunya bertanda CC BY-**NC**,
padahal di profil FMA yang sama ia menulis semuanya CC BY *"even the ones i
messed up and can't change"*. Pernyataan di situsnya sendiri yang dipakai.

Encode-nya 320 kbps jadi 96 kbps. Bukan 64 kbps seperti berkas lama: diukur
terhadap sumbernya, 64 kbps memangkas 6 dB di 14 kHz dan 16 dB di 18 kHz —
untuk shoegaze, yang justru hidup di frekuensi tinggi, itu pertukaran yang
salah. 96 kbps menempel ke sumber sampai 16 kHz.

Dinamikanya tidak disentuh: `loudnorm` sempat dicoba dan memakan 3,5 LU dari
rentangnya, jadi yang dipakai hanya gain rata −2 dB.

### Kenapa 48 detik, bukan lagu utuh

Berkasnya bukan lagu penuh, melainkan **48,000 detik pertama yang dibuat
berputar mulus** — 11,5 MB jadi 577 KB. Ini yang paling mahal di situs: dengan
`preload="auto"` ia terunduh sebelum ada gerakan apa pun, dan di jalur LITE
seluruh halaman ponsel cuma 516 KB, jadi lagu 3,6 MB adalah 88% dari muatan.

48 detik bukan tebakan. Selubung energinya diukur per 10 ms, lalu dicari
panjang putaran yang bagian awalnya paling mirip dengan bagian setelahnya
(korelasi silang ternormalisasi, jendela 4 detik):

| panjang | birama | korelasi |
|---|---|---|
| 24,0 s | 8 | 0,980 |
| **48,0 s** | **16** | **0,969** |
| 72,0 s | 24 | 0,843 |
| 96,0 s | 32 | 0,725 |

Puncaknya tepat di kelipatan 24 detik, jadi lagunya memang memutar figur
8-birama pada 80 BPM. 24 detik menang tipis tapi terlalu pendek untuk didengar
berulang; 48 detik hampir sama mulusnya dengan dua kali materi. Sapuan dua
dimensi atas titik-mulai dan panjang menaruh L = 48,00 s di **setiap** kandidat
teratas, apa pun titik mulainya. Chroma-nya juga dicek — bagian ini vamp yang
harmoninya diam (cos-sim 0,96), jadi sambungannya tidak pindah akor.

Sambungannya di-crossfade 2 detik, dan kurvanya **linear, bukan equal-power**.
Equal-power itu yang benar untuk dua sinyal tak berkorelasi; di sini keduanya
justru figur yang sama, jadi ia menjumlah berlebih — terukur +3,05 dB benjolan
di titik sambung. Linear menekannya ke +0,13 dB. Lompatan antar-sampel di titik
putar 1,1% dari lompatan terburuk di dalam berkas, jadi tidak ada klik, dan
panjang ter-decode-nya persis 2.116.800 sampel tanpa sisa, jadi `loop` di
`<audio>` tidak menyisipkan celah.

Yang membuat sambungan ini bersih justru cacat kecil di sumbernya: ada 0,7
detik hening di depan lagu. Ekor yang masuk mengisi hening itu, jadi tidak ada
dua lapis musik yang saling menumpuk. Mulai dari 0,75 detik — sesudah hening —
justru memberi benjolan +6,5 dB.

`level` di `js/main.js` **tidak berubah** dan tetap 0,66. Putaran ini −17,7
LUFS, dan 48 detik pertama berkas lama juga −17,7 LUFS — itu perbandingan yang
benar, karena itulah yang sebenarnya didengar pengunjung. Angka −15,0 LUFS
milik lagu utuh terangkat oleh klimaks di menit ketiga, yang hampir tidak ada
yang bertahan selama itu.

iPod milik Harrison Sikora sebelumnya ada di sini dengan lisensi Sketchfab
Standard, yang melarang redistribusi berkas modelnya — dan menaruh `.glb` di
server publik berarti siapa pun bisa mengunduhnya langsung, jadi mencantumkan
kredit saja tidak akan menutupnya. Sudah diganti dengan model CC BY di atas.

Penggantian itu bukan sekadar tukar berkas. `IpodAct` di `js/scene.js`
memegang koordinat yang diukur dari model tertentu — bidang kaca depan, batas
layar, dan titik glyph play — dan ketiganya diukur ulang untuk model baru:
mukanya satu quad datar di `x 0.01386` dengan seluruh gambar ada di tekstur,
layarnya adalah LCD terbenam di belakang kaca (mesh 51 verteks), dan letak
glyph play didapat dengan memindai peta base-colour sepanjang roda lalu
mengambil sentroid tanda yang lebih terang dari cincinnya.

Teksturnya juga dikecilkan: lima PNG 2048px jadi WebP 1024px, dan dua peta yang
memang tidak pernah dibaca — emissive dan transmission, keduanya dibuang saat
`js/scene.js` menyusun ulang materialnya — diganti gambar 4x4. 5,49 MB jadi 249 KB,
lebih kecil daripada model yang digantikannya, tanpa beda yang terlihat.

SF Pro Display pernah ada di sini dan sudah dibuang. Apple melisensikannya untuk
platform Apple, bukan untuk disajikan dari server web. Sekarang `css/style.css`
meminta muka huruf UI milik sistem — SF di perangkat Apple, disuplai dengan cara
yang memang diizinkan Apple; Segoe UI di Windows; Roboto di Android.
