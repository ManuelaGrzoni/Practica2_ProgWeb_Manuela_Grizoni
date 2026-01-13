const token = localStorage.getItem("token");

function getPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function currentUserId() {
  const t = localStorage.getItem("token");
  const p = t ? getPayload(t) : null;
  return p?.id || null;
}

function cartKey() {
  const uid = currentUserId();
  return uid ? `cart:${uid}` : "cart:guest";
}

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey()) || "[]");
  } catch {
    return [];
  }
}

export function setCart(items) {
  localStorage.setItem(cartKey(), JSON.stringify(items));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.productId === product.productId);

  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  setCart(cart);
  return cart;
}

export function updateQty(productId, quantity) {
  const cart = getCart().map(i =>
    i.productId === productId ? { ...i, quantity } : i
  ).filter(i => i.quantity > 0);

  setCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter(i => i.productId !== productId);
  setCart(cart);
  return cart;
}

export function cartCount() {
  return getCart().reduce((acc, i) => acc + i.quantity, 0);
}

export function cartTotal() {
  return getCart().reduce((acc, i) => acc + i.price * i.quantity, 0);
}
