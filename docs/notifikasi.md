# Notifikasi Telegram

## Database Webhook
- Nama: notifikasi_surat
- Tabel: surat, event: Insert dan Update
- Tujuan: Edge Function kirim-notifikasi (POST)
- Header: x-webhook-secret = (nilai WEBHOOK_SECRET, JANGAN ditulis di sini)

## Secrets di Edge Functions
TELEGRAM_BOT_TOKEN, WEBHOOK_SECRET, SITE_URL,
CHAT_ID_KP, CHAT_ID_HRD, CHAT_ID_SUPERVISOR
(nilai tidak disimpan di Git)

## Aturan penerima (produksi)
- CHAT_ID_KP: chat pribadi Kepala Produksi (atau grup yang hanya berisi yang berhak)
- CHAT_ID_HRD: chat pribadi HRD (atau grup yang hanya berisi HRD)
- CHAT_ID_SUPERVISOR: grup Supervisor (pesannya tidak memuat link bertoken)
- Jangan gabungkan KP dan HRD dalam satu grup.

## Keterbatasan yang diketahui
- Pesan yang gagal terkirim tidak dikirim ulang otomatis.
- SITE_URL harus diganti ke alamat Netlify saat deployment, dan format
  link di susunPesan disesuaikan.