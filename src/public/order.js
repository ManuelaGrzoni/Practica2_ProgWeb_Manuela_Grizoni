// src/public/orders.js  (GraphQL)
import { graphqlRequest } from "./graphqlClient.js";

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
  if (!errorEl) return;
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

function clearError() {
  if (!errorEl) return;
  errorEl.hidden = true;
  errorEl.textContent = "";
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
  if (detailCard) detailCard.style.display = "none";
  if (detailEl) detailEl.innerHTML = "";

  try {
    const variables = { status: statusEl?.value || null };

    const data = await graphqlRequest(
      `
      query($status: String) {
        orders(status: $status) {
          _id
          status
          total
          createdAt
          user { username email role }
        }
      }
      `,
      variables
    );

    const orders = data.orders || [];

    if (countEl) countEl.textContent = `${orders.length}`;
    if (tbody) tbody.innerHTML = "";

    for (const o of orders) {
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
  } catch (e) {
    showError(e.message || "Error cargando pedidos");
  }
}

async function loadDetail(id) {
  clearError();

  try {
    const data = await graphqlRequest(
      `
      query($id: ID!) {
        order(id: $id) {
          _id
          status
          total
          createdAt
          user { username email role }
          items { name price quantity }
        }
      }
      `,
      { id }
    );

    const o = data.order;
    if (!o) return showError("Pedido no encontrado");

    const user = o.user ? `${o.user.username} (${o.user.email})` : "—";
    const itemsHtml = (o.items || [])
      .map((it) => `<li>${it.quantity} × ${it.name} — ${(it.price * it.quantity).toFixed(2)} €</li>`)
      .join("");

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

    if (detailCard) detailCard.style.display = "block";
  } catch (e) {
    showError(e.message || "Error cargando detalle");
  }
}

refreshBtn?.addEventListener("click", loadOrders);
statusEl?.addEventListener("change", loadOrders);

tbody?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (!btn) return;
  loadDetail(btn.dataset.view);
});

loadOrders();
