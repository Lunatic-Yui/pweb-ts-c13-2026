(() => {
  const session = Auth.guard(false);
  if (!session) return;
  Auth.renderUserBar($("userBar"), session);

  const grid = $("screenGrid");
  const owner = Auth.owner();
  const clock = $("clock");
  const soundBtn = $<HTMLButtonElement>("soundBtn");
  const fsBtn = $<HTMLButtonElement>("fsBtn");

  let soundOn = false;
  let firstRun = true;
  const seen = new Map<string, string>();

  let audioCtx: AudioContext | undefined;
  function chime(): void {
    try {
      audioCtx ??= new AudioContext();
      const ctx = audioCtx;
      [880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime + i * 0.35;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.65);
      });
    } catch { /* AudioContext tidak tersedia */ }
  }

  function speak(text: string): void {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  function announce(types: QueueType[], tickets: Ticket[]): void {
    for (const t of types) {
      const cur = Store.current(t.id, tickets);
      const stamp = cur ? `${cur.id}@${cur.calledAt}` : "";
      if (!firstRun && soundOn && cur && stamp !== seen.get(t.id)) {
        chime();
        window.setTimeout(
          () => speak(`Nomor antrian ${cur.code} ${cur.number}, silakan menuju loket ${t.name}`), 800);
      }
      seen.set(t.id, stamp);
    }
    firstRun = false;
  }

  function card(t: QueueType, tickets: Ticket[]): HTMLElement {
    const cur = Store.current(t.id, tickets);
    const count = Store.waiting(t.id, tickets).length;
    const mine = Store.mine(owner, tickets).find((x) => x.typeId === t.id &&
      (x.status === "waiting" || x.status === "called"));
    const isCalled = mine?.status === "called";
    return h("article", { class: "card screen-card" + (isCalled ? " mine-called" : "") },
      h("div", { class: "screen-head" }, h("h2", {}, t.name), h("span", { class: "code-chip" }, t.code)),
      h("div", { class: "screen-body" },
        ...(cur
          ? [h("div", { class: "called-tag" }, "● DIPANGGIL"), h("div", { class: "huge-number" }, cur.label)]
          : [h("strong", {}, "Belum ada nomor dipanggil"),
             h("span", { class: "muted small" }, "Nomor akan muncul setelah operator memanggil tiket.")])),
      h("div", { class: "screen-foot" },
        `${count} tiket menunggu`,
        ...(mine ? [h("div", { class: "my-ticket" },
          isCalled ? `🔔 Tiket Anda ${mine.label} sedang dipanggil!` : `Tiket Anda: ${mine.label} (menunggu)`)] : [])));
  }

  let lastRender = "";
  function tick(): void {
    const types = Store.activeTypes();
    const tickets = Store.tickets();
    announce(types, tickets);

    const sig = Store.signature();
    if (sig !== lastRender) {
      lastRender = sig;
      grid.replaceChildren(...(types.length
        ? types.map((t) => card(t, tickets))
        : [h("p", { class: "muted" }, "Belum ada jenis antrian aktif.")]));
    }
    clock.textContent = clockText();
  }

  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? "🔊 Suara: Hidup" : "🔇 Suara: Mati";
    if (soundOn) speak("Suara panggilan antrian aktif");
    else if ("speechSynthesis" in window) speechSynthesis.cancel();
  });

  fsBtn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { toast("Browser tidak mengizinkan layar penuh."); }
  });
  document.addEventListener("fullscreenchange", () => {
    fsBtn.textContent = document.fullscreenElement ? "Keluar Layar Penuh" : "Layar Penuh";
  });

  tick();
  setInterval(tick, POLL_MS); 
  window.addEventListener("storage", tick);  
})();