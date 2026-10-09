const formSurat = document.getElementById("form-surat");

function tampilkanHasil(jenis, teks) {
  const kotak = document.getElementById("pesan");
  kotak.className = "alert alert-" + jenis;
  kotak.textContent = teks;
}

const ATURAN = [
  ["nama_supervisor", "Nama supervisor", 100],
  ["departemen", "Departemen", 100],
  ["nama_pekerja", "Nama pekerja", 100],
  ["nama_pekerjaan", "Nama pekerjaan / kegiatan", 200],
  ["periode_kerja", "Periode kerja", 100],
  ["kesalahan_pekerja", "Kesalahan pekerja", 2000],
  ["isi_komitmen", "Isi komitmen", 2000],
];

function periksaData(d) {
  if (!d.tanggal) return "Tanggal surat wajib diisi.";
  if (d.tanggal < "2020-01-01" || d.tanggal > "2099-12-31") {
    return "Tanggal surat tidak masuk akal.";
  }
  for (const [kolom, label, maks] of ATURAN) {
    if (!d[kolom]) return label + " wajib diisi.";
    if (d[kolom].length > maks) return label + " maksimal " + maks + " karakter.";
  }
  if (d.keterangan && d.keterangan.length > 1000) {
    return "Keterangan maksimal 1000 karakter.";
  }
  return null;
}

if (formSurat) {
  formSurat.addEventListener("submit", async (e) => {
    e.preventDefault();

    const tombol = formSurat.querySelector("button[type='submit']");
    tombol.disabled = true;
    tombol.textContent = "Menyimpan...";

    // id akun diambil dari sesi, bukan dari isian form
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const ambil = (id) => document.getElementById(id).value.trim();

    const dataSurat = {
      supervisor_id: user.id,
      nama_supervisor: ambil("nama_supervisor"),
      tanggal: ambil("tanggal"),
      departemen: ambil("departemen"),
      nama_pekerjaan: ambil("nama_pekerjaan"),
      nama_pekerja: ambil("nama_pekerja"),
      periode_kerja: ambil("periode_kerja"),
      kesalahan_pekerja: ambil("kesalahan_pekerja"),
      isi_komitmen: ambil("isi_komitmen"),
      keterangan: ambil("keterangan") || null,
      status: "MENUNGGU_KEPALA_PRODUKSI",
    };

    const masalah = periksaData(dataSurat);
    if (masalah) {
      tampilkanHasil("warning", masalah);
      tombol.disabled = false;
      tombol.textContent = "Simpan & Kirim";
      return;
    }

    const { data, error } = await db
      .from("surat")
      .insert(dataSurat)
      .select("nomor_surat")
      .single();

    if (error) {
      console.log("Gagal menyimpan surat:", error.message);
      tampilkanHasil("danger", "Surat gagal disimpan. Silakan coba lagi.");
      tombol.disabled = false;
      tombol.textContent = "Simpan & Kirim";
      return;
    }

    document.getElementById("pesan").className = "";
    document.getElementById("pesan").textContent = "";
    toast("Surat berhasil dibuat. Nomor: " + data.nomor_surat);
    formSurat.reset();
    tombol.disabled = false;
    tombol.textContent = "Simpan & Kirim";
  });
}