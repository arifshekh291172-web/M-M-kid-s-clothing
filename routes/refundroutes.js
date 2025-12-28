const express = require("express");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ======================================================
   REFUND PAYMENT
====================================================== */
router.post("/refund", auth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const payment = await Payment.findOne({ orderId });
    if (!payment || payment.status !== "PAID")
      return res.status(400).json({ message: "Payment not refundable" });

    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: amount ? amount * 100 : undefined
      }
    );

    payment.status = "REFUNDED";
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount / 100;
    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "Refunded",
      status: "Cancelled"
    });

    res.json({
      success: true,
      refundId: refund.id
    });

  } catch (err) {
    console.error("REFUND ERROR:", err);
    res.status(500).json({ message: "Refund failed" });
  }
});

module.exports = router;
