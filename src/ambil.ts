(() => {
  const session = Auth.guard(false);
  if (!session) return;
  Auth.renderUserBar($("userBar"), session);

  const grid = $("pickGrid");
  const history = $("history");
  const owner = Auth.owner();
  const result = $("result");
  const clock = $("clock");
  const prios: Priority[] = ["lansia", "disabilitas", "vip"];

  function take(t: QueueType, priority: Priority): void {
    const ticket = Store.issue(t.id, priority, owner);
    if (!ticket) { toast("Jenis antrian ini sedang nonaktif."); render(); return; }
    const ahead = Store.waiting(t.id).filter((x) => x.id !== ticket.id &&
      byQueueOrder(x, ticket) < 0).length;
    result.hidden = false;
    result.replaceChildren(
      h("div", { class: "label-cap" }, "Nomor antrian Anda"),
      h("div", { class: "huge-number" }, ticket.label),
      h("div", { class: "muted" }, `${t.name} · Prioritas ${PRIORITY_LABEL[priority]}`),
      h("div", { class: "muted small" }, `Antrian di depan Anda: ${ahead}`),
      h("div", { class: "muted small" }, `Estimasi waktu tunggu: ${formatDuration(Store.estimateWaitMs(t.id, ahead))}`),
      h("button", { class: "btn btn-sm", onclick: () => { result.hidden = true; } }, "Tutup"));
    toast(`Tiket ${ticket.label} berhasil diambil`);
    render();
  }

  function card(t: QueueType): HTMLElement {
    const waiting = Store.waiting(t.id).length;
    return h("article", { class: "card pick-card" },
      h("div", { class: "screen-head" },
        h("h2", {}, t.name), h("span", { class: "code-chip" }, t.code)),
      h("div", { class: "muted small" },
        `${waiting} menunggu · estimasi ±${formatDuration(Store.estimateWaitMs(t.id, waiting))}`),
      h("button", { class: "btn btn-accent btn-block", onclick: () => take(t, "normal") }, "Ambil Nomor"),
      h("details", {},
        h("summary", {}, "Ambil dengan prioritas"),
        h("div", { class: "prio-buttons" },
          ...prios.map((p) => h("button", { class: "btn btn-sm", onclick: () => take(t, p) }, PRIORITY_LABEL[p])))));
  }

  function renderHistory(): void {
    const all = Store.tickets();
    const mine = Store.mine(owner, all);
    if (mine.length === 0) {
      history.replaceChildren(h("p", { class: "muted small" }, "Anda belum mengambil tiket."));
      return;
    }
    history.replaceChildren(...mine.map((x) => {
      let info = "";
      if (x.status === "waiting") {
        const ahead = Store.waiting(x.typeId, all).filter((w) => byQueueOrder(w, x) < 0).length;
        info = `${ahead} di depan · estimasi ±${formatDuration(Store.estimateWaitMs(x.typeId, ahead, all))}`;
      } else if (x.status === "called") info = "Silakan menuju loket!";
      return h("div", { class: `ticket-row st-${x.status}` },
        h("strong", {}, x.label),
        h("span", { class: `badge prio-${x.priority}` }, PRIORITY_LABEL[x.priority]),
        h("span", { class: `badge st-badge-${x.status}` }, STATUS_LABEL[x.status]),
        h("span", { class: "muted small" }, info));
    }));
  }

  let lastSig = "";
  function render(force = false): void {
    const types = Store.activeTypes();
    renderHistory();
    const sig = Store.signature();
    if (!force && sig === lastSig) return;
    lastSig = sig;
    grid.replaceChildren(...(types.length
      ? types.map(card)
      : [h("p", { class: "muted" }, "Belum ada jenis antrian yang aktif.")]));
  }

  render(true);
  setInterval(() => { render(); clock.textContent = clockText(); }, POLL_MS);
  window.addEventListener("storage", () => render());
})();