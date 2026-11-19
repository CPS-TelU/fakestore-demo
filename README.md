# Fakestore Demo

Express API + Next.js UI. Modul 1: UI (login dan list product). Modul 2: CRUD akun dan produk lewat Postman.

## Struktur

```
server/   Express API (CRUD akun & produk, login dengan JWT)
web/      Next.js App Router UI
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

| Method | Path                 | Login? | Keterangan                                   |
| ------ | -------------------- | ------ | -------------------------------------------- |
| GET    | `/health`            | Tidak  | Health check                                 |
| POST   | `/api/users`         | Tidak  | Create akun. Body `{ username, email, password }` |
| POST   | `/api/login`         | Tidak  | Body `{ username, password }`, balasan berisi token |
| GET    | `/api/users`         | Ya     | Semua akun                                   |
| GET    | `/api/users/:id`     | Ya     | Satu akun                                    |
| PUT    | `/api/users/:id`     | Ya     | Ganti seluruh data akun sendiri              |
| PATCH  | `/api/users/:id`     | Ya     | Ubah sebagian data akun sendiri              |
| DELETE | `/api/users/:id`     | Ya     | Hapus akun sendiri                           |
| GET    | `/api/products`      | Tidak  | Semua product                                |
| GET    | `/api/products/:id`  | Tidak  | Satu product                                 |
| POST   | `/api/products`      | Ya     | Create product                               |
| PUT    | `/api/products/:id`  | Ya     | Ganti seluruh data product                   |
| PATCH  | `/api/products/:id`  | Ya     | Ubah sebagian data product                   |
| DELETE | `/api/products/:id`  | Ya     | Hapus product                                |

Endpoint "Login? Ya" butuh header `Authorization: Bearer <token>`.

## Akun demo

```
username: mor_2314
password: 83r5^_
```

## Catatan

- Data akun dan produk disimpan di memori server. Setiap server restart, data kembali ke awal.
- Data awal produk diambil dari [fakestoreapi.com](https://fakestoreapi.com/) saat server menyala (ada data cadangan jika offline).
- Token disimpan di `localStorage`; cukup untuk demo, bukan untuk produksi.
- Base URL API di UI diatur lewat `web/.env.local` (`NEXT_PUBLIC_API_URL`).