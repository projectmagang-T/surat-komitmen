# Sistem Digital Surat Komitmen Kerja

Mendigitalkan pembuatan, pemeriksaan, tanda tangan, dan penyimpanan surat komitmen kerja.
Alur: Supervisor -> Kepala Produksi -> HRD -> PDF final.

## Teknologi
HTML, CSS, JavaScript (tanpa framework), Bootstrap 5, Chart.js.
Supabase (Auth, PostgreSQL, Storage, Edge Functions), Netlify, Telegram Bot API.

## Struktur
- public/      : file web yang diterbitkan ke Netlify
- supabase/    : kode Edge Function dan migrasi SQL (TIDAK diterbitkan)
- docs/        : ERD, catatan notifikasi, checklist pengujian
- netlify.toml : pengaturan hosting dan header keamanan

## Menjalankan di komputer
1. Buka folder ini di VS Code.
2. Pasang ekstensi Live Server.
3. Klik kanan public/index.html -> Open with Live Server.

## Pengaturan yang tidak ada di kode (dibuat lewat dashboard)
- Supabase: tabel, RLS, bucket Storage, Edge Function, Database Webhook, Secrets
- Netlify: koneksi ke GitHub
Lihat docs/notifikasi.md dan supabase/migrations/.

## Rahasia
Tidak ada rahasia di repositori ini. Nama variabelnya ada di .env.example,
nilainya disimpan di Supabase (Edge Functions -> Secrets).