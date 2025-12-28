const express = require("express");
const auth = require("../middleware/adminAuth");
const Order = require("../models/Order");
const User = require("../models/User");

const router = express.Router();

/* ===========================
   APPROVE RETURN
=========================== */
router.post("/approve-return", auth, async (req, res) => {
  const { orderId, refundAmount } = req.body;

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ message: "Order not found" });

  if (order.status !== "Refund Requested")
    return res.status(400).json({ message: "Invalid state" });

  order.status = "Refunded";
  order.refundAmount = refundAmount;
  order.paymentStatus = "Refunded";
  await order.save();

  const user = await User.findById(order.userId);

  user.wallet.balance += refundAmount;
  user.wallet.transactions.push({
    type: "CREDIT",
    amount: refundAmount,
    note: `Refund for Order ${order._id}`
  });

  await user.save();

  res.json({ success: true });
});

module.exports = router;
