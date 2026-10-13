(() => {
  const session = Auth.guard(true);
  if (!session) return;
  Auth.renderUserBar($("userBar"), session);

  const typeForm = $<HTMLFormElement>("typeForm");
  const codeInput = $<HTMLInputElement>("typeCode");
  const nameInput = $<HTMLInputElement>("typeName");
  const typeError = $("typeError");
  const typeList = $("typeList");
  const issueForm = $<HTMLFormElement>("issueForm");
  const issueType = $<HTMLSelectElement>("issueType");
  const issuePriority = $<HTMLSelectElement>("issuePriority");
  const issueBtn = $<HTMLButtonElement>("issueBtn");
  const ticketList = $("ticketList");
  const statsBox = $("stats");

  codeInput.addEventListener("input", () => (codeInput.value = codeInput.value.toUpperCase()));

  function renderTypes(): void {
    const types = Store.types();
    const tickets = Store.tickets();
    if (types.length === 0) {
      typeList.replaceChildren(h("li", { class: "empty" }, "Belum ada jenis antrian."));
      return;
    }
    typeList.replaceChildren(...types.map((t) =>
      h("li", { class: "type-row" + (t.active ? "" : " inactive") },
        h("div", {},
          h("strong", {}, t.name), " ", h("span", { class: "muted" }, `(${t.code})`),
          t.active ? "" : h("span", { class: "badge badge-off" }, "Nonaktif"),
          h("div", { class: "muted small" }, `${Store.waiting(t.id, tickets).length} menunggu`)),
        h("div", { class: "row-actions" },
          h("button", { class: "btn btn-sm", onclick: () => { Store.toggleType(t.id); refresh(); } },
            t.active ? "Nonaktifkan" : "Aktifkan"),
          h("button", { class: "btn btn-sm btn-danger-outline", onclick: () => {
            if (confirm(`Hapus jenis antrian "${t.name}" beserta semua tiketnya?`)) {
              Store.removeType(t.id); refresh();
            }
          } }, "Hapus")),
      )));
  }

  let issueSig = "";
  function syncSelect(): void {
    const active = Store.activeTypes();
    const sig = active.map((t) => t.id + t.name).join("|");
    if (sig === issueSig) return; 
    issueSig = sig;
    const prev = issueType.value;
    issueType.replaceChildren(
      ...(active.length
        ? active.map((t) => h("option", { value: t.id }, `${t.name} (${t.code})`))
        : [h("option", { value: "" }, "Tidak ada jenis aktif")]));
    if (active.some((t) => t.id === prev)) issueType.value = prev;
    issueBtn.disabled = active.length === 0;
  }

  function renderTickets(): void {
    const tickets = Store.tickets();
    const groups = Store.types().map((t) => {
      const list = tickets.filter((x) => x.typeId === t.id).sort((a, b) => b.number - a.number);
      return h("div", { class: "ticket-group" },
        h("div", { class: "group-title" }, t.name),
        ...(list.length
          ? list.map((x) => h("div", { class: `ticket-row st-${x.status}` },
              h("strong", {}, x.label),
              h("span", { class: `badge prio-${x.priority}` }, PRIORITY_LABEL[x.priority]),
              h("span", { class: `badge st-badge-${x.status}` }, STATUS_LABEL[x.status])))
          : [h("div", { class: "muted small pad" }, "Belum ada tiket.")]));
    });
    ticketList.replaceChildren(...groups);
  }

  function renderStats(): void {
    const s = Store.stats();
    const box = (label: string, value: string) =>
      h("div", { class: "stat" }, h("div", { class: "stat-value" }, value), h("div", { class: "muted small" }, label));
    statsBox.replaceChildren(
      box("Total tiket", String(s.total)), box("Menunggu", String(s.waiting)),
      box("Dipanggil", String(s.called)), box("Selesai", String(s.done)),
      box("Dilewati", String(s.skipped)),
      box("Rata-rata waktu layanan", s.avgMs === null ? "-" : formatDuration(s.avgMs)));
  }

  function refresh(): void { renderStats(); renderTypes(); syncSelect(); renderTickets(); }

  typeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = Store.addType(codeInput.value, nameInput.value);
    typeError.hidden = err === null;
    if (err) { typeError.textContent = err; return; }
    codeInput.value = ""; nameInput.value = "";
    toast("Jenis antrian ditambahkan");
    refresh();
  });

  issueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = Store.issue(issueType.value, issuePriority.value as Priority);
    if (!t) { toast("Pilih jenis antrian yang aktif."); return; }
    toast(`Tiket ${t.label} (${PRIORITY_LABEL[t.priority]}) diterbitkan`);
    refresh();
  });

  $("resetBtn").addEventListener("click", () => {
    if (confirm("Kosongkan semua antrian aktif dan mulai penomoran dari awal?")) {
      Store.reset(); toast("Antrian berhasil di-reset"); refresh();
    }
  });

  refresh();
  let last = Store.signature();
  setInterval(() => {
    const now = Store.signature();
    if (now !== last) { last = now; refresh(); }
  }, POLL_MS);
})();