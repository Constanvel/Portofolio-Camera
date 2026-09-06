# 3D Project Deck Design

## Tujuan

Menambahkan penjelajah proyek 3D yang playful pada halaman Karya tanpa mengganti grid HTML, mengubah intro, atau menambah aset model dari luar.

## Bentuk dan sumber aset

Kartu dibuat secara prosedural dengan Three.js memakai rounded extruded geometry. Bagian depan memakai lima screenshot di `assets/tiles` sebagai tekstur. Tidak ada GLB baru, unduhan model pihak ketiga, atau kredit aset tambahan.

## Interaksi

- Drag horizontal memindahkan kartu aktif.
- Scroll, tombol sebelumnya dan berikutnya, serta panah keyboard mengganti proyek.
- Tap kartu aktif, tombol buka proyek, atau Enter membuka dialog proyek yang sudah ada.
- Judul, nomor, dan deskripsi kartu aktif mengikuti bahasa situs.
- Grid proyek tetap berada di bawah deck sebagai daftar lengkap dan fallback.

## Lifecycle dan performa

`js/project-deck.js` memiliki renderer, scene, texture, event listener, dan animation loop sendiri. Modul dimuat secara dinamis ketika rute Karya dibuka. Semua GPU resource dan listener dilepas ketika pengguna meninggalkan rute tersebut. Pixel ratio dibatasi 1.5 dan scene hanya memakai geometri sederhana serta lima tekstur yang sudah digunakan halaman.

Preferensi reduced motion mempertahankan navigasi dan tampilan 3D, tetapi perubahan kartu langsung menuju posisi akhir tanpa animation loop berkelanjutan.

## Aksesibilitas dan fallback

Canvas memiliki nama aksesibel dan fokus keyboard. Tombol HTML menyediakan semua aksi inti. Status kartu aktif diumumkan melalui area live. Jika impor Three.js atau WebGL gagal, deck tetap tersembunyi dan grid HTML berfungsi seperti sebelumnya.

## Verifikasi

- Tes browser membuka halaman Karya, menunggu lima kartu, berpindah proyek, membuka dialog, lalu memastikan renderer dilepas setelah pindah rute.
- Pemeriksaan existing memastikan rute, bahasa, grid, intro, mobile lite path, dan versi tanpa JavaScript tetap berfungsi.

