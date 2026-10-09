const BUCKET = "documents";

function formatWaktu(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
  }) + " WIB";
}

function tampilPesan(jenis, teks) {
  const kotak = document.getElementById("pesan");
  kotak.className = teks ? "alert alert-" + jenis : "";
  kotak.textContent = teks;
}

function buatSel(teks) {
  const td = document.createElement("td");
  td.textContent = teks ?? "-";
  return td;
}

function pesanTabel(teks) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 8;
  td.className = "text-center text-muted";
  td.textContent = teks;
  tr.append(td);
  return tr;
}

function dokumenFinal(surat) {
  return (surat.documents || []).find((d) => d.document_type === "FINAL");
}

function namaPenandatangan(surat, peran) {
  const t = (surat.signatures || []).find((x) => x.role === peran);
  return t ? t.nama_penandatangan : "-";
}

// Minta alamat sementara (60 detik) untuk file di bucket privat
async function ambilAlamat(path, namaUnduh) {
  const opsi = namaUnduh ? { download: namaUnduh } : undefined;
  const { data, error } = await db.storage
    .from(BUCKET)
    .createSignedUrl(path, 60, opsi);
  if (error || !data) return null;
  return data.signedUrl;
}

async function lihatPdf(surat) {
  tampilPesan("", "");
  const d = dokumenFinal(surat);
  if (!d) {
    tampilPesan("danger", "PDF final tidak ditemukan.");
    return;
  }
  // Buka tab dulu (saat klik), baru isi alamatnya, supaya tidak diblokir browser
  const jendela = window.open("about:blank", "_blank");
  if (jendela) jendela.opener = null;

  const alamat = await ambilAlamat(d.file_path);
  if (!alamat) {
    if (jendela) jendela.close();
    tampilPesan("danger", "PDF tidak dapat dibuka. Coba lagi.");
    return;
  }
  if (jendela) jendela.location.href = alamat;
  else window.location.href = alamat;
}

async function unduhPdf(surat) {
  tampilPesan("", "");
  const d = dokumenFinal(surat);
  if (!d) {
    tampilPesan("danger", "PDF final tidak ditemukan.");
    return;
  }
  const alamat = await ambilAlamat(d.file_path, d.file_name);
  if (!alamat) {
    tampilPesan("danger", "PDF tidak dapat diunduh. Coba lagi.");
    return;
  }
  window.location.href = alamat;
}

function buatTombol(teks, kelas, aksi) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn btn-sm " + kelas;
  b.textContent = teks;
  b.addEventListener("click", aksi);
  return b;
}

let semuaRiwayat = [];

function bulanSelesai(surat) {
  const d = dokumenFinal(surat);
  if (!d) return "";
  // "sv-SE" menghasilkan format YYYY-MM-DD, dihitung menurut waktu Jakarta
  return new Date(d.created_at)
    .toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" })
    .slice(0, 7);
}

function namaBulan(kode) {
  const [t, b] = kode.split("-").map(Number);
  return new Date(t, b - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function isiPilihanBulan() {
  const pilih = document.getElementById("filter-bulan");
  const kode = [...new Set(semuaRiwayat.map(bulanSelesai).filter(Boolean))].sort().reverse();
  const semua = document.createElement("option");
  semua.value = "";
  semua.textContent = "Semua bulan";
  const opsi = kode.map((k) => {
    const o = document.createElement("option");
    o.value = k;
    o.textContent = namaBulan(k);
    return o;
  });
  pilih.replaceChildren(semua, ...opsi);
}

function cocokKata(s, kata) {
  if (!kata) return true;
  return [
    s.nomor_surat, s.nama_supervisor, s.nama_pekerja,
    namaPenandatangan(s, "KEPALA_PRODUKSI"), namaPenandatangan(s, "HRD"),
  ].some((v) => String(v ?? "").toLowerCase().includes(kata));
}

function tampilkanRiwayat() {
  const badan = document.getElementById("badan-tabel");
  const kata = document.getElementById("cari").value.trim().toLowerCase();
  const bulan = document.getElementById("filter-bulan").value;

  const hasil = semuaRiwayat.filter(
    (s) => cocokKata(s, kata) && (!bulan || bulanSelesai(s) === bulan)
  );

  document.getElementById("info-jumlah").textContent =
    "(" + hasil.length + " dari " + semuaRiwayat.length + ")";

  if (semuaRiwayat.length === 0) {
    badan.replaceChildren(pesanTabel("Belum ada surat yang selesai."));
    return;
  }
  if (hasil.length === 0) {
    badan.replaceChildren(pesanTabel("Tidak ada surat yang cocok dengan pencarian."));
    return;
  }

  const baris = hasil.map((s) => {
    const tr = document.createElement("tr");
    const final = dokumenFinal(s);

    const tdStatus = document.createElement("td");
    tdStatus.append(buatBadge(s.status));

    const tautan = document.createElement("a");
    tautan.href = "detail-surat.html?id=" + encodeURIComponent(s.id);
    tautan.className = "btn btn-sm btn-outline-primary";
    tautan.textContent = "Detail";

    const tdAksi = document.createElement("td");
    tdAksi.className = "text-nowrap";
    tdAksi.append(
      tautan, " ",
      buatTombol("Lihat PDF", "btn-outline-success", () => lihatPdf(s)), " ",
      buatTombol("Unduh PDF", "btn-outline-secondary", () => unduhPdf(s))
    );

    tr.append(
      buatSel(s.nomor_surat),
      buatSel(s.nama_supervisor),
      buatSel(s.tanggal),
      tdStatus,
      buatSel(namaPenandatangan(s, "KEPALA_PRODUKSI")),
      buatSel(namaPenandatangan(s, "HRD")),
      buatSel(final ? formatWaktu(final.created_at) : "-"),
      tdAksi
    );
    return tr;
  });

  badan.replaceChildren(...baris);
}

async function muatRiwayat() {
  const badan = document.getElementById("badan-tabel");

  const { data, error } = await db
    .from("surat")
    .select(
      "id, nomor_surat, nama_supervisor, nama_pekerja, tanggal, status, updated_at, " +
      "signatures(role, nama_penandatangan), " +
      "documents(document_type, file_path, file_name, created_at)"
    )
    .eq("status", "SELESAI")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.log("Gagal memuat riwayat:", error.message);
    badan.replaceChildren(pesanTabel("Data gagal dimuat. Muat ulang halaman."));
    return;
  }

  semuaRiwayat = data;
  isiPilihanBulan();
  tampilkanRiwayat();
}

document.getElementById("cari").addEventListener("input", tampilkanRiwayat);
document.getElementById("filter-bulan").addEventListener("change", tampilkanRiwayat);
document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("cari").value = "";
  document.getElementById("filter-bulan").value = "";
  tampilkanRiwayat();
});

muatRiwayat();