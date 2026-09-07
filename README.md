# Portofolio-Camera

Portofolio Constantine Rainer Simanjuntak. Situs statis dengan intro 3D, kanvas karya, galeri proyek, sertifikat, serta pilihan bahasa, tema, dan volume.

## Menjalankan

Tidak ada build step atau dependensi produksi yang perlu dipasang. Jalankan server statis dari folder ini, misalnya:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Buka `http://127.0.0.1:8000/`. Modul JavaScript membutuhkan HTTP, bukan membuka berkas melalui `file://`.

## Struktur

| Berkas | Tanggung jawab |
|---|---|
| `index.html`, `css/style.css` | Halaman, navigasi, dialog, dan gaya responsif |
| `js/data.js` | Lima proyek, tujuh kartu bagian, dan posisi slot kanvas |
| `js/main.js` | Navigasi, siklus intro, pengaturan, galeri, dan dialog |
| `js/scene.js`, `js/env.js` | Model 3D, pencahayaan, animasi, dan pelepasan WebGL |
| `js/canvas.js`, `js/track.js` | Kanvas karya dan penanda autofocus |
| `js/i18n.js` | Kamus dan penerapan bahasa Indonesia/Inggris |
| `js/vendor/` | Three.js r160, GLTFLoader, utilitas geometri, dan MeshoptDecoder lokal |
| `tools/check.mjs` | Pemeriksaan statis tanpa dependensi tambahan |
| `tools/browser-check.mjs` | Tes regresi melalui browser menggunakan Playwright |

## Perilaku utama

- Desktop: mark → iPod → tekan play → kamera → kanvas karya. Tombol skip tersedia sejak awal. Kegagalan impor modul atau inisialisasi WebGL membuka kanvas karya sebagai cadangan.
- Perangkat dengan pointer kasar melewati intro 3D. `?full` mengaktifkannya untuk pengujian.
- Anchor `#pageAbout` dan tautan lama `#/about` sama-sama didukung. Navigasi terbaru membatalkan transisi sebelumnya; halaman yang terbuka menerima fokus pada judulnya.
- Membuka bagian menghentikan kanvas. Meninggalkan intro membebaskan renderer dan model; hasil unduhan yang terlambat ikut dilepas.
- Tombol panah menggerakkan kanvas hanya ketika kanvas mendapat fokus. Slider volume tetap dapat diubah dengan keyboard.
- Preferensi reduced motion menghentikan gerakan ornamen kanvas, meniadakan pembesaran kursor dan momentum, serta mempersingkat transisi halaman dan intro.
- Sertifikat dibuka dalam dialog. Tautan “buka berkasnya langsung” tetap membuka berkas asli, termasuk ketika viewer PDF tidak bekerja di perangkat pengguna.
- Tanpa JavaScript, semua bagian dapat digulir, navigasi memakai anchor HTML, dan daftar karya beserta tautannya tetap tersedia dalam bahasa Inggris.
- Bahasa, tema, dan volume disimpan di localStorage bila tersedia. Audio memakai satu nilai volume; nol berarti senyap.

## Menambah atau mengubah karya

1. Simpan tangkapan layar di `assets/tiles/`. Lima proyek saat ini menggunakan gambar WebP 16:9.
2. Edit `WORKS` di `js/data.js`: `src`, `label`, `note`, dan opsional `href`, `year`, `role`, `blurb`, `points`. Sertakan pasangan `_id` untuk setiap bidang yang diterjemahkan.
3. Tambahkan slot `{ c, r, kind: 'work', i }` di `SLOTS` pada berkas yang sama. `i` adalah indeks proyek; koordinat harus berada di dalam `COLS × ROWS` dan tidak bertumpuk.
4. Perbarui HTML cadangan dan jalankan pemeriksaan:

```sh
node tools/fallback.mjs
node tools/check.mjs
```

Generator memperbarui hanya `<noscript id="worksFallback">`. Jangan mengedit daftar cadangan secara manual. Pemeriksaan akan gagal jika data dan HTML cadangan berbeda atau ada karya tanpa slot.

Untuk bagian baru, tambahkan `<section class="page" id="pageNama">`, tautan ke `#pageNama`, entri `CARDS`, slot `card`, serta terjemahannya. Perbarui daftar alias pada `404.html` bila bagian itu juga perlu menerima alamat lama `/nama`.

## Pemeriksaan

Pemeriksaan statis dan tes untuk pemeriksanya menggunakan Node.js 22.7+:

```sh
node tools/check.mjs
node --test tools/check.test.mjs
```

Yang diperiksa: kunci terjemahan, referensi aset, kelas CSS, karakter kendali, origin metadata, sintaks modul, JSON deployment, cakupan slot, rute kartu, terjemahan proyek, dan sinkronisasi HTML cadangan.

Konfigurasi redirect berada di folder saudara yang terpisah dari repo situs. Bila folder tersebut tersedia, JSON-nya ikut diperiksa. Jalur juga dapat diwajibkan secara eksplisit, relatif terhadap akar situs:

```sh
node tools/check.mjs --redirect-config ../redirect-portofolio-camera/vercel.json
```

Tes browser memerlukan Playwright sebagai perkakas pengembangan. Gunakan instalasi Playwright yang sudah tersedia, atau pasang secara lokal tanpa menambah dependensi produksi:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tools/browser-check.mjs
```

`PLAYWRIGHT_MODULE` dapat menunjuk ke folder paket Playwright yang sudah tersedia. `BROWSER_CHANNEL=msedge` memakai Edge terpasang. Di PowerShell:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
$env:BROWSER_CHANNEL = 'msedge'
node tools/browser-check.mjs
```

Tes membuat server khusus di loopback, menjalankan browser, lalu menutup keduanya. Berkas lingkungan dan metadata Git tidak disajikan. `TEST_FILTER` menjalankan skenario yang namanya mengandung teks tersebut.

Untuk diagnosis visual: `?fps` menampilkan pengukuran frame, `?nogrid` mematikan grid tepi ponsel, dan `?bare` membandingkan penggambaran dasar kanvas.

## Deployment

Gunakan direktori situs ini sebagai root proyek Vercel, preset **Other**, tanpa install/build command atau output directory khusus. `vercel.json` mengatur cache `assets/` selama satu jam dengan stale-while-revalidate satu hari. Ganti nama aset saat isinya berubah dan perlu langsung terlihat.

Domain utama: `https://portofolio-rainer.vercel.app/`. Jika berubah, perbarui canonical, `og:url`, `og:image`, sitemap, dan robots.txt bersama-sama.

Folder `../redirect-portofolio-camera/` adalah deployment terpisah untuk domain lama; ikuti README folder tersebut. Jangan memasang konfigurasi redirect pada proyek situs utama.

## Aset dan kredit

Kredit model, font, musik, dan efek suara tercantum di bagian About dalam situs. Model kamera berasal dari Dokono Kinokoda, iPod dari Timothy Ahene, font VCR OSD Mono dari Riciery Leal, dan musik **Backbay Lounge** dari Kevin MacLeod. Model dikompres ulang; audio tersedia sebagai loop 48 detik dalam Opus dan MP3. Efek rana dibuat dengan ElevenLabs. Pertahankan kredit tersebut saat mengganti atau mendistribusikan aset.

Tabel sumber, catatan pemrosesan, dan eksperimen terdahulu disimpan di [docs/history.md](docs/history.md). Arsip tersebut juga memuat pendekatan dan aset yang sudah diganti; gunakan README ini untuk keadaan proyek saat ini.
