# Evaluasi Kegiatan Harian

Aplikasi web sederhana untuk mencatat, mengevaluasi, dan mengekspor kegiatan harian ke spreadsheet (CSV).

## Fitur

- ➕ Tambah kegiatan dengan nama, kategori, waktu, status, penilaian bintang, mood, dan catatan
- 📊 Laporan harian otomatis: total kegiatan, progress penyelesaian, rata-rata nilai
- 📋 Tabel semua data dari semua tanggal
- ⬇ Ekspor ke `.csv` yang bisa dibuka di Excel / Google Sheets
- 💾 Data tersimpan otomatis di localStorage

## Cara Jalankan Lokal

```bash
npm install
npm start
```

Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

```bash
npm run build
```

Atau hubungkan repo ini ke [vercel.com](https://vercel.com) untuk auto-deploy.

## Teknologi

- React 18
- localStorage (penyimpanan data)
- CSV export (tanpa library tambahan)
