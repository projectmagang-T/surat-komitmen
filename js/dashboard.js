function buatSel(teks) {
  const td = document.createElement("td");
  td.textContent = teks;
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

async function muatDashboard() {
  const badan = document.getElementById("badan-tabel");

  const { data, error } = await db
    .from("surat")
    .select("id, nomor_surat, tanggal, nama_pekerja, nama_pekerjaan, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("Gagal memuat surat:", error.message);
    badan.replaceChildren(pesanTabel("Data gagal dimuat. Muat ulang halaman."));
    return;
  }

  const hitung = (s) => data.filter((x) => x.status === s).length;
  const isi = (id, nilai) => (document.getElementById(id).textContent = nilai);

  isi("angka-total", data.length);
  isi("angka-menunggu", hitung("MENUNGGU_KEPALA_PRODUKSI"));
  isi("angka-revisi", hitung("PERLU_REVISI"));
  isi("angka-ditolak", hitung("DITOLAK"));
  isi("angka-hrd", hitung("MENUNGGU_HRD"));
  isi("angka-selesai", hitung("SELESAI"));

  if (data.length === 0) {
    badan.replaceChildren(pesanTabel("Belum ada surat."));
    return;
  }

    const barisBaru = data.map((s) => {
    const tr = document.createElement("tr");
    const tdStatus = document.createElement("td");
    tdStatus.append(buatBadge(s.status));

    const tdAksi = document.createElement("td");
    const tautan = document.createElement("a");
    tautan.href = "detail-surat.html?id=" + encodeURIComponent(s.id);
    tautan.className = "btn btn-sm btn-outline-primary";
    tautan.textContent = "Detail";
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
  badan.replaceChildren(...barisBaru);
}

muatDashboard();