const express = require("express");
const crypto = require("crypto");

const Order = require("../models/Order");
const Payment = require("../models/Payment");

const router = express.Router();

/* ======================================================
   RAZORPAY WEBHOOK
====================================================== */
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      const signature = req.headers["x-razorpay-signature"];
      const body = req.body.toString();

      const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (signature !== expected) {
        return res.status(400).json({ message: "Invalid signature" });
      }

      const event = JSON.parse(body);

      /* PAYMENT SUCCESS */
      if (event.event === "payment.captured") {
        const paymentId = event.payload.payment.entity.id;
        const rpOrderId = event.payload.payment.entity.order_id;

        const payment = await Payment.findOne({
          razorpayOrderId: rpOrderId
        });

        if (!payment) return res.json({ received: true });

        payment.razorpayPaymentId = paymentId;
        payment.status = "PAID";
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: "Paid",
          status: "Confirmed"
        });
      }

      res.json({ status: "ok" });

    } catch (err) {
      console.error("WEBHOOK ERROR:", err);
      res.status(500).json({ message: "Webhook failed" });
    }
  }
);

module.exports = router;
