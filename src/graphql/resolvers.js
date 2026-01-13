import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

function requireAuth(ctx) {
  if (!ctx.user) throw new Error("No autenticado");
}
function requireAdmin(ctx) {
  requireAuth(ctx);
  if (ctx.user.role !== "admin") throw new Error("Solo admin");
}

export const resolvers = {
  Query: {
    products: async (_, args) => {
      const filter = {};

      if (args.q) {
        filter.$or = [
          { name: new RegExp(args.q, "i") },
          { description: new RegExp(args.q, "i") },
        ];
      }

      if (args.min != null || args.max != null) {
        filter.price = {};
        if (args.min != null) filter.price.$gte = args.min;
        if (args.max != null) filter.price.$lte = args.max;
      }

      return Product.find(filter).sort({ createdAt: -1 });
    },

    myOrders: async (_, __, ctx) => {
      requireAuth(ctx);
      return Order.find({ user: ctx.user.id })
        .sort({ createdAt: -1 })
        .populate("user", "username email role");
    },

    orders: async (_, args, ctx) => {
      requireAdmin(ctx);
      const filter = {};
      if (args.status) filter.status = args.status;
      return Order.find(filter)
        .sort({ createdAt: -1 })
        .populate("user", "username email role");
    },

    order: async (_, { id }, ctx) => {
      requireAdmin(ctx);
      return Order.findById(id)
        .populate("user", "username email role")
        .populate("items.product", "name price");
    },
  },

  Mutation: {
    createOrder: async (_, { items }, ctx) => {
      requireAuth(ctx);

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Carrito vacío");
      }

      // normalizar
      const normalized = items.map((it) => ({
        productId: it.productId,
        quantity: parseInt(it.quantity, 10),
      }));

      for (const it of normalized) {
        if (!it.productId || !Number.isFinite(it.quantity) || it.quantity < 1) {
          throw new Error("Items inválidos");
        }
      }

      const ids = normalized.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: ids } });
      const map = new Map(products.map((p) => [String(p._id), p]));

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
        user: ctx.user.id,
        items: orderItems,
        status: "completed", // simulación compra directa
        total,
      });

      return Order.findById(order._id).populate("user", "username email role");
    },

    setOrderStatus: async (_, { id, status }, ctx) => {
      requireAdmin(ctx);
      if (!["pending", "completed"].includes(status)) throw new Error("Estado inválido");

      const updated = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate("user", "username email role");

      if (!updated) throw new Error("Pedido no encontrado");
      return updated;
    },
  },
};
