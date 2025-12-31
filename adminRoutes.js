const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminController"); // ⚠️ case sensitive

const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Wallet = require("../models/Wallet");
const Ticket = require("../models/Ticket");
const Message = require("../models/Message");

const sendEmail = require("../utils/sendEmail");

/* ======================================================
   USERS
====================================================== */
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

router.post("/users/block", adminAuth, async (req, res) => {
  const { userId, block } = req.body;
  await User.findByIdAndUpdate(userId, { isBlocked: block });
  res.json({ success: true });
});

/* ======================================================
   ORDERS
====================================================== */
router.get("/orders", adminAuth, async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
});

router.post("/orders/status", adminAuth, async (req, res) => {
  const { orderId, status } = req.body;

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  const user = await User.findById(order.userId);

  order.status = status;
  order.statusHistory.push({ status });

  if (status === "Refunded") {
    order.paymentStatus = "Refunded";
    order.refundAmount = order.totalAmount;
  }

  await order.save();

  await sendEmail(
    user.email,
    `Order Status Updated – ${status}`,
    `<p>Order <b>${order._id}</b> status changed to <b>${status}</b></p>`
  );

  res.json({ success: true });
});

/* ======================================================
   REFUND → WALLET
====================================================== */
router.post("/orders/refund", adminAuth, async (req, res) => {
  const { orderId, refundAmount, adminNote } = req.body;

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ success: false, message: "Order not found" });

  order.status = "Refunded";
  order.paymentStatus = "Refunded";
  order.refundAmount = refundAmount;
  order.adminNote = adminNote;
  order.statusHistory.push({ status: "Refunded" });
  await order.save();

  let wallet = await Wallet.findOne({ userId: order.userId });
  if (!wallet) wallet = await Wallet.create({ userId: order.userId });

  wallet.balance += refundAmount;
  wallet.transactions.unshift({
    type: "CREDIT",
    amount: refundAmount,
    reason: "Order Refund",
    orderId: order._id
  });

  await wallet.save();

  res.json({ success: true });
});

/* ======================================================
   PRODUCTS (BASE64 IMAGE ✔)
====================================================== */
router.post("/products", adminAuth, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      originalPrice,
      sizes,
      badge,
      image,
      images
    } = req.body;

    // 🔥 MAIN IMAGE REQUIRED
    if (!image || !image.startsWith("data:image")) {
      return res.status(400).json({
        success: false,
        message: "Main image required"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      description: description || "",
      price: Number(price),
      originalPrice: Number(originalPrice),
      sizes: sizes || [],
      badge: badge || "",
      image,               // ✅ BASE64
      images: images || [] // ✅ BASE64 ARRAY
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to add product"
    });
  }
});

/* ======================================================
   PRODUCTS LIST (ADMIN)
====================================================== */
router.get("/products", adminAuth, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});

/* ======================================================
   SUPPORT
====================================================== */
router.get("/tickets", adminAuth, async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json({ success: true, tickets });
});

router.get("/tickets/:id/messages", adminAuth, async (req, res) => {
  const messages = await Message.find({ ticket: req.params.id })
    .sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

/* ======================================================
   ANALYTICS
====================================================== */
router.get("/analytics", adminAuth, async (req, res) => {
  const orders = await Order.find({
    paymentStatus: { $ne: "Failed" }
  });

  const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    success: true,
    stats: {
      orders: orders.length,
      revenue
    }
  });
});

module.exports = router;
