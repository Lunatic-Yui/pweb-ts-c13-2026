"use strict";
const API_BASE = "https://dummyjson.com";
const POLL_MS = 2000;
const DEFAULT_SERVICE_MS = 3 * 60 * 1000;
const KEY = {
    token: "token",
    role: "role",
    firstName: "firstName",
    username: "username",
    theme: "theme",
    types: "queueTypes",
    tickets: "queueTickets",
    counters: "queueCounters",
};
const PRIORITY_LABEL = {
    normal: "Normal", lansia: "Lansia", disabilitas: "Disabilitas", vip: "VIP",
};
const PRIORITY_RANK = { vip: 0, disabilitas: 1, lansia: 2, normal: 3 };
const STATUS_LABEL = {
    waiting: "Menunggu", called: "Dipanggil", done: "Selesai", skipped: "Dilewati",
};
const DEFAULT_TYPES = [
    { id: "t-a", code: "A", name: "UMUM-1", active: true },
    { id: "t-b", code: "B", name: "UMUM-2", active: true },
    { id: "t-g", code: "G", name: "GIGI", active: true },
    { id: "t-f", code: "F", name: "FARMASI", active: true },
];
function $(id) {
    return document.getElementById(id);
}
function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === false)
            continue;
        if (typeof v === "function")
            el.addEventListener(k.replace(/^on/, ""), v);
        else if (k === "class")
            el.className = v;
        else
            el.setAttribute(k, v === true ? "" : v);
    }
    el.append(...children);
    return el;
}
let toastTimer;
function toast(message) {
    let el = document.getElementById("toast");
    if (!el) {
        el = h("div", { id: "toast", class: "toast" });
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove("show"), 2600);
}
function clockText(d = new Date()) {
    return d.toLocaleTimeString("id-ID", { hour12: false }).replace(/:/g, ".");
}
function formatDuration(ms) {
    const min = Math.round(ms / 60000);
    if (min < 1)
        return "< 1 menit";
    if (min < 60)
        return `${min} menit`;
    return `${Math.floor(min / 60)} jam ${min % 60} menit`;
}
function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function byQueueOrder(a, b) {
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.seq - b.seq;
}
const Store = {
    init() {
        if (localStorage.getItem(KEY.types) === null)
            writeJSON(KEY.types, DEFAULT_TYPES);
        if (localStorage.getItem(KEY.tickets) === null)
            writeJSON(KEY.tickets, []);
        if (localStorage.getItem(KEY.counters) === null)
            writeJSON(KEY.counters, {});
    },
    types: () => readJSON(KEY.types, []),
    activeTypes: () => Store.types().filter((t) => t.active),
    tickets: () => readJSON(KEY.tickets, []),
    signature: () => (localStorage.getItem(KEY.types) ?? "") + (localStorage.getItem(KEY.tickets) ?? ""),
    waiting(typeId, all = Store.tickets()) {
        return all.filter((t) => t.typeId === typeId && t.status === "waiting").sort(byQueueOrder);
    },
    current(typeId, all = Store.tickets()) {
        return all.find((t) => t.typeId === typeId && t.status === "called");
    },
    addType(codeRaw, nameRaw) {
        const code = codeRaw.trim().toUpperCase();
        const name = nameRaw.trim();
        const types = Store.types();
        if (!/^[A-Z]$/.test(code))
            return "Kode harus tepat 1 huruf kapital (A-Z).";
        if (!name)
            return "Nama layanan wajib diisi.";
        if (types.some((t) => t.code.toLowerCase() === code.toLowerCase()))
            return `Kode "${code}" sudah dipakai.`;
        if (types.some((t) => t.name.toLowerCase() === name.toLowerCase()))
            return `Nama "${name}" sudah dipakai.`;
        types.push({ id: uid(), code, name, active: true });
        writeJSON(KEY.types, types);
        return null;
    },
    toggleType(id) {
        const types = Store.types();
        const t = types.find((x) => x.id === id);
        if (t)
            t.active = !t.active;
        writeJSON(KEY.types, types);
    },
    removeType(id) {
        writeJSON(KEY.types, Store.types().filter((t) => t.id !== id));
        writeJSON(KEY.tickets, Store.tickets().filter((t) => t.typeId !== id));
    },
    reset() {
        writeJSON(KEY.tickets, []);
        writeJSON(KEY.counters, {});
    },
    issue(typeId, priority, owner) {
        const type = Store.types().find((t) => t.id === typeId);
        if (!type || !type.active)
            return null;
        const counters = readJSON(KEY.counters, {});
        const number = (counters[type.code] ?? 0) + 1;
        counters[type.code] = number;
        writeJSON(KEY.counters, counters);
        const tickets = Store.tickets();
        const ticket = {
            id: uid(), typeId, code: type.code, number,
            label: `${type.code}-${String(number).padStart(3, "0")}`,
            priority, status: "waiting", skips: 0, createdAt: Date.now(), owner,
            seq: Math.max(Date.now(), ...tickets.map((t) => t.seq + 1)),
        };
        tickets.push(ticket);
        writeJSON(KEY.tickets, tickets);
        return ticket;
    },
    mine(owner, all = Store.tickets()) {
        return all.filter((t) => t.owner === owner).sort((a, b) => b.createdAt - a.createdAt);
    },
    /** Rata-rata durasi layanan (ms). typeId kosong = semua jenis. */
    avgServiceMs(typeId, all = Store.tickets()) {
        const d = all
            .filter((t) => (!typeId || t.typeId === typeId) && t.status === "done" && t.calledAt && t.doneAt)
            .map((t) => t.doneAt - t.calledAt);
        return d.length ? d.reduce((a, b) => a + b, 0) / d.length : null;
    },
    /** Estimasi tunggu (ms) untuk tiket dengan `ahead` antrian di depannya. */
    estimateWaitMs(typeId, ahead, all = Store.tickets()) {
        const avg = Store.avgServiceMs(typeId, all) ?? DEFAULT_SERVICE_MS;
        const hasCurrent = Store.current(typeId, all) ? 1 : 0;
        return (ahead + hasCurrent) * avg;
    },
    stats(all = Store.tickets()) {
        const c = (s) => all.filter((t) => t.status === s).length;
        return {
            total: all.length, waiting: c("waiting"), called: c("called"),
            done: c("done"), skipped: c("skipped"), avgMs: Store.avgServiceMs(undefined, all),
        };
    },
    callNext(typeId) {
        const all = Store.tickets();
        all.filter((t) => t.typeId === typeId && t.status === "called").forEach((t) => { t.status = "done"; t.doneAt = Date.now(); });
        const next = Store.waiting(typeId, all)[0];
        if (next) {
            next.status = "called";
            next.calledAt = Date.now();
        }
        writeJSON(KEY.tickets, all);
    },
    finish(typeId) {
        const all = Store.tickets();
        const cur = Store.current(typeId, all);
        if (cur) {
            cur.status = "done";
            cur.doneAt = Date.now();
        }
        writeJSON(KEY.tickets, all);
    },
    skip(typeId) {
        const all = Store.tickets();
        const cur = Store.current(typeId, all);
        if (cur) {
            cur.skips += 1;
            if (cur.skips >= 2)
                cur.status = "skipped";
            else {
                cur.status = "waiting";
                cur.seq = Math.max(Date.now(), ...all.map((t) => t.seq + 1));
            }
            cur.calledAt = undefined;
        }
        writeJSON(KEY.tickets, all);
    },
};
const Auth = {
    isStaff: (role) => role === "admin" || role === "moderator",
    home: (role) => (Auth.isStaff(role) ? "index.html" : "ambil-antrian.html"),
    session() {
        const token = localStorage.getItem(KEY.token);
        const role = localStorage.getItem(KEY.role);
        const firstName = localStorage.getItem(KEY.firstName);
        if (!token || !role || !firstName)
            return null;
        return { token, role, firstName, username: localStorage.getItem(KEY.username) ?? firstName };
    },
    owner() {
        return Auth.session()?.username ?? "";
    },
    guard(staffOnly) {
        const s = Auth.session();
        if (!s || (staffOnly && !Auth.isStaff(s.role))) {
            location.replace("login.html");
            return null;
        }
        document.body.dataset.role = Auth.isStaff(s.role) ? "staff" : "user";
        document.body.classList.remove("auth-checking");
        return s;
    },
    logout() {
        [KEY.token, KEY.role, KEY.firstName, KEY.username].forEach((k) => localStorage.removeItem(k));
        location.replace("login.html");
    },
    renderUserBar(container, s) {
        container.replaceChildren(h("span", { class: "user-chip" }, s.firstName, h("small", {}, s.role)), h("button", { class: "btn btn-sm", onclick: () => Auth.logout() }, "Keluar"));
    },
};
const Theme = {
    apply(t) { document.documentElement.dataset.theme = t; },
    current: () => localStorage.getItem(KEY.theme) ?? "light",
    toggle(btn) {
        const next = Theme.current() === "dark" ? "light" : "dark";
        localStorage.setItem(KEY.theme, next);
        Theme.apply(next);
        btn.textContent = next === "dark" ? "☀️ Terang" : "🌙 Gelap";
    },
    mount() {
        Theme.apply(Theme.current());
        const btn = h("button", { class: "btn btn-sm", type: "button", title: "Ganti tema" }, Theme.current() === "dark" ? "☀️ Terang" : "🌙 Gelap");
        btn.addEventListener("click", () => Theme.toggle(btn));
        const bar = document.querySelector(".header-actions");
        if (bar)
            bar.prepend(btn);
        else {
            btn.classList.add("theme-float");
            document.body.appendChild(btn);
        }
    },
};
Theme.apply(Theme.current());
Theme.mount();
Store.init();
