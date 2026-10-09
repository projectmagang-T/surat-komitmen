(function () {
  const NAMA_SISTEM = "Surat Komitmen Kerja";

  const MENU = [
    { kode: "dashboard", teks: "Dashboard", ikon: "bi-speedometer2", href: "dashboard.html" },
    { kode: "buat", teks: "Buat Surat", ikon: "bi-plus-circle", href: "buat-surat.html" },
    { pembatas: "Pantau surat" },
    { kode: "status:MENUNGGU_KEPALA_PRODUKSI", teks: "Surat Menunggu", ikon: "bi-hourglass-split", href: "dashboard.html?status=MENUNGGU_KEPALA_PRODUKSI" },
    { kode: "status:PERLU_REVISI", teks: "Perlu Revisi", ikon: "bi-pencil-square", href: "dashboard.html?status=PERLU_REVISI" },
    { kode: "status:DITOLAK", teks: "Ditolak", ikon: "bi-x-circle", href: "dashboard.html?status=DITOLAK" },
    { kode: "status:MENUNGGU_HRD", teks: "Menunggu HRD", ikon: "bi-person-check", href: "dashboard.html?status=MENUNGGU_HRD" },
    { pembatas: "Arsip" },
    { kode: "riwayat", teks: "Riwayat Surat", ikon: "bi-clock-history", href: "riwayat.html" },
  ];

  const isi = document.getElementById("isi-halaman");
  if (!isi) return;

  const body = document.body;
  const judul = body.dataset.judul || "";
  let aktif = body.dataset.menu || "";

  // Di dashboard, menu status ikut tersorot sesuai alamat (?status=...)
  const dariUrl = new URLSearchParams(window.location.search).get("status");
  if (aktif === "dashboard" && dariUrl && MENU.some((m) => m.kode === "status:" + dariUrl)) {
    aktif = "status:" + dariUrl;
  }

  function el(tag, kelas, teks) {
    const e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks) e.textContent = teks;
    return e;
  }
  function ikon(nama) {
    const i = el("i", "bi " + nama);
    i.setAttribute("aria-hidden", "true");
    return i;
  }

  // ----- Sidebar -----
  const sidebar = el("aside", "sidebar");
  sidebar.id = "sidebar";
  sidebar.setAttribute("aria-label", "Menu utama");

  const merek = el("div", "merek");
  merek.append(ikon("bi-file-earmark-text"), el("span", "", NAMA_SISTEM));

  const nav = el("nav");
  MENU.forEach((m) => {
    if (m.pembatas) {
      nav.append(el("div", "pembatas", m.pembatas));
      return;
    }
    const a = el("a", "menu" + (m.kode === aktif ? " aktif" : ""));
    a.href = m.href;
    if (m.kode === aktif) a.setAttribute("aria-current", "page");
    a.append(ikon(m.ikon), el("span", "", m.teks));
    nav.append(a);
  });

  const bawah = el("div", "bawah");
  const keluar = el("button", "menu");
  keluar.type = "button";
  keluar.id = "tombol-keluar"; // dipakai oleh js/auth.js
  keluar.append(ikon("bi-box-arrow-left"), el("span", "", "Keluar"));
  bawah.append(keluar);

  sidebar.append(merek, nav, bawah);

  // ----- Topbar -----
  const burger = el("button", "btn btn-outline-secondary btn-sm d-lg-none");
  burger.type = "button";
  burger.setAttribute("aria-label", "Buka menu");
  burger.setAttribute("aria-controls", "sidebar");
  burger.setAttribute("aria-expanded", "false");
  burger.append(ikon("bi-list"));

  const topbar = el("header", "topbar");
  topbar.append(
    burger,
    el("h1", "h5 mb-0", judul),
    el("span", "ms-auto text-muted small d-none d-sm-inline", "Supervisor")
  );

  // ----- Susun halaman -----
  const lapisan = el("div", "lapisan");
  const konten = el("main", "konten");
  konten.append(isi);
  const utama = el("div", "utama");
  utama.append(topbar, konten);

  const layout = el("div", "layout");
  layout.append(sidebar, lapisan, utama);
  body.insertBefore(layout, body.firstChild);

  // ----- Buka dan tutup menu di layar kecil -----
  function buka() {
    sidebar.classList.add("terbuka");
    lapisan.classList.add("tampil");
    burger.setAttribute("aria-expanded", "true");
  }
  function tutup() {
    sidebar.classList.remove("terbuka");
    lapisan.classList.remove("tampil");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", () => {
    if (sidebar.classList.contains("terbuka")) tutup();
    else buka();
  });
  lapisan.addEventListener("click", tutup);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tutup();
  });

  document.title = judul ? judul + " - " + NAMA_SISTEM : NAMA_SISTEM;
})();