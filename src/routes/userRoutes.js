import express from "express";
import User from "../models/User.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// LISTAR usuarios (solo admin)
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
  res.json(users);
});

// CAMBIAR rol (solo admin)
router.patch("/:id/role", authenticate, authorize("admin"), async (req, res) => {
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Rol inválido" });
  }

  // evita que el admin se quite el rol a sí mismo
  if (req.params.id === req.user.id && role !== "admin") {
    return res.status(400).json({ message: "No puedes quitarte el rol admin" });
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, projection: { password: 0 } }
  );

  if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
  res.json(updated);
});

// ELIMINAR usuario (solo admin)
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  // evita que el admin se elimine a sí mismo
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "No puedes eliminarte a ti mismo" });
  }

  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Usuario no encontrado" });

  res.json({ message: "Usuario eliminado" });
});

export default router;
