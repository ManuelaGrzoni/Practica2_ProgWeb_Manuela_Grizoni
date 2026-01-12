import express from "express";
import Order from "../models/Order.js";
import { authenticate, authorize } from "../middleware/auth.js";

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

export default router;
