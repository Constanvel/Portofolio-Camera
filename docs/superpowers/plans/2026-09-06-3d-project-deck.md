# 3D Project Deck Implementation Plan

> Untuk pengerjaan agentic: jalankan rencana ini berurutan dengan TDD dan verifikasi setiap tahap.

Goal: Membuat penjelajah proyek 3D prosedural pada halaman Karya.

Architecture: `js/project-deck.js` mengelola satu scene Three.js ringan dan lifecycle-nya. `js/main.js` menghubungkan scene ke router, data proyek, bahasa, tema, dan dialog yang sudah ada. HTML dan CSS menyediakan surface, caption, kontrol, fallback, dan layout responsif.

Tech Stack: HTML, CSS, JavaScript modules, Three.js r160, Playwright.

Spec: `docs/superpowers/specs/2026-09-06-3d-project-deck-design.md`

## Batas global

- Tidak menambah model atau dependensi eksternal.
- Tidak mengubah scene atau urutan intro.
- Grid HTML dan fallback tanpa JavaScript tetap tersedia.
- Renderer deck hanya hidup selama halaman Karya terbuka.
- Jangan commit atau push otomatis.

## Task 1: Kontrak perilaku browser

Files:
- Modify: `tools/browser-check.mjs`

Steps:

- [x] Tambahkan tes yang membuka Karya dan menunggu status deck siap dengan lima kartu.
- [x] Uji tombol berikutnya memperbarui judul aktif.
- [x] Uji tombol buka proyek menggunakan dialog proyek existing.
- [x] Pindah ke Tentang dan pastikan instance deck telah dilepas.
- [x] Jalankan tes dan pastikan gagal karena markup serta runtime deck belum ada.

## Task 2: Markup, terjemahan, dan style

Files:
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/i18n.js`

Steps:

- [x] Tambahkan container, canvas, caption, dan tiga tombol sebelum grid proyek.
- [x] Tambahkan teks Inggris dan Indonesia untuk nama aksesibel serta kontrol.
- [x] Buat layout desktop dan mobile dengan tinggi terbatas dan grid tetap dapat dipindai.
- [x] Sembunyikan deck sampai WebGL berhasil dibuat.

## Task 3: Scene prosedural dan lifecycle

Files:
- Create: `js/project-deck.js`
- Modify: `js/main.js`

Interface:

- Consumes: canvas, array WORKS, callback `onChange(index)` dan `onOpen(index)`.
- Produces: class `ProjectDeck` dengan `start()`, `stop()`, `next(step)`, `syncTheme()`, dan `dispose()`.

Steps:

- [x] Bangun card geometry rounded dengan screenshot sebagai texture.
- [x] Tambahkan posisi bertumpuk, depth, hover tilt, drag, wheel, dan keyboard.
- [x] Batasi pixel ratio dan render hanya ketika animasi atau interaksi membutuhkan frame.
- [x] Hubungkan pembuatan dan disposal ke rute Karya.
- [x] Hubungkan caption ke terjemahan serta tombol ke dialog existing.
- [x] Jalankan tes browser target sampai lulus.

## Task 4: Verifikasi lengkap

Files:
- Modify bila diperlukan: `tools/check.mjs`, `tools/check.test.mjs`

Steps:

- [x] Jalankan pemeriksaan sintaks semua modul yang berubah.
- [x] Jalankan `node tools/check.mjs`.
- [x] Jalankan `node --test tools/check.test.mjs`.
- [x] Jalankan seluruh `node tools/browser-check.mjs` dengan Edge.
- [x] Jalankan `git diff --check` dan tinjau file yang akan distage.


