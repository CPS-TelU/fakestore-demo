# Modul untuk praktik CA webdev 2026
# Fakestore Demo

Express API + Next.js UI. Login dan list product dari [fakestoreapi.com](https://fakestoreapi.com/).

## Struktur

```
server/   Express API (proxy fakestoreapi)
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

| Method | Path                | Keterangan                       |
| ------ | ------------------- | -------------------------------- |
| GET    | `/health`           | Health check                     |
| POST   | `/api/login`        | Body `{ username, password }`    |
| GET    | `/api/products`     | Semua product                    |
| GET    | `/api/products/:id` | Satu product                     |

## Akun demo

```
username: mor_2314
password: 83r5^_
```

## Catatan

- Token disimpan di `localStorage`; cukup untuk demo, bukan untuk produksi.
- Base URL API di UI diatur lewat `web/.env.local` (`NEXT_PUBLIC_API_URL`).
