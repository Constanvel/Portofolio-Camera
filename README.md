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
- `assets/tiles/` — video karya, plus versi kecil di `assets/tiles-sm/` untuk HP

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
