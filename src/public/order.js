const API = "/api/orders";
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

const tbody = document.querySelector("#ordersTable tbody");
const countEl = document.getElementById("count");
const errorEl = document.getElementById("error");
const statusEl = document.getElementById("status");
const refreshBtn = document.getElementById("refreshBtn");

const detailCard = document.getElementById("detailCard");
const detailEl = document.getElementById("detail");

function showError(msg) {
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function statusLabel(s) {
  return s === "pending" ? "En curso" : s === "completed" ? "Comprado" : s;
}

async function loadOrders() {
  if (!token) return showError("Debes iniciar sesión.");
  if (!isAdmin) return showError("Solo admin puede ver pedidos.");

  clearError();
  detailCard.style.display = "none";
  detailEl.innerHTML = "";

  const params = new URLSearchParams();
  if (statusEl.value) params.set("status", statusEl.value);

  const url = `${API}${params.toString() ? "?" + params.toString() : ""}`;

  const res = await fetch(url, { headers: { ...authHeaders() } });
  const data = await res.json().catch(() => []);
  if (!res.ok) return showError(data.message || "Error cargando pedidos");

  countEl.textContent = `${data.length}`;
  tbody.innerHTML = "";

  for (const o of data) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtDate(o.createdAt)}</td>
      <td>${o.user?.email || o.user?.username || "—"}</td>
      <td><span class="badge">${statusLabel(o.status)}</span></td>
      <td class="right">${Number(o.total || 0).toFixed(2)} €</td>
      <td><button class="btn ghost" data-view="${o._id}">Ver</button></td>
    `;
    tbody.appendChild(tr);
  }
}

async function loadDetail(id) {
  clearError();
  const res = await fetch(`${API}/${id}`, { headers: { ...authHeaders() } });
  const o = await res.json().catch(() => null);
  if (!res.ok) return showError(o?.message || "Error cargando detalle");

  const user = o.user ? `${o.user.username} (${o.user.email})` : "—";
  const itemsHtml = (o.items || []).map(it => {
    return `<li>${it.quantity} × ${it.name} — ${(it.price * it.quantity).toFixed(2)} €</li>`;
  }).join("");

  detailEl.innerHTML = `
    <p><b>Pedido:</b> ${o._id}</p>
    <p><b>Usuario:</b> ${user}</p>
    <p><b>Fecha:</b> ${fmtDate(o.createdAt)}</p>
    <p><b>Estado:</b> ${statusLabel(o.status)}</p>
    <p><b>Total:</b> ${Number(o.total).toFixed(2)} €</p>
    <hr />
    <p><b>Productos:</b></p>
    <ul>${itemsHtml || "<li>Sin productos</li>"}</ul>
  `;

  detailCard.style.display = "block";
}

refreshBtn.addEventListener("click", loadOrders);
statusEl.addEventListener("change", loadOrders);

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (!btn) return;
  loadDetail(btn.dataset.view);
});

loadOrders();
