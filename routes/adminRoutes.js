const express = require("express");
const adminAuth = require("../middleware/adminAuth");

const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Wallet = require("../models/Wallet");
const Ticket = require("../models/Ticket");
const Message = require("../models/Message");

const sendEmail = require("../utils/sendEmail");

const router = express.Router();

/* ======================================================
   USERS
====================================================== */

/* GET ALL USERS */
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* BLOCK / UNBLOCK USER */
router.post("/users/block", adminAuth, async (req, res) => {
  const { userId, block } = req.body;
  await User.findByIdAndUpdate(userId, { isBlocked: block });
  res.json({ success: true });
});

/* ======================================================
   ORDERS
====================================================== */

/* GET ALL ORDERS */
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* UPDATE ORDER STATUS + EMAIL */
router.post("/orders/status", adminAuth, async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

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
      `
        <h3>Order Update</h3>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>Status:</b> ${status}</p>
        <p>Thank you for shopping with M&M Kid's Wear.</p>
      `
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   APPROVE RETURN / REFUND → WALLET CREDIT
====================================================== */

router.post("/orders/refund", adminAuth, async (req, res) => {
  try {
    const { orderId, refundAmount, adminNote } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const user = await User.findById(order.userId);

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

    await sendEmail(
      user.email,
      "Refund Successful – M&M Kid's Wear",
      `
        <h3>Refund Credited</h3>
        <p>₹${refundAmount} has been credited to your wallet.</p>
        <p><b>Order ID:</b> ${order._id}</p>
      `
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================================
   PRODUCTS  ✅ FIXED PART
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
      stock,
      badge,
      image,
      images
    } = req.body;

    // REQUIRED FIELD CHECK (schema match)
    if (!name || !brand || !category || !price || !originalPrice || !image) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const product = await Product.create({
      name,
      brand,
      category,
      description: description || "",
      price: Number(price),
      originalPrice: Number(originalPrice),
      stock: Number(stock || 0),
      badge: badge || "",
      image,                 // REQUIRED by schema
      images: images || []   // optional
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* GET ALL PRODUCTS */
router.get("/products", adminAuth, async (req, res) => {
  res.json(await Product.find());
});

/* UPDATE PRODUCT */
router.put("/products/:id", adminAuth, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

/* DELETE PRODUCT */
router.delete("/products/:id", adminAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ======================================================
   SUPPORT TICKETS
====================================================== */

router.get("/tickets", adminAuth, async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
});

router.get("/tickets/:id/messages", adminAuth, async (req, res) => {
  try {
    const messages = await Message.find({
      ticket: req.params.id
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
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
    orders: orders.length,
    revenue
  });
});

module.exports = router;
