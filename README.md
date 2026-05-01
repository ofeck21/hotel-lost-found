# Lost & Found Hotel App

Aplikasi Next.js untuk pencatatan barang tamu yang tertinggal di hotel.

## Fitur

- CRUD data Lost & Found
- Upload foto dokumentasi pengambilan
- Login berbasis tabel `users` di MySQL untuk akses Create/Update/Delete
- Update password user login
- Mode read-only jika belum login
- UI responsif (mobile + desktop) dengan Tailwind CSS

## Kolom Data

- Nama Tamu
- Check In (tanggal check in)
- Check Out (tanggal check out)
- Barang
- No Kamar
- Remark (`Azana`, `FrontOne`)
- Dibuat Oleh
- Pickup Handle
- Dokumentasi Pengambilan (foto)
- Keterangan (`Belum Diambil`, `Sudah Diambil`)

## Menjalankan Project

1. Install dependency:

```bash
npm install
```

2. Siapkan environment:

```bash
cp .env.example .env.local
```

3. Pastikan MySQL berjalan dan buat database, contoh:

```sql
CREATE DATABASE lostfound_db;
```

4. Sinkronkan schema Prisma ke MySQL:

```bash
npm run db:push
```

5. Jalankan seeder user default:

```bash
npm run db:seed
```

Seeder akan membuat user:
- Username: `admin`
- Password: `admin123`

Reset database seperti `migrate:fresh` Laravel:

```bash
npm run db:fresh
```

Perintah ini akan drop semua tabel, push ulang schema, lalu seed ulang data default.

6. Jalankan development server:

```bash
npm run dev
```

7. Buka `http://localhost:3000`

## Login Default

- Username: `admin`
- Password: `admin123`

Bisa diubah lewat `.env.local`.

## Catatan

- Data disimpan di database MySQL melalui Prisma.
- Credential login disimpan di tabel `users`.
- Login dibaca langsung dari tabel `users` (tidak menggunakan `LOGIN_USERNAME` / `LOGIN_PASSWORD` dari env).
- File foto upload disimpan di folder `UPLOAD_DIR`.

## Konfigurasi Upload Agar Aman Saat Redeploy

Secara default, jika `UPLOAD_DIR` tidak diisi maka upload disimpan ke `public/uploads`.

Untuk production, wajib arahkan `UPLOAD_DIR` ke storage persistent (volume/mount path), contoh:

```env
UPLOAD_DIR=/var/lib/lostfound/uploads
```

Checklist deploy:

1. Buat folder persistent di server.
2. Mount folder tersebut ke container/app (jika pakai Docker/PM2 setup custom).
3. Set env `UPLOAD_DIR` ke path folder mount.
4. Redeploy aplikasi.

Jika langkah di atas sudah dilakukan, file upload tidak ikut hilang saat aplikasi di-redeploy.
