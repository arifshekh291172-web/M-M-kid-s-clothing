const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const auth = require("../middleware/authMiddleware");

const Order = require("../models/Order");
const Payment = require("../models/Payment");

const router = express.Router();

/* ======================================================
   RAZORPAY INSTANCE
====================================================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ======================================================
   RAZORPAY WEBHOOK (RAW BODY ONLY)
   ⚠️ auth middleware NOT required here
====================================================== */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(req.body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(400).send("Invalid webhook signature");
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === "payment.captured") {
        const paymentEntity = event.payload.payment.entity;

        const payment = await Payment.findOne({
          razorpayOrderId: paymentEntity.order_id
        });

        if (payment && payment.status !== "PAID") {
          payment.status = "PAID";
          payment.razorpayPaymentId = paymentEntity.id;
          payment.webhookVerified = true;
          await payment.save();

          await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: "Paid",
            paymentId: paymentEntity.id,
            status: "Packed"
          });
        }
      }

      res.json({ success: true });

    } catch (err) {
      console.error("WEBHOOK ERROR:", err);
      res.status(500).send("Webhook error");
    }
  }
);

/* ======================================================
   CREATE RAZORPAY ORDER
====================================================== */
router.post("/create", auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100, // INR → paise
      currency: "INR",
      receipt: `order_${order._id}`
    });

    await Payment.create({
      orderId: order._id,
      userId: order.userId,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      status: "CREATED"
    });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID, // PUBLIC KEY ONLY
      razorpayOrder
    });

  } catch (err) {
    console.error("PAYMENT CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Payment initiation failed"
    });
  }
});

/* ======================================================
   VERIFY PAYMENT (FRONTEND CALLBACK)
====================================================== */
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details"
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }

    // 🔒 Already verified (webhook safe)
    if (payment.status === "PAID") {
      return res.json({ success: true });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      payment.status = "FAILED";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    payment.status = "PAID";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "Paid",
      paymentId: razorpay_payment_id,
      status: "Packed"
    });

    res.json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (err) {
    console.error("PAYMENT VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
});

/* ======================================================
   REFUND PAYMENT
====================================================== */
router.post("/refund", auth, async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID required"
      });
    }

    const payment = await Payment.findOne({ orderId });

    if (!payment || payment.status !== "PAID") {
      return res.status(400).json({
        success: false,
        message: "Payment not eligible for refund"
      });
    }

    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: payment.amount * 100,
        notes: {
          reason: reason || "Customer requested refund"
        }
      }
    );

    payment.status = "REFUNDED";
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount / 100;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "Refunded",
      status: "Refunded"
    });

    res.json({
      success: true,
      message: "Refund processed successfully"
    });

  } catch (err) {
    console.error("REFUND ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Refund failed"
    });
  }
});

module.exports = router;
