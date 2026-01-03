const express = require("express");
const crypto = require("crypto");

const Order = require("../models/Order");
const Payment = require("../models/Payment");

const router = express.Router();

/* ======================================================
   RAZORPAY WEBHOOK (SECURE)
   URL: /api/webhook/razorpay
====================================================== */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      /* 🔐 VERIFY SIGNATURE */
      const razorpaySignature = req.headers["x-razorpay-signature"];
      const body = req.body.toString();

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (razorpaySignature !== expectedSignature) {
        console.error("❌ Razorpay Webhook: Invalid signature");
        return res.status(400).json({ success: false });
      }

      const event = JSON.parse(body);

      /* ======================================================
         PAYMENT CAPTURED (SUCCESS)
      ====================================================== */
      if (event.event === "payment.captured") {
        const paymentEntity = event.payload.payment.entity;

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        const amountPaid = paymentEntity.amount / 100;

        const payment = await Payment.findOne({
          razorpayOrderId
        });

        if (!payment) {
          return res.json({ received: true });
        }

        /* UPDATE PAYMENT */
        payment.status = "PAID";
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.paidAmount = amountPaid;
        payment.webhookVerified = true;
        payment.paidAt = new Date();
        await payment.save();

        /* UPDATE ORDER */
        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "Paid",
          status: "Confirmed",
          paymentId: razorpayPaymentId,
          paidAt: new Date()
        });

        console.log("✅ Payment confirmed via webhook");
      }

      /* ======================================================
         PAYMENT FAILED
      ====================================================== */
      if (event.event === "payment.failed") {
        const paymentEntity = event.payload.payment.entity;

        const razorpayOrderId = paymentEntity.order_id;

        await Payment.findOneAndUpdate(
          { razorpayOrderId },
          {
            status: "FAILED",
            failureReason: paymentEntity.error_description
          }
        );

        console.log("❌ Payment failed via webhook");
      }

      /* ======================================================
         REFUND PROCESSED (OPTIONAL TRACKING)
      ====================================================== */
      if (event.event === "refund.processed") {
        const refundEntity = event.payload.refund.entity;

        await Payment.findOneAndUpdate(
          { razorpayPaymentId: refundEntity.payment_id },
          {
            status: "REFUNDED",
            refundId: refundEntity.id,
            refundAmount: refundEntity.amount / 100,
            refundedAt: new Date()
          }
        );

        console.log("💰 Refund processed via webhook");
      }

      return res.json({ success: true });

    } catch (err) {
      console.error("🔥 RAZORPAY WEBHOOK ERROR:", err);
      return res.status(500).json({ success: false });
    }
  }
);

module.exports = router;
