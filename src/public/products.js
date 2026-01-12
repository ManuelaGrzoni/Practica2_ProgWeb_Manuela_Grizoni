// src/public/products.js
const API = '/api/products';

console.log("products.js cargado ✅");

const token = localStorage.getItem('token');
function getPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const payload = token ? getPayload(token) : null;
const isAdmin = payload?.role === 'admin';

console.log("role en token:", payload?.role, "isAdmin:", isAdmin);


const tbody = document.querySelector('#list tbody');
const form = document.getElementById('form');
const pid = document.getElementById('pid');
const nameEl = document.getElementById('name');
const priceEl = document.getElementById('price');
const descEl = document.getElementById('description');
const imgEl = document.getElementById('imageUrl');
const cancelBtn = document.getElementById('cancelBtn');

const searchForm = document.getElementById('search');
const qEl = document.getElementById('q');
const minEl = document.getElementById('min');
const maxEl = document.getElementById('max');

// --- UI por rol ---
document.querySelectorAll('[data-admin-only]').forEach(el => {
  el.style.display = isAdmin ? '' : 'none';
});

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchProducts(params = {}) {
  // limpiar params vacíos
  const clean = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) clean[k] = v;
  }

  const query = new URLSearchParams(clean).toString();
  const url = `${API}${query ? `?${query}` : ''}`;

  console.log("URL fetch:", url); // <-- debug

  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error('Error al cargar productos');

  const data = await res.json();
  console.log("RESPUESTA API:", data); // <-- debug

  return Array.isArray(data) ? data : (data.items || []);
}


function renderRows(items) {
  tbody.innerHTML = '';

  // contador arriba a la derecha
  const countEl = document.getElementById('count');
  if (countEl) countEl.textContent = `${items.length} ítems`;

  for (const p of items) {
    const tr = document.createElement('tr');

    const name = p.name ?? p.nombre ?? '';
    const price = Number(p.price ?? p.precio ?? 0);

    if (isAdmin) {
      tr.innerHTML = `
        <td>${name}</td>
        <td class="right">${price.toFixed(2)} €</td>
        <td>
          <button data-edit="${p._id}">✏️</button>
          <button data-del="${p._id}">🗑️</button>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>${name}</td>
        <td class="right">${price.toFixed(2)} €</td>
      `;
    }

    tbody.appendChild(tr);
  }
}

async function load() {
  try {
    const items = await fetchProducts({
      q: qEl.value.trim(),
      min: minEl.value,
      max: maxEl.value
    });

    console.log("items recibidos:", items);

    const countEl = document.getElementById('count');
    if (countEl) countEl.textContent = `${items.length} ítems`;

    renderRows(items);
  } catch (e) {
    console.error(e);
    alert('Error al cargar productos: ' + e.message);
  }
}


load();

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  load();
});

// --- Acciones tabla (solo admin) ---
tbody.addEventListener('click', async (e) => {
  if (!isAdmin) return;

  const editId = e.target.getAttribute('data-edit');
  const delId  = e.target.getAttribute('data-del');

  if (editId) {
    const res = await fetch(`${API}/${editId}`, { headers: { ...authHeaders() } });
    const p = await res.json();
    pid.value = p._id;
    nameEl.value = p.name;
    priceEl.value = p.price;
    descEl.value = p.description || '';
    imgEl.value = p.imageUrl || '';
  }

  if (delId) {
    if (!confirm('¿Eliminar?')) return;
    const res = await fetch(`${API}/${delId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() }
    });
    if (res.ok) load();
    else alert('No se pudo eliminar');
  }
});

// --- Guardar (solo admin) ---
form.addEventListener('submit', async (e) => {
  if (!isAdmin) return;

  e.preventDefault();
  const body = {
    name: nameEl.value.trim(),
    price: Number(priceEl.value),
    description: descEl.value.trim(),
    imageUrl: imgEl.value.trim()
  };

  const id = pid.value;
  const url = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    pid.value = '';
    form.reset();
    load();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err.message || 'Error al guardar');
  }
});

cancelBtn.addEventListener('click', () => {
  pid.value = '';
  form.reset();
});
