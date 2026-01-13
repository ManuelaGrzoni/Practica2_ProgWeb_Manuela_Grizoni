import express from "express";
import Order from "../models/Order.js";
import { authenticate, authorize } from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

// GET /api/orders?status=pending|completed  (admin)
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) {
    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    filter.status = status;
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("user", "username email role");

  res.json(orders);
});

// GET /api/orders/:id  (admin) detalle
router.get("/:id", authenticate, authorize("admin"), async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "username email role")
    .populate("items.product", "name price");

  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

  res.json(order);
});

// POST /api/orders  (usuario autenticado) crea pedido desde carrito
router.post("/", authenticate, async (req, res) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Carrito vacío" });
    }

    // normalizar quantity a número (por si viene como string)
    const normalized = items.map((it) => ({
      productId: it.productId,
      quantity: parseInt(it.quantity, 10),
    }));

    // validar items
    for (const it of normalized) {
      if (!it.productId || !Number.isFinite(it.quantity) || it.quantity < 1) {
        return res.status(400).json({ message: "Items inválidos" });
      }
    }

    // cargar productos desde BD
    const ids = normalized.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: ids } });

    // mapa por id
    const map = new Map(products.map((p) => [String(p._id), p]));

    // construir snapshot items
    const orderItems = normalized.map((i) => {
      const p = map.get(String(i.productId));
      if (!p) throw new Error("Producto no encontrado: " + i.productId);

      return {
        product: p._id,
        name: p.name,
        price: p.price,
        quantity: i.quantity,
      };
    });

    const total = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      status: "completed", // simulación compra directa
      total,
    });

    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message || "Error creando pedido" });
  }
});

export default router;
