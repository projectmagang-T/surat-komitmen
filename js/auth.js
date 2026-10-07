// Email akun Supervisor yang kamu buat di Supabase.
// Ini bukan rahasia, pengguna hanya mengetik PIN.
const EMAIL_SUPERVISOR = "supervisor@try.com";

function tampilPesan(teks) {
  document.getElementById("pesan").textContent = teks;
}

// ---- Halaman login ----
const formLogin = document.getElementById("form-login");

if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = document.getElementById("pin").value;
    const tombol = formLogin.querySelector("button");

    tampilPesan("");
    tombol.disabled = true;
    tombol.textContent = "Memeriksa...";

    const { error } = await db.auth.signInWithPassword({
      email: EMAIL_SUPERVISOR,
      password: pin,
    });

    if (error) {
        console.log("Error login:", error.status, error.message);
      tampilPesan(
        error.status === 429
          ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
          : "PIN salah. Silakan coba lagi."
      );
      tombol.disabled = false;
      tombol.textContent = "Masuk";
      return;
    }

    window.location.href = "dashboard.html";
  });
}

// ---- Halaman yang wajib login ----
if (document.body.hasAttribute("data-wajib-login")) {
  db.auth.getSession().then(({ data }) => {
    console.log("Sesi di dashboard:", data.session);
    if (!data.session) {
      window.location.href = "index.html";
      return;
    }
    document.getElementById("isi-halaman").classList.remove("d-none");
  });

  document.getElementById("tombol-keluar").addEventListener("click", async () => {
    await db.auth.signOut();
    window.location.href = "index.html";
  });
}