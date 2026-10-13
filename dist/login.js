"use strict";
(() => {
    const existing = Auth.session();
    if (existing) {
        location.replace(Auth.home(existing.role));
        return;
    }
    const form = $("loginForm");
    const userInput = $("username");
    const passInput = $("password");
    const btn = $("submitBtn");
    const errorBox = $("errorBox");
    function showError(msg) { errorBox.textContent = msg; errorBox.hidden = false; }
    function setLoading(on) {
        btn.disabled = on;
        btn.replaceChildren(...(on ? [h("span", { class: "spinner" }), "Memproses..."] : ["Masuk"]));
    }
    function normalizeRole(r) {
        return r === "admin" || r === "moderator" ? r : "user";
    }
    async function resolveRole(data) {
        if (data.role)
            return normalizeRole(data.role);
        const res = await fetch(`${API_BASE}/users/${data.id}`);
        const user = (await res.json());
        return normalizeRole(user.role);
    }
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorBox.hidden = true;
        const username = userInput.value.trim();
        const password = passInput.value;
        if (!username || !password) {
            showError("Username dan password wajib diisi.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, expiresInMins: 60 }),
            });
            const data = (await res.json());
            if (!res.ok)
                throw new Error(data.message || "Username atau password salah.");
            const role = await resolveRole(data);
            localStorage.setItem(KEY.token, data.accessToken);
            localStorage.setItem(KEY.role, role);
            localStorage.setItem(KEY.firstName, data.firstName);
            localStorage.setItem(KEY.username, data.username);
            location.replace(Auth.home(role));
        }
        catch (err) {
            showError(err instanceof TypeError
                ? "Koneksi jaringan gagal. Periksa internet Anda lalu coba lagi."
                : err.message);
            setLoading(false);
        }
    });
    async function fillSample(role) {
        try {
            const res = await fetch(`${API_BASE}/users/filter?key=role&value=${role}&limit=1&select=username,password`);
            const data = (await res.json());
            const u = data.users[0];
            if (u) {
                userInput.value = u.username;
                passInput.value = u.password;
            }
        }
        catch {
            showError("Gagal mengambil akun uji (jaringan bermasalah).");
        }
    }
    $("fillAdmin").addEventListener("click", () => fillSample("admin"));
    $("fillUser").addEventListener("click", () => fillSample("user"));
})();
