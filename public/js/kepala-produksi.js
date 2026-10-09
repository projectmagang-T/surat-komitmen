const params = new URLSearchParams(window.location.search);
const token = params.get("t") || "";

function tampilkan(idKotak) {
  ["kotak-muat", "kotak-error", "kotak-surat"].forEach((id) => {
    document.getElementById(id).classList.toggle("d-none", id !== idKotak);
  });
}

function isiTeks(id, teks) {
  document.getElementById(id).textContent = teks ?? "-";
}

async function muatSurat() {
  if (!token) {
    tampilkan("kotak-error");
    return;
  }

  const { data, error } = await db.functions.invoke("lihat-surat", {
    body: { token },
  });

  if (error || !data || !data.surat) {
    tampilkan("kotak-error");
    return;
  }

  const s = data.surat;
  isiTeks("f-nomor", s.nomor_surat);
  isiTeks("f-tanggal", s.tanggal);
  isiTeks("f-supervisor", s.nama_supervisor);
  isiTeks("f-departemen", s.departemen);
  isiTeks("f-pekerja", s.nama_pekerja);
  isiTeks("f-pekerjaan", s.nama_pekerjaan);
  isiTeks("f-periode", s.periode_kerja);
  isiTeks("f-kesalahan", s.kesalahan_pekerja);
  isiTeks("f-komitmen", s.isi_komitmen);
  isiTeks("f-keterangan", s.keterangan);
  document.getElementById("f-status").replaceChildren(buatBadge(s.status));

  // Tombol aksi hanya muncul kalau surat memang menunggu Kepala Produksi
  document
    .getElementById("kotak-aksi")
    .classList.toggle("d-none", s.status !== "MENUNGGU_KEPALA_PRODUKSI");
    if (s.status === "DISETUJUI_KEPALA_PRODUKSI") {
      selesaikanPdf();
  }

  tampilkan("kotak-surat");
}

muatSurat();

let aksiDipilih = null; // "REVISI" atau "TOLAK"

function tampilPesanForm(teks) {
  const kotak = document.getElementById("pesan-form");
  kotak.className = teks ? "alert alert-danger py-2" : "";
  kotak.textContent = teks;
}

function bukaForm(aksi) {
  aksiDipilih = aksi;
  document.getElementById("judul-form").textContent =
    aksi === "REVISI" ? "Minta revisi" : "Tolak surat";
  document.getElementById("label-alasan").textContent =
    aksi === "REVISI" ? "Alasan revisi" : "Alasan penolakan";
  tampilPesanForm("");
  document.getElementById("tombol-aksi").classList.add("d-none");
  document.getElementById("form-keputusan").classList.remove("d-none");
}

function tutupForm() {
  aksiDipilih = null;
  document.getElementById("form-keputusan").classList.add("d-none");
  document.getElementById("tombol-aksi").classList.remove("d-none");
}

async function bacaPesanError(error) {
  try {
    const isi = await error.context.json();
    return isi.error;
  } catch {
    return null;
  }
}

document.getElementById("btn-revisi").addEventListener("click", () => bukaForm("REVISI"));
document.getElementById("btn-tolak").addEventListener("click", () => bukaForm("TOLAK"));
document.getElementById("btn-batal").addEventListener("click", tutupForm);

document.getElementById("form-keputusan").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama-kp").value.trim();
  const alasan = document.getElementById("alasan-kp").value.trim();

  if (!nama || !alasan) {
    tampilPesanForm("Nama dan alasan wajib diisi.");
    return;
  }
  if (aksiDipilih === "TOLAK") {
    const lanjut = await konfirmasi({
      judul: "Tolak surat ini?",
      pesan: "Surat yang ditolak tidak dapat diproses lagi.",
      tombol: "Ya, tolak",
      bahaya: true,
    });
    if (!lanjut) return;
  }

  const tombol = document.getElementById("btn-kirim");
  tombol.disabled = true;
  tombol.textContent = "Mengirim...";
  tampilPesanForm("");

  const { data, error } = await db.functions.invoke("keputusan-kp", {
    body: { token, aksi: aksiDipilih, nama, alasan },
  });

  tombol.disabled = false;
  tombol.textContent = "Kirim";

  if (error) {
    const pesan = await bacaPesanError(error);
    tampilPesanForm(pesan || "Gagal mengirim. Coba lagi.");
    return;
  }

  const hasil = document.getElementById("hasil");
  hasil.className = "alert alert-success mt-3 mb-0";
  hasil.textContent =
    aksiDipilih === "REVISI"
      ? "Permintaan revisi terkirim. Supervisor akan memperbaiki surat."
      : "Surat telah ditolak. Alasan Anda tersimpan.";

  document.getElementById("f-status").replaceChildren(buatBadge(data.status));
  document.getElementById("kotak-aksi").classList.add("d-none");
});

let papan = null;

function tampilPesanSetuju(teks) {
  const kotak = document.getElementById("pesan-setuju");
  kotak.className = teks ? "alert alert-danger py-2" : "";
  kotak.textContent = teks;
}

document.getElementById("btn-setuju").addEventListener("click", () => {
  if (!papan) papan = buatPapanTtd(document.getElementById("kanvas-ttd"));
  papan.hapus();
  tampilPesanSetuju("");
  document.getElementById("tombol-aksi").classList.add("d-none");
  document.getElementById("form-setuju").classList.remove("d-none");
});

document.getElementById("btn-hapus-ttd").addEventListener("click", () => papan.hapus());

document.getElementById("btn-batal-setuju").addEventListener("click", () => {
  document.getElementById("form-setuju").classList.add("d-none");
  document.getElementById("tombol-aksi").classList.remove("d-none");
});

document.getElementById("form-setuju").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama-ttd").value.trim();
  if (!nama) {
    tampilPesanSetuju("Nama wajib diisi.");
    return;
  }
  if (papan.kosong()) {
    tampilPesanSetuju("Silakan gambar tanda tangan Anda terlebih dahulu.");
    return;
  }
  const lanjut = await konfirmasi({
    judul: "Setujui dan tandatangani?",
    pesan: "Dengan menyimpan, Anda menyetujui surat ini dan tidak dapat mengubahnya.",
    tombol: "Ya, setujui",
  });
  if (!lanjut) return;

  const tombol = document.getElementById("btn-simpan-ttd");
  tombol.disabled = true;
  tombol.textContent = "Menyimpan...";
  tampilPesanSetuju("");

  const { data, error } = await db.functions.invoke("setuju-kp", {
    body: { token, nama, tanda_tangan: papan.keDataUrl() },
  });

  tombol.disabled = false;
  tombol.textContent = "Simpan Tanda Tangan";

  if (error) {
    const pesan = await bacaPesanError(error);
    tampilPesanSetuju(pesan || "Gagal menyimpan. Coba lagi.");
    return;
  }

  const hasil = document.getElementById("hasil");
  hasil.className = "alert alert-success mt-3 mb-0";
  hasil.textContent = "Surat disetujui dan tanda tangan Anda tersimpan. Surat akan diteruskan ke HRD.";

  document.getElementById("f-status").replaceChildren(buatBadge(data.status));
  document.getElementById("kotak-aksi").classList.add("d-none");
  await selesaikanPdf();
});

async function selesaikanPdf() {
  const hasil = document.getElementById("hasil");
  hasil.className = "alert alert-info mt-3 mb-0";
  hasil.textContent = "Membuat dokumen PDF, mohon tunggu...";

  const { data, error } = await db.functions.invoke("buat-pdf", {
    body: { token },
  });

  if (error || !data || !data.status) {
    hasil.className = "alert alert-warning mt-3 mb-0";
    hasil.textContent =
      "Tanda tangan sudah tersimpan, tetapi dokumen PDF belum selesai dibuat. " +
      "Muat ulang halaman ini untuk mencoba lagi.";
    return;
  }

  document.getElementById("f-status").replaceChildren(buatBadge(data.status));
  hasil.className = "alert alert-success mt-3 mb-0";
  hasil.textContent =
    "Surat disetujui dan ditandatangani. Dokumen PDF sudah dibuat dan surat diteruskan ke HRD.";
}