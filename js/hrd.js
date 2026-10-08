const params = new URLSearchParams(window.location.search);
const token = params.get("t") || "";

function tampilkan(idKotak) {
  ["kotak-muat", "kotak-error", "kotak-surat"].forEach((id) => {
    document.getElementById(id).classList.toggle("d-none", id !== idKotak);
  });
}

function tampilkanError(teks) {
  document.getElementById("kotak-error").textContent = teks;
  tampilkan("kotak-error");
}

function isiTeks(id, teks) {
  document.getElementById(id).textContent = teks ?? "-";
}

function formatWaktu(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

async function bacaPesanError(error) {
  try {
    const isi = await error.context.json();
    return isi.error;
  } catch {
    return null;
  }
}

async function muatSurat() {
  const pesanUmum = "Link tidak valid atau surat tidak ditemukan.";
  if (!token) {
    tampilkanError(pesanUmum);
    return;
  }

  const { data, error } = await db.functions.invoke("lihat-surat-hrd", {
    body: { token },
  });

  if (error || !data || !data.surat) {
    const pesan = error ? await bacaPesanError(error) : null;
    tampilkanError(pesan || pesanUmum);
    return;
  }

  const s = data.surat;
  isiTeks("h-nomor", s.nomor_surat);
  isiTeks("h-tanggal", s.tanggal);
  isiTeks("h-supervisor", s.nama_supervisor);
  isiTeks("h-departemen", s.departemen);
  isiTeks("h-pekerja", s.nama_pekerja);
  isiTeks("h-pekerjaan", s.nama_pekerjaan);
  isiTeks("h-periode", s.periode_kerja);
  isiTeks("h-kesalahan", s.kesalahan_pekerja);
  isiTeks("h-komitmen", s.isi_komitmen);
  isiTeks("h-keterangan", s.keterangan);
  document.getElementById("h-status").replaceChildren(buatBadge(s.status));

  isiTeks("h-kp-nama", data.kp ? data.kp.nama : "-");
  isiTeks("h-kp-waktu", data.kp ? formatWaktu(data.kp.waktu) : "-");

  const tautan = document.getElementById("tautan-pdf-kp");
  if (data.pdf_kp_url && data.pdf_kp_url.startsWith("https://")) {
    tautan.href = data.pdf_kp_url;
    tautan.classList.remove("d-none");
  }

    const adaFinal = s.status === "SELESAI" && data.hrd;
  document.getElementById("kotak-final").classList.toggle("d-none", !adaFinal);
  if (adaFinal) {
    isiTeks("h-hrd-nama", data.hrd.nama);
    isiTeks("h-hrd-waktu", formatWaktu(data.hrd.waktu));
    const tautanFinal = document.getElementById("tautan-pdf-final");
    if (data.pdf_final_url && data.pdf_final_url.startsWith("https://")) {
      tautanFinal.href = data.pdf_final_url;
      tautanFinal.classList.remove("d-none");
    }
  }

  // Tombol tanda tangan hanya untuk surat yang menunggu HRD dan belum ditandatangani HRD
  document
    .getElementById("kotak-aksi")
    .classList.toggle("d-none", !(s.status === "MENUNGGU_HRD" && !data.hrd));
      // HRD sudah tanda tangan tapi PDF final belum jadi: coba selesaikan otomatis
  if (s.status === "MENUNGGU_HRD" && data.hrd) {
    selesaikanFinal();
  }

  tampilkan("kotak-surat");
}

muatSurat();

async function selesaikanFinal() {
  const hasil = document.getElementById("hasil");
  hasil.className = "alert alert-info";
  hasil.textContent = "Membuat dokumen PDF final, mohon tunggu...";

  const { data, error } = await db.functions.invoke("buat-pdf", {
    body: { token, peran: "HRD" },
  });

  if (error || !data || !data.status) {
    hasil.className = "alert alert-warning";
    hasil.textContent =
      "Tanda tangan Anda sudah tersimpan, tetapi dokumen final belum selesai dibuat. " +
      "Muat ulang halaman ini untuk mencoba lagi.";
    return;
  }

  await muatSurat();
  hasil.className = "alert alert-success";
  hasil.textContent = "Surat selesai. Dokumen final sudah dibuat dan disimpan.";
}

let papan = null;

function tampilPesanTtd(teks) {
  const kotak = document.getElementById("pesan-ttd");
  kotak.className = teks ? "alert alert-danger py-2" : "";
  kotak.textContent = teks;
}

document.getElementById("btn-ttd").addEventListener("click", () => {
  if (!papan) papan = buatPapanTtd(document.getElementById("kanvas-ttd"));
  papan.hapus();
  tampilPesanTtd("");
  document.getElementById("tombol-aksi").classList.add("d-none");
  document.getElementById("form-ttd").classList.remove("d-none");
});

document.getElementById("btn-hapus-ttd").addEventListener("click", () => papan.hapus());

document.getElementById("btn-batal-ttd").addEventListener("click", () => {
  document.getElementById("form-ttd").classList.add("d-none");
  document.getElementById("tombol-aksi").classList.remove("d-none");
});

document.getElementById("form-ttd").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama-ttd").value.trim();
  if (!nama) {
    tampilPesanTtd("Nama wajib diisi.");
    return;
  }
  if (papan.kosong()) {
    tampilPesanTtd("Silakan gambar tanda tangan Anda terlebih dahulu.");
    return;
  }
  const lanjut = await konfirmasi({
    judul: "Tandatangani surat?",
    pesan: "Dengan menyimpan, Anda menandatangani surat ini dan tidak dapat mengubahnya.",
    tombol: "Ya, tandatangani",
  });
  if (!lanjut) return;

  const tombol = document.getElementById("btn-simpan-ttd");
  tombol.disabled = true;
  tombol.textContent = "Menyimpan...";
  tampilPesanTtd("");

  const { error } = await db.functions.invoke("setuju-hrd", {
    body: { token, nama, tanda_tangan: papan.keDataUrl() },
  });

  tombol.disabled = false;
  tombol.textContent = "Simpan Tanda Tangan";

  if (error) {
    const pesan = await bacaPesanError(error);
    tampilPesanTtd(pesan || "Gagal menyimpan. Coba lagi.");
    return;
  }

  document.getElementById("kotak-aksi").classList.add("d-none");
  await selesaikanFinal();
});