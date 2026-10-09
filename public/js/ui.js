// Jendela konfirmasi dan notifikasi kecil. Membutuhkan Bootstrap JS (bundle).

function elemenUi(tag, kelas, teks) {
  const e = document.createElement(tag);
  if (kelas) e.className = kelas;
  if (teks) e.textContent = teks;
  return e;
}

// Pemakaian: const lanjut = await konfirmasi({ judul, pesan, tombol, bahaya });
function konfirmasi({ judul = "Konfirmasi", pesan = "", tombol = "Lanjutkan", bahaya = false } = {}) {
  return new Promise((selesai) => {
    const wadah = elemenUi("div", "modal fade");
    wadah.tabIndex = -1;
    wadah.setAttribute("aria-hidden", "true");

    const judulEl = elemenUi("h2", "modal-title h5", judul);
    const tutupX = elemenUi("button", "btn-close");
    tutupX.type = "button";
    tutupX.setAttribute("data-bs-dismiss", "modal");
    tutupX.setAttribute("aria-label", "Tutup");

    const batal = elemenUi("button", "btn btn-outline-secondary", "Batal");
    batal.type = "button";
    batal.setAttribute("data-bs-dismiss", "modal");

    const ok = elemenUi("button", "btn " + (bahaya ? "btn-danger" : "btn-primary"), tombol);
    ok.type = "button";

    const kepala = elemenUi("div", "modal-header");
    kepala.append(judulEl, tutupX);
    const badan = elemenUi("div", "modal-body", pesan);
    const kaki = elemenUi("div", "modal-footer");
    kaki.append(batal, ok);

    const isi = elemenUi("div", "modal-content");
    isi.append(kepala, badan, kaki);
    const dialog = elemenUi("div", "modal-dialog modal-dialog-centered");
    dialog.append(isi);
    wadah.append(dialog);
    document.body.append(wadah);

    let hasil = false;
    const modal = new bootstrap.Modal(wadah);

    ok.addEventListener("click", () => {
      hasil = true;
      modal.hide();
    });
    // Fokus awal: pada tindakan berbahaya, tombol Batal yang terpilih lebih dulu
    wadah.addEventListener("shown.bs.modal", () => (bahaya ? batal : ok).focus());
    wadah.addEventListener("hidden.bs.modal", () => {
      wadah.remove();
      selesai(hasil);
    });

    modal.show();
  });
}

// Pemakaian: toast("Tersimpan"), toast("Gagal", "danger")
function toast(pesan, jenis = "success") {
  if (!["success", "danger", "warning", "info"].includes(jenis)) jenis = "info";

  let wadah = document.getElementById("wadah-toast");
  if (!wadah) {
    wadah = elemenUi("div", "toast-container position-fixed bottom-0 end-0 p-3");
    wadah.id = "wadah-toast";
    wadah.style.zIndex = "1100";
    document.body.append(wadah);
  }

  const t = elemenUi("div", "toast align-items-center border-0 text-bg-" + jenis);
  t.setAttribute("role", jenis === "danger" ? "alert" : "status");
  t.setAttribute("aria-live", jenis === "danger" ? "assertive" : "polite");
  t.setAttribute("aria-atomic", "true");

  const tutup = elemenUi("button", "btn-close btn-close-white me-2 m-auto");
  tutup.type = "button";
  tutup.setAttribute("data-bs-dismiss", "toast");
  tutup.setAttribute("aria-label", "Tutup");

  const baris = elemenUi("div", "d-flex");
  baris.append(elemenUi("div", "toast-body", pesan), tutup);
  t.append(baris);
  wadah.append(t);

  t.addEventListener("hidden.bs.toast", () => t.remove());
  new bootstrap.Toast(t, { delay: 4000 }).show();
}