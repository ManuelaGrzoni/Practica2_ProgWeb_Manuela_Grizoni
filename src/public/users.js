const API = "/api/users";
const token = localStorage.getItem("token");

function getPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const payload = token ? getPayload(token) : null;
const isAdmin = payload?.role === "admin";

const tbody = document.querySelector("#usersTable tbody");
const countEl = document.getElementById("count");
const errorEl = document.getElementById("error");

function showError(msg) {
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function load() {
  if (!token) return showError("Debes iniciar sesión.");
  if (!isAdmin) return showError("Solo admin puede gestionar usuarios.");

  try {
    const res = await fetch(API, { headers: { ...authHeaders() } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error cargando usuarios");

    countEl.textContent = `${data.length}`;
    tbody.innerHTML = "";

    for (const u of data) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td><span class="badge">${u.role}</span></td>
        <td class="row gap">
          <button class="btn ghost" data-action="toggle" data-id="${u._id}" data-role="${u.role}">
            Cambiar rol
          </button>
          <button class="btn ghost" data-action="delete" data-id="${u._id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    showError(e.message);
  }
}

tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  try {
    if (action === "toggle") {
      const current = btn.dataset.role;
      const nextRole = current === "admin" ? "user" : "admin";

      const res = await fetch(`${API}/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error cambiando rol");

      await load();
    }

    if (action === "delete") {
      if (!confirm("¿Eliminar usuario?")) return;

      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Error eliminando usuario");

      await load();
    }
  } catch (err) {
    showError(err.message);
  }
});

load();
