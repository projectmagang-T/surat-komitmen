function buatPapanTtd(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";

  let menggambar = false;
  let terakhir = null;
  let panjang = 0;

  function posisi(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    menggambar = true;
    terakhir = posisi(e);
    ctx.beginPath();
    ctx.moveTo(terakhir.x, terakhir.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!menggambar) return;
    const p = posisi(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    panjang += Math.hypot(p.x - terakhir.x, p.y - terakhir.y);
    terakhir = p;
  });

  const selesai = () => { menggambar = false; };
  canvas.addEventListener("pointerup", selesai);
  canvas.addEventListener("pointercancel", selesai);

  return {
    hapus() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      panjang = 0;
    },
    kosong() {
      return panjang < 40;
    },
    keDataUrl() {
      return canvas.toDataURL("image/png");
    },
  };
}