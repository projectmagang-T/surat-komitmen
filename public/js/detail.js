const idSurat = new URLSearchParams(window.location.search).get("id") || "";
let suratSaatIni = null;

const KOLOM =
  "id, nomor_surat, tanggal, nama_supervisor, departemen, nama_pekerjaan, " +
  "nama_pekerja, periode_kerja, kesalahan_pekerja, isi_komitmen, keterangan, status";

const NAMA_PERAN = { KEPALA_PRODUKSI: "Kepala Produksi", HRD: "HRD" };
const NAMA_KEPUTUSAN = { SETUJU: "Disetujui", REVISI: "Minta revisi", TOLAK: "Ditolak" };

function teksDi(id, teks) {
  document.getElementById(id).textContent = teks ?? "-";
}

function formatWaktu(iso) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function nilaiForm(id) {
  return document.getElementById(id).value.trim();
}

async function muatDetail() {
  const { data: surat, error } = await db
    .from("surat")
    .select(KOLOM)
    .eq("id", idSurat)
    .maybeSingle();

  if (error || !surat) {
    document.getElementById("kotak-surat").classList.add("d-none");
    document.getElementById("kotak-error").classList.remove("d-none");
    return;
  }
  suratSaatIni = surat;

  teksDi("d-nomor", surat.nomor_surat);
  teksDi("d-tanggal", surat.tanggal);
  teksDi("d-supervisor", surat.nama_supervisor);
  teksDi("d-departemen", surat.departemen);
  teksDi("d-pekerja", surat.nama_pekerja);
  teksDi("d-pekerjaan", surat.nama_pekerjaan);
  teksDi("d-periode", surat.periode_kerja);
  teksDi("d-kesalahan", surat.kesalahan_pekerja);
  teksDi("d-komitmen", surat.isi_komitmen);
  teksDi("d-keterangan", surat.keterangan);
  document.getElementById("d-status").replaceChildren(buatBadge(surat.status));

  const { data: riwayat } = await db
    .from("approvals")
    .select("role, status, catatan, nama_penandatangan, created_at")
    .eq("surat_id", idSurat)
    .order("created_at", { ascending: false });

  tampilkanRiwayat(riwayat || []);
  tampilkanAlasan(surat.status, riwayat || []);

  document
    .getElementById("kotak-edit-tombol")
    .classList.toggle("d-none", surat.status !== "PERLU_REVISI");
  document.getElementById("form-edit").classList.add("d-none");
  document.getElementById("kotak-error").classList.add("d-none");
  document.getElementById("kotak-surat").classList.remove("d-none");
}

function tampilkanAlasan(status, riwayat) {
  const kotak = document.getElementById("kotak-alasan");
  const terakhir = riwayat.find((r) => r.status === "REVISI" || r.status === "TOLAK");

  if (!terakhir || (status !== "PERLU_REVISI" && status !== "DITOLAK")) {
    kotak.className = "alert d-none";
    kotak.replaceChildren();
    return;
  }

  const judul = document.createElement("div");
  judul.className = "fw-semibold";
  judul.textContent =
    (terakhir.status === "REVISI" ? "Permintaan revisi" : "Surat ditolak") +
    " oleh " + terakhir.nama_penandatangan +
    " (" + (NAMA_PERAN[terakhir.role] || terakhir.role) + ")" +
    " pada " + formatWaktu(terakhir.created_at);

  const isi = document.createElement("div");
  isi.style.whiteSpace = "pre-wrap";
  isi.textContent = terakhir.catatan;

  kotak.className = "alert " + (terakhir.status === "REVISI" ? "alert-warning" : "alert-danger");
  kotak.replaceChildren(judul, isi);
}

function tampilkanRiwayat(riwayat) {
  const daftar = document.getElementById("daftar-riwayat");

  if (riwayat.length === 0) {
    const li = document.createElement("li");
    li.className = "list-group-item text-muted";
    li.textContent = "Belum ada keputusan.";
    daftar.replaceChildren(li);
    return;
  }

  const item = riwayat.map((r) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.style.whiteSpace = "pre-wrap";
    li.textContent =
      formatWaktu(r.created_at) + " - " +
      (NAMA_KEPUTUSAN[r.status] || r.status) + " oleh " + r.nama_penandatangan +
      " (" + (NAMA_PERAN[r.role] || r.role) + ")" +
      (r.catatan ? ": " + r.catatan : "");
    return li;
  });
  daftar.replaceChildren(...item);
}

const KOLOM_EDIT = [
  "nama_supervisor", "departemen", "nama_pekerja", "nama_pekerjaan",
  "periode_kerja", "kesalahan_pekerja", "isi_komitmen", "keterangan",
];

document.getElementById("btn-edit").addEventListener("click", () => {
  KOLOM_EDIT.forEach((k) => {
    document.getElementById("e-" + k).value = suratSaatIni[k] ?? "";
  });
  document.getElementById("pesan").className = "";
  document.getElementById("pesan").textContent = "";
  document.getElementById("kotak-edit-tombol").classList.add("d-none");
  document.getElementById("form-edit").classList.remove("d-none");
});

document.getElementById("btn-batal-edit").addEventListener("click", () => {
  document.getElementById("form-edit").classList.add("d-none");
  document.getElementById("kotak-edit-tombol").classList.remove("d-none");
});

document.getElementById("form-edit").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tombol = document.getElementById("btn-kirim-ulang");
  const dataBaru = {};
  KOLOM_EDIT.forEach((k) => (dataBaru[k] = nilaiForm("e-" + k)));
  dataBaru.keterangan = dataBaru.keterangan || null;

  const masalah = periksaData({ ...dataBaru, tanggal: suratSaatIni.tanggal });
  if (masalah) {
    tampilkanHasil("warning", masalah);
    return;
  }

  tombol.disabled = true;
  tombol.textContent = "Mengirim...";

  const { data: hasilUpdate, error } = await db
    .from("surat")
    .update({ ...dataBaru, status: "MENUNGGU_KEPALA_PRODUKSI" })
    .eq("id", idSurat)
    .select("id");

  tombol.disabled = false;
  tombol.textContent = "Kirim Ulang";

  if (error || !hasilUpdate || hasilUpdate.length === 0) {
    console.log("Gagal kirim ulang:", error ? error.message : "tidak ada baris berubah");
    tampilkanHasil("danger", "Surat tidak dapat dikirim ulang. Mungkin statusnya sudah berubah.");
    return;
  }

  const hasil = document.getElementById("hasil");
  hasil.className = "alert alert-success";
  hasil.textContent = "Surat berhasil diperbaiki dan dikirim ulang ke Kepala Produksi.";
  await muatDetail();
});

muatDetail();