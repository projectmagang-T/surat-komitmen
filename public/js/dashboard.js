const WARNA_GRAFIK = {
  DRAFT: "#6c757d",
  MENUNGGU_KEPALA_PRODUKSI: "#ffc107",
  PERLU_REVISI: "#fd7e14",
  DITOLAK: "#dc3545",
  DISETUJUI_KEPALA_PRODUKSI: "#0dcaf0",
  MENUNGGU_HRD: "#0d6efd",
  SELESAI: "#198754",
};

const filter = { kata: "", status: "" };
let semuaSurat = [];
let grafikStatus = null;
let grafikBulan = null;

function buatSel(teks) {
  const td = document.createElement("td");
  td.textContent = teks ?? "-";
  return td;
}

function pesanTabel(teks) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 6;
  td.className = "text-center text-muted";
  td.textContent = teks;
  tr.append(td);
  return tr;
}

function isiAngka(id, nilai) {
  document.getElementById(id).textContent = nilai;
}

// ---------- Kartu: selalu menghitung SEMUA surat ----------
function hitungKartu() {
  const hitung = (s) => semuaSurat.filter((x) => x.status === s).length;
  isiAngka("angka-total", semuaSurat.length);
  isiAngka("angka-menunggu", hitung("MENUNGGU_KEPALA_PRODUKSI"));
  isiAngka("angka-revisi", hitung("PERLU_REVISI"));
  isiAngka("angka-ditolak", hitung("DITOLAK"));
  isiAngka("angka-hrd", hitung("MENUNGGU_HRD"));
  isiAngka("angka-selesai", hitung("SELESAI"));
}

// ---------- Tabel: pencarian dan filter status ----------
function cocokKata(s, kata) {
  if (!kata) return true;
  return [s.nomor_surat, s.nama_supervisor, s.departemen, s.nama_pekerja, s.nama_pekerjaan]
    .some((v) => String(v ?? "").toLowerCase().includes(kata));
}

function tampilkanTabel() {
  const badan = document.getElementById("badan-tabel");
  const kata = filter.kata.trim().toLowerCase();

  const hasil = semuaSurat.filter(
    (s) => (!filter.status || s.status === filter.status) && cocokKata(s, kata)
  );

  document.getElementById("info-jumlah").textContent =
    "(" + hasil.length + " dari " + semuaSurat.length + ")";

  if (semuaSurat.length === 0) {
    badan.replaceChildren(pesanTabel("Belum ada surat."));
    return;
  }
  if (hasil.length === 0) {
    badan.replaceChildren(pesanTabel("Tidak ada surat yang cocok dengan pencarian."));
    return;
  }

  const baris = hasil.map((s) => {
    const tr = document.createElement("tr");

    const tdStatus = document.createElement("td");
    tdStatus.append(buatBadge(s.status));

    const tautan = document.createElement("a");
    tautan.href = "detail-surat.html?id=" + encodeURIComponent(s.id);
    tautan.className = "btn btn-sm btn-outline-primary";
    tautan.textContent = "Detail";
    const tdAksi = document.createElement("td");
    tdAksi.append(tautan);

    tr.append(
      buatSel(s.nomor_surat),
      buatSel(s.tanggal),
      buatSel(s.nama_pekerja),
      buatSel(s.nama_pekerjaan),
      tdStatus,
      tdAksi
    );
    return tr;
  });
  badan.replaceChildren(...baris);
}

function setStatus(nilai) {
  filter.status = nilai;
  document.getElementById("filter-status").value = nilai;
  document.querySelectorAll(".kartu-status").forEach((k) => {
    const aktif = k.dataset.status === nilai;
    k.classList.toggle("border-primary", aktif);
    k.classList.toggle("border-2", aktif);
  });
  tampilkanTabel();
}

function isiPilihanStatus() {
  const pilih = document.getElementById("filter-status");
  Object.entries(STATUS).forEach(([kode, info]) => {
    const o = document.createElement("option");
    o.value = kode;
    o.textContent = info.label;
    pilih.append(o);
  });
}

// ---------- Grafik: terpengaruh pilihan periode ----------
function dalamPeriode(s, hari) {
  if (hari === "all") return true;
  const batas = new Date();
  batas.setHours(0, 0, 0, 0);
  batas.setDate(batas.getDate() - Number(hari));
  return new Date(s.tanggal + "T00:00:00") >= batas;
}

function daftarBulanLengkap(kunci) {
  // kunci: ["2026-08", "2026-10"] -> ["2026-08", "2026-09", "2026-10"]
  if (kunci.length === 0) return [];
  const urut = [...kunci].sort();
  let [t, b] = urut[0].split("-").map(Number);
  const [tAkhir, bAkhir] = urut[urut.length - 1].split("-").map(Number);
  const hasil = [];
  while (t < tAkhir || (t === tAkhir && b <= bAkhir)) {
    hasil.push(t + "-" + String(b).padStart(2, "0"));
    b++;
    if (b > 12) { b = 1; t++; }
  }
  return hasil;
}

function gambarGrafik() {
  const hari = document.getElementById("filter-periode").value;
  const data = semuaSurat.filter((s) => dalamPeriode(s, hari));

  if (grafikStatus) grafikStatus.destroy();
  if (grafikBulan) grafikBulan.destroy();
  grafikStatus = null;
  grafikBulan = null;

  const kosong = data.length === 0;
  document.getElementById("kosong-grafik").classList.toggle("d-none", !kosong);
  document.getElementById("area-grafik").classList.toggle("d-none", kosong);
  if (kosong) return;

  // Donat: jumlah per status
  const hitungStatus = {};
  data.forEach((s) => { hitungStatus[s.status] = (hitungStatus[s.status] || 0) + 1; });
  const kodeStatus = Object.keys(STATUS).filter((k) => hitungStatus[k]);

  grafikStatus = new Chart(document.getElementById("grafik-status"), {
    type: "doughnut",
    data: {
      labels: kodeStatus.map((k) => STATUS[k].label),
      datasets: [{
        data: kodeStatus.map((k) => hitungStatus[k]),
        backgroundColor: kodeStatus.map((k) => WARNA_GRAFIK[k] || "#6c757d"),
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // Batang: jumlah per bulan
  const perBulan = {};
  data.forEach((s) => {
    const b = s.tanggal.slice(0, 7);
    perBulan[b] = perBulan[b] || { semua: 0, selesai: 0 };
    perBulan[b].semua++;
    if (s.status === "SELESAI") perBulan[b].selesai++;
  });
  const bulan = daftarBulanLengkap(Object.keys(perBulan));
  const label = bulan.map((k) => {
    const [t, b] = k.split("-").map(Number);
    return new Date(t, b - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  });

  grafikBulan = new Chart(document.getElementById("grafik-bulan"), {
    type: "bar",
    data: {
      labels: label,
      datasets: [
        { label: "Semua surat", data: bulan.map((k) => (perBulan[k] ? perBulan[k].semua : 0)), backgroundColor: "#0d6efd" },
        { label: "Selesai", data: bulan.map((k) => (perBulan[k] ? perBulan[k].selesai : 0)), backgroundColor: "#198754" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// ---------- Memuat data ----------
async function muatDashboard() {
  const { data, error } = await db
    .from("surat")
    .select("id, nomor_surat, tanggal, nama_supervisor, departemen, nama_pekerja, nama_pekerjaan, status")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.log("Gagal memuat surat:", error.message);
    document.getElementById("badan-tabel").replaceChildren(
      pesanTabel("Data gagal dimuat. Muat ulang halaman.")
    );
    return;
  }

  semuaSurat = data;
  hitungKartu();
  const awal = new URLSearchParams(window.location.search).get("status") || "";
  setStatus(Object.keys(STATUS).includes(awal) ? awal : "");
  gambarGrafik();
}

// ---------- Pemasangan kejadian ----------
isiPilihanStatus();

document.getElementById("cari").addEventListener("input", (e) => {
  filter.kata = e.target.value;
  tampilkanTabel();
});
document.getElementById("filter-status").addEventListener("change", (e) => setStatus(e.target.value));
document.querySelectorAll(".kartu-status").forEach((k) => {
  k.addEventListener("click", () => setStatus(k.dataset.status));
});
document.getElementById("filter-periode").addEventListener("change", gambarGrafik);
document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("cari").value = "";
  filter.kata = "";
  setStatus("");
});

muatDashboard();