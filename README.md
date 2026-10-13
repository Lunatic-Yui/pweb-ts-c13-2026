# Pemrograman Web — Praktikum TypeScript: Antrian Rumah Sakit

Aplikasi antrian rumah sakit interaktif yang dibangun **native from scratch** menggunakan HTML, CSS, dan TypeScript (dikompilasi ke JavaScript), tanpa framework maupun library apa pun.

## 👥 Anggota Kelompok

| Nama | NRP | Tanggung Jawab |
|---|---|---|
| Tafidah Hasna Mumtazah | 5027251025 | Fondasi, Auth, dan Ambil Antrian |
| Yovi Prayudya Rizky Ramadhani | 5027251107 | Dashboard Admin |
| Alif Ramzy Pasha Firdaus | 5027251121 | Operator dan Layar |

### Pembagian Tugas

**Anggota 1: Fondasi, Auth, dan Ambil Antrian**
- Nomor 1 (Halaman Login) — `login.html`, `src/login.ts`
- Nomor 5 (Halaman Ambil Antrian) — `ambil-antrian.html`, `src/ambil.ts`
- Bagian Ketentuan Website (TypeScript, `tsconfig.json`, Local Storage) — `src/common.ts`, `tsconfig.json`, `css/style.css`

**Anggota 2: Dashboard Admin**
- Nomor 2 (Halaman Dashboard Admin) — `index.html`, `src/admin.ts`

**Anggota 3: Operator dan Layar**
- Nomor 3 (Halaman Operator) — `operator.html`, `src/operator.ts`
- Nomor 4 (Halaman Layar Antrian) — `layar.html`, `src/layar.ts`

## 🗂️ Struktur Proyek

```
pweb-ts-c13-2026/
├── login.html            # Halaman login
├── index.html            # Dashboard admin (auth + role guard)
├── operator.html         # Panel operator (auth + role guard)
├── layar.html            # Layar antrian (auth guard)
├── ambil-antrian.html    # Ambil nomor antrian (auth guard)
├── css/
│   └── style.css         # Styling seluruh halaman (termasuk tema gelap)
├── src/                  # Source TypeScript
│   ├── common.ts         # Tipe data, Store (Local Storage), Auth, Theme, helper DOM
│   ├── login.ts
│   ├── admin.ts
│   ├── operator.ts
│   ├── layar.ts
│   └── ambil.ts
├── dist/                 # Hasil kompilasi JavaScript (dihubungkan ke HTML dengan defer)
├── tsconfig.json
├── package.json
└── README.md
```

## 🚀 Cara Menjalankan

Proyek ini murni client-side dan dijalankan lewat local server (misalnya **Live Server** di VS Code).

1. Clone repository ini.
2. Install TypeScript: `npm install`
3. Kompilasi TypeScript: `npm run build` (atau `npm run watch` untuk mode `tsc --watch`).
4. Klik kanan `login.html` → **Open with Live Server**.
5. Login menggunakan akun uji dari dummyjson (lihat bagian bawah).

### Akun untuk uji coba

Akun diambil dari `https://dummyjson.com/users/filter?key=role&value=admin` dan `...value=user`. Di halaman login tersedia tautan **akun admin** dan **akun user** yang mengisi form otomatis.

## 🔐 Hak Akses (Role)

| Halaman | User | Admin / Moderator |
|---|:---:|:---:|
| `ambil-antrian.html` | ✅ | ✅ |
| `layar.html` | ✅ | ✅ |
| `index.html` (Dashboard) | ❌ | ✅ |
| `operator.html` | ❌ | ✅ |

Semua pengguna **wajib login** untuk mengambil antrian. Role `moderator` diperlakukan sama dengan `admin`. Pengguna tanpa hak akses otomatis dialihkan ke `login.html`.

## ✅ Fitur Sesuai Ketentuan Soal

### Ketentuan Website (Anggota 1)
- **Native** — tanpa framework/library JS maupun CSS, dan tanpa template.
- **TypeScript & Compilation Workflow** — seluruh logic ditulis dalam `.ts`, hasil kompilasi di `dist/` dihubungkan ke HTML menggunakan atribut `defer`. `tsconfig.json` disertakan.
- **Local Storage** — sesi (token, role, nama), data master jenis antrian, dan daftar tiket disimpan di Local Storage sehingga tidak hilang saat refresh.

### 1. Halaman Login (`login.html`) — Anggota 1
- **Form Login** — input username & password dengan indikator loading ("Memproses...") saat verifikasi.
- **Autentikasi & Validasi Role** — `POST https://dummyjson.com/auth/login`; role ditentukan dari respons server (`admin`, `moderator`, `user`).
- **Session Storage** — `token`, `role`, dan `firstName` disimpan ke Local Storage setelah berhasil.
- **Error Handling** — pesan error visual untuk kredensial salah maupun gagal jaringan (`try...catch`).
- **Auto Redirect** — admin/moderator ke `index.html`, user ke `ambil-antrian.html`; sesi yang sudah ada langsung dialihkan tanpa login ulang.

### 2. Halaman Dashboard Admin (`index.html`) — Anggota 2
- **Auth Guard & Role Guard** — redirect paksa ke `login.html` bila belum login atau role bukan admin/moderator.
- **Navigation Bar** — nama pengguna aktif, role, dan tombol Logout (menghapus sesi).
- **Manajemen Jenis Antrian** — tambah jenis (kode 1 huruf kapital + nama layanan) dengan validasi duplikasi case-insensitive, aktifkan/nonaktifkan, hapus, dan Reset Antrian (mengosongkan tiket dan mengembalikan penomoran ke awal).
- **Penerbitan Tiket Manual** — pilih jenis antrian dan prioritas (Normal, Lansia, Disabilitas, VIP).

### 3. Halaman Operator (`operator.html`) — Anggota 3
- **Auth Guard & Role Guard** — hanya admin/moderator.
- **Panel Pemanggilan** — menampilkan nomor yang sedang dipanggil dan tiket berikutnya berdasarkan prioritas (VIP > Disabilitas > Lansia > Normal), lalu urutan kedatangan.
- **Panggil Berikutnya** — menyelesaikan tiket aktif dan memanggil tiket selanjutnya.
- **Lewati** — tiket tidak hadir dipindah ke akhir antrian, ditandai *Dilewati* setelah dilewati dua kali.
- **Selesai** — menutup tiket aktif tanpa otomatis memanggil berikutnya.

### 4. Halaman Layar Antrian (`layar.html`) — Anggota 3
- **Tampilan Real-time** — polling setiap 2 detik tanpa reload halaman.
- **Panel Layar** — kartu per jenis antrian aktif berisi nomor yang dipanggil dan jumlah tiket menunggu.
- **Layar Penuh** — tombol toggle menggunakan Fullscreen API.

### 5. Halaman Ambil Antrian (`ambil-antrian.html`) — Anggota 1
- **Self-Service** — pilih jenis antrian dan prioritas (Normal, Lansia, Disabilitas, VIP). Jenis nonaktif tidak bisa dipilih.
- **Format Nomor Tiket** — `Kode-Nomor 3 Digit`, contoh `A-001`, `B-012`.
- **Pembaruan Otomatis** — jenis antrian baru dari dashboard admin langsung muncul tanpa reload.

## ✨ Fitur Tambahan (Nilai Plus)

Seluruhnya tetap HTML/CSS/TypeScript murni:

- **Suara panggilan (Anggota 3)** — pengumuman nomor antrian menggunakan Web Speech API, diawali bunyi "ding" dari Web Audio API.
- **Penanda tiket saya di Layar (Anggota 3)** — kartu layanan menampilkan tiket milik pengguna dan berkedip saat tiketnya dipanggil.
- **Riwayat tiket saya (Anggota 1)** — daftar tiket yang pernah diambil beserta status, jumlah antrian di depan, dan estimasi tunggu.
- **Estimasi waktu tunggu (Anggota 1)** — dihitung dari rata-rata durasi layanan per jenis antrian (default 3 menit bila belum ada data).
- **Dark/Light Theme Toggle (Anggota 1)** — preferensi tema disimpan di Local Storage.
- **Statistik dashboard (Anggota 2)** — total tiket, menunggu, dipanggil, selesai, dilewati, dan rata-rata waktu layanan.

## 🔌 API yang Digunakan

| Kebutuhan | Endpoint |
|---|---|
| Autentikasi Login | `POST https://dummyjson.com/auth/login` |
| Data uji admin | `https://dummyjson.com/users/filter?key=role&value=admin` |
| Data uji user | `https://dummyjson.com/users/filter?key=role&value=user` |

## 🛠️ Teknologi

- HTML
- CSS
- TypeScript