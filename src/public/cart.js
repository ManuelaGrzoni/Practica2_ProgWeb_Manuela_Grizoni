// src/public/cart.js
import { getCart, setCart, cartTotal, removeFromCart, updateQty } from "./cartStore.js";
import { graphqlRequest } from "./graphqlClient.js";

const tbody = document.querySelector("#cartTable tbody");
const totalEl = document.getElementById("total");
const emptyEl = document.getElementById("empty");
const checkoutBtn = document.getElementById("checkoutBtn");
const msgEl = document.getElementById("msg");

function showMsg(text) {
  if (!msgEl) return;
  msgEl.hidden = false;
  msgEl.textContent = text;
}

function render() {
  const cart = getCart();
  tbody.innerHTML = "";

  totalEl.textContent = `${cartTotal().toFixed(2)} €`;
  emptyEl.hidden = cart.length !== 0;

  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

  for (const it of cart) {
    const sub = it.price * it.quantity;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.name}</td>
      <td class="right">${it.price.toFixed(2)} €</td>
      <td class="right">
        <input class="input" style="max-width:90px" type="number" min="1"
               value="${it.quantity}" data-qty="${it.productId}" />
      </td>
      <td class="right">${sub.toFixed(2)} €</td>
      <td>
        <button class="btn ghost" data-del="${it.productId}">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

tbody.addEventListener("input", (e) => {
  const pid = e.target.getAttribute("data-qty");
  if (!pid) return;
  const qty = Number(e.target.value);
  if (!Number.isFinite(qty) || qty < 1) return;
  updateQty(pid, qty);
  render();
});

tbody.addEventListener("click", (e) => {
  const pid = e.target.getAttribute("data-del");
  if (!pid) return;
  removeFromCart(pid);
  render();
});

// ✅ Finalizar compra vía GraphQL (mutation createOrder)
checkoutBtn?.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showMsg("Debes iniciar sesión para comprar.");
    return;
  }

  const cart = getCart();
  if (cart.length === 0) return;

  const variables = {
    items: cart.map((i) => ({
      productId: i.productId,
      quantity: parseInt(i.quantity, 10),
    })),
  };

  try {
    checkoutBtn.disabled = true;
    showMsg("Procesando compra...");

    const data = await graphqlRequest(
      `
      mutation($items: [CartItemInput!]!) {
        createOrder(items: $items) {
          _id
          total
          status
        }
      }
      `,
      variables
    );

    // ✅ vaciar carrito
    setCart([]);
    render();

    showMsg(
      `Compra realizada ✅ Pedido: ${data.createOrder._id} Total: ${Number(
        data.createOrder.total
      ).toFixed(2)} €`
    );
  } catch (e) {
    showMsg("Error: " + e.message);
  } finally {
    checkoutBtn.disabled = false;
  }
});

render();
