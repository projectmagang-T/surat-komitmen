const STATUS = {
  DRAFT: { label: "Draft", kelas: "text-bg-secondary" },
  MENUNGGU_KEPALA_PRODUKSI: { label: "Menunggu Kepala Produksi", kelas: "text-bg-warning" },
  PERLU_REVISI: { label: "Perlu Revisi", kelas: "text-white", warna: "#fd7e14" },
  DITOLAK: { label: "Ditolak", kelas: "text-bg-danger" },
  DISETUJUI_KEPALA_PRODUKSI: { label: "Disetujui Kepala Produksi", kelas: "text-bg-info" },
  MENUNGGU_HRD: { label: "Menunggu HRD", kelas: "text-bg-primary" },
  SELESAI: { label: "Selesai", kelas: "text-bg-success" },
};

function buatBadge(status) {
  const info = STATUS[status] || { label: status, kelas: "text-bg-secondary" };
  const el = document.createElement("span");
  el.className = "badge " + info.kelas;
  if (info.warna) el.style.backgroundColor = info.warna;
  el.textContent = info.label;
  return el;
}