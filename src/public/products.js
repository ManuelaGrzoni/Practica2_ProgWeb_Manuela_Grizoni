// src/public/products.js
import { addToCart, cartCount } from "./cartStore.js";
import { graphqlRequest } from "./graphqlClient.js";

const API = "/api/products";

console.log("products.js cargado ✅");

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

console.log("role en token:", payload?.role, "isAdmin:", isAdmin);

if (!isAdmin) {
  document.querySelectorAll('[data-admin-only]').forEach(el => el.remove());
}
// --- Elementos DOM ---
const tbody = document.querySelector("#list tbody");

const form = document.getElementById("form");
const pid = document.getElementById("pid");
const nameEl = document.getElementById("name");
const priceEl = document.getElementById("price");
const descEl = document.getElementById("description");
const imgEl = document.getElementById("imageUrl");
const cancelBtn = document.getElementById("cancelBtn");

const searchForm = document.getElementById("search");
const qEl = document.getElementById("q");
const minEl = document.getElementById("min");
const maxEl = document.getElementById("max");

// cache para poder “Añadir” sin refetch
let itemsCache = [];

// --- UI por rol: oculta lo que tenga data-admin-only ---
document.querySelectorAll("[data-admin-only]").forEach((el) => {
  el.style.display = isAdmin ? "" : "none";
});

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// badge del carrito en header (si existe)
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = String(cartCount());
}

updateCartBadge();

// fetch products
async function fetchProducts(params = {}) {
  const variables = {
    q: params.q || null,
    min: params.min !== "" ? Number(params.min) : null,
    max: params.max !== "" ? Number(params.max) : null,
  };

  const data = await graphqlRequest(
    `
    query($q: String, $min: Float, $max: Float) {
      products(q: $q, min: $min, max: $max) {
        _id
        name
        price
        description
        imageUrl
      }
    }
    `,
    variables
  );

  return data.products;
}


// -------- RENDER ----------
function renderRows(items) {
  if (!tbody) return;

  tbody.innerHTML = "";

  const countEl = document.getElementById("count");
  if (countEl) countEl.textContent = `${items.length} ítems`;

  for (const p of items) {
    const tr = document.createElement("tr");

    const name = p.name ?? p.nombre ?? "";
    const price = Number(p.price ?? p.precio ?? 0);

    if (isAdmin) {
      tr.innerHTML = `
        <td>${name}</td>
        <td class="right">${price.toFixed(2)} €</td>
        <td>
          <button class="btn ghost" data-edit="${p._id}">✏️</button>
          <button class="btn ghost" data-del="${p._id}">🗑️</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${name}</td>
        <td class="right">${price.toFixed(2)} €</td>
        <td>
          <button class="btn ghost" data-add="${p._id}">Añadir</button>
        </td>
      `;
    }

    tbody.appendChild(tr);
  }
}

// -------- LOAD ----------
async function load() {
  try {
    const items = await fetchProducts({
      q: qEl?.value?.trim() || "",
      min: minEl?.value || "",
      max: maxEl?.value || "",
    });

    itemsCache = items; // guarda para “Añadir”
    renderRows(items);
  } catch (e) {
    console.error(e);
    alert("Error al cargar productos: " + e.message);
  }
}

load();

// -------- BUSCAR ----------
searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  load();
});

// -------- CLICK EN TABLA ----------
tbody?.addEventListener("click", async (e) => {
  // --- USER: añadir al carrito ---
  const addId = e.target.getAttribute("data-add");
  if (addId) {
    const p = itemsCache.find((x) => x._id === addId);
    if (!p) return;

    addToCart(
      {
        productId: p._id,
        name: p.name ?? p.nombre ?? "",
        price: Number(p.price ?? p.precio ?? 0),
      },
      1
    );

    updateCartBadge();
    return;
  }

  // --- ADMIN: editar / borrar ---
  if (!isAdmin) return;

  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    const res = await fetch(`${API}/${editId}`, {
      headers: { ...authHeaders() },
    });
    const p = await res.json();

    pid.value = p._id;
    nameEl.value = p.name;
    priceEl.value = p.price;
    descEl.value = p.description || "";
    imgEl.value = p.imageUrl || "";
  }

  if (delId) {
    if (!confirm("¿Eliminar?")) return;

    const res = await fetch(`${API}/${delId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    });

    if (res.ok) load();
    else alert("No se pudo eliminar");
  }
});

// -------- GUARDAR (solo admin) ----------
form?.addEventListener("submit", async (e) => {
  if (!isAdmin) return;

  e.preventDefault();

  const body = {
    name: nameEl.value.trim(),
    price: Number(priceEl.value),
    description: descEl.value.trim(),
    imageUrl: imgEl.value.trim(),
  };

  const id = pid.value;
  const url = id ? `${API}/${id}` : API;
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    pid.value = "";
    form.reset();
    load();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err.message || "Error al guardar");
  }
});


// -------- CANCELAR ----------
cancelBtn?.addEventListener("click", () => {
  pid.value = "";
  form?.reset();
});
