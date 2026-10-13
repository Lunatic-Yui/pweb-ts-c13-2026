"use strict";
(() => {
    const session = Auth.guard(true);
    if (!session)
        return;
    Auth.renderUserBar($("userBar"), session);
    const grid = $("opGrid");
    function card(t) {
        const tickets = Store.tickets();
        const waiting = Store.waiting(t.id, tickets);
        const cur = Store.current(t.id, tickets);
        const next = waiting[0];
        const act = (fn) => () => { fn(t.id); render(); };
        return h("article", { class: "card op-card" }, h("div", { class: "op-head" }, h("h2", {}, t.name, t.active ? "" : h("span", { class: "badge badge-off" }, "Nonaktif")), h("span", { class: "muted small" }, `${waiting.length} menunggu`)), h("div", { class: "op-body" }, h("div", {}, h("div", { class: "label-cap" }, "Sedang dipanggil"), h("div", { class: "big-number current" }, cur ? cur.label : "-"), cur ? h("div", { class: "muted small" }, `Prioritas ${PRIORITY_LABEL[cur.priority]}`) : ""), h("div", {}, h("div", { class: "label-cap" }, "Berikutnya"), h("div", { class: "big-number" }, next ? next.label : "-"), next ? h("div", { class: "muted small" }, `Prioritas ${PRIORITY_LABEL[next.priority]}`) : "")), h("div", { class: "op-actions" }, h("button", { class: "btn btn-accent grow", disabled: !next && !cur ? true : !next,
            onclick: act(Store.callNext) }, "Panggil Berikutnya"), h("button", { class: "btn", disabled: !cur, onclick: act(Store.skip) }, "Lewati"), h("button", { class: "btn", disabled: !cur, onclick: act(Store.finish) }, "Selesai")), !next ? h("p", { class: "muted small" }, "Tidak ada tiket menunggu untuk jenis antrian ini.") : "");
    }
    function render() {
        const types = Store.types();
        grid.replaceChildren(...(types.length
            ? types.map(card)
            : [h("p", { class: "muted" }, "Belum ada jenis antrian. Tambahkan dari Dashboard Admin.")]));
    }
    render();
    let last = Store.signature();
    setInterval(() => {
        const now = Store.signature();
        if (now !== last) {
            last = now;
            render();
        }
    }, POLL_MS);
})();
