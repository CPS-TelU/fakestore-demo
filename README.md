# Fakestore Demo

Express API + Next.js UI. Login dan user disimpan di MySQL; produk di-seed sekali dari [fakestoreapi.com](https://fakestoreapi.com/), lalu dibaca dari MySQL.

## Struktur

```
server/
  src/index.js   satu file: fungsi lama (tanpa database) tetap ada sebagai
                 TODO comment, di bawahnya versi fungsi dengan database (MySQL)
web/             Next.js App Router UI
postman/         koleksi Postman untuk materi database
```

## Jalankan

Terminal 1 — API (port 4000):

```bash
cd server
npm install
npm run dev
```

Terminal 2 — UI (port 3000):

```bash
cd web
npm install
npm run dev
```

Buka http://localhost:3000.

## Endpoint

| Method | Path                | Keterangan                       |
| ------ | ------------------- | -------------------------------- |
| GET    | `/health`           | Health check                     |
| POST   | `/api/login`        | Body `{ username, password }`, cek ke MySQL |
| POST   | `/api/register`     | Body `{ username, password }`, password di-hash otomatis |
| GET    | `/api/me`           | Cek token (versi database)       |
| GET    | `/api/products`     | Semua product                    |
| GET    | `/api/products/:id` | Satu product                     |

## Database (MySQL / phpMyAdmin)

Versi database memakai **MySQL** (bisa lewat phpMyAdmin/XAMPP). Konfigurasi lewat env:

| Env           | Default     |
| ------------- | ----------- |
| `DB_HOST`     | `localhost` |
| `DB_PORT`     | `3306`      |
| `DB_USER`     | `root`      |
| `DB_PASSWORD` | *(kosong)*  |
| `DB_NAME`     | `fakestore` |

- Database `fakestore` dan tabel `users`, `sessions`, `products` dibuat otomatis saat server jalan.
- Query SQL untuk import manual ada di `server/database/fakestore.sql` (phpMyAdmin tab Import).
- User demo di-seed saat pertama kali jalan lewat `POST /api/register` internal (password di-hash otomatis).
- User baru dibuat lewat `POST /api/register`; cukup kirim password polos, backend yang melakukan hash bcrypt.
- Bisa juga insert langsung di phpMyAdmin: `INSERT INTO users (username, password) VALUES ('budi', 'inipassword');` — trigger database yang mengubah password polos itu jadi hash otomatis (login tetap pakai `inipassword`).
- Hash dari API memakai bcrypt, hash dari insert SQL memakai SHA2 + salt; login mendukung keduanya.
- File SQL tidak berisi hash password manual lagi.
- Produk di-seed sekali dari `fakestoreapi.com`, setelah itu dibaca dari MySQL.
- Di `server/src/index.js`, tiap fungsi lama (tanpa database) tetap ada sebagai TODO comment dan di bawahnya versi database.

Contoh kalau MySQL di port lain:

```powershell
$env:DB_PORT='3307'; npm run dev
```

## Akun demo

```
username: mor_2314
password: 83r5^_
```

## Catatan

- Token disimpan di `localStorage`; cukup untuk demo, bukan untuk produksi.
- Base URL API di UI diatur lewat `web/.env.local` (`NEXT_PUBLIC_API_URL`).
