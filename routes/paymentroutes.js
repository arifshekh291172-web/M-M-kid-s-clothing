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
   CREATE RAZORPAY ORDER
====================================================== */
router.post("/create", auth, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order)
            return res.status(404).json({ message: "Order not found" });

        if (order.paymentStatus === "Paid")
            return res.status(400).json({ message: "Order already paid" });

        const razorpayOrder = await razorpay.orders.create({
            amount: order.totalAmount * 100, // paise
            currency: "INR",
            receipt: String(order._id),
            payment_capture: 1
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
            key: process.env.RAZORPAY_KEY_ID,
            razorpayOrder
        });

    } catch (err) {
        console.error("PAYMENT CREATE ERROR:", err);
        res.status(500).json({ message: "Payment initiation failed" });
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

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: razorpay_order_id },
                { status: "FAILED" }
            );

            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        await Payment.findOneAndUpdate(
            { razorpayOrderId: razorpay_order_id },
            {
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                status: "PAID"
            }
        );

        await Order.findByIdAndUpdate(orderId, {
            paymentStatus: "Paid",
            paymentId: razorpay_payment_id,
            status: "Packed"
        });

        res.json({
            success: true,
            message: "Payment successful"
        });

    } catch (err) {
        console.error("PAYMENT VERIFY ERROR:", err);
        res.status(500).json({ message: "Payment verification failed" });
    }
});

/* ======================================================
   RAZORPAY WEBHOOK (AUTO CONFIRM)
====================================================== */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

            const signature = req.headers["x-razorpay-signature"];
            const expected = crypto
                .createHmac("sha256", secret)
                .update(req.body)
                .digest("hex");

            if (signature !== expected) {
                return res.status(400).send("Invalid signature");
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
   REFUND PAYMENT
====================================================== */
router.post("/refund", auth, async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment || payment.status !== "PAID") {
            return res.status(400).json({ message: "Payment not refundable" });
        }

        const refund = await razorpay.payments.refund(
            payment.razorpayPaymentId,
            {
                amount: payment.amount * 100,
                notes: { reason: reason || "Customer refund" }
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
        res.status(500).json({ message: "Refund failed" });
    }
});

module.exports = router;