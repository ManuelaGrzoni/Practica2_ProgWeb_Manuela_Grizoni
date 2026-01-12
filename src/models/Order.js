import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },      // snapshot
    price: { type: Number, required: true },     // snapshot
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    total: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
