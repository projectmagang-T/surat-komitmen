users  (id PK, nama, pin_hash, created_at, updated_at)
  │        ← hanya untuk Supervisor
  └──< surat
        id PK
        nomor_surat (unik)
        supervisor_id FK → users.id
        tanggal, departemen, nama_pekerjaan
        nama_pekerja, kesalahan_pekerja
        periode_kerja, isi_komitmen, keterangan
        status
        token_kp (unik), token_hrd (unik)
        created_at, updated_at
          │
          ├──< approvals
          │     id PK, surat_id FK, role,
          │     status, catatan, nama_penandatangan, created_at
          │
          ├──< signatures
          │     id PK, surat_id FK, role,
          │     nama_penandatangan, signature_path, signed_at
          │
          ├──< documents
          │     id PK, surat_id FK, file_name,
          │     file_path, document_type, created_at
          │
          ├──< revision_history
          │     id PK, surat_id FK, nama_pelaku, role,
          │     reason, old_data, created_at
          │
          └──< activity_logs
                id PK, surat_id FK, nama_pelaku, role,
                activity, description, created_at