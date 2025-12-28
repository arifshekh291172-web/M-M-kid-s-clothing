const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    /* ===============================
       CORE REFERENCES
    =============================== */
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* ===============================
       RAZORPAY DETAILS
    =============================== */
    razorpayOrderId: {
      type: String,
      required: true,
      index: true
    },

    razorpayPaymentId: {
      type: String,
      index: true
    },

    razorpaySignature: {
      type: String
    },

    /* ===============================
       PAYMENT INFO
    =============================== */
    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED", "REFUNDED"],
      default: "CREATED",
      index: true
    },

    /* ===============================
       REFUND INFO
    =============================== */
    refundId: {
      type: String
    },

    refundAmount: {
      type: Number
    },

    refundReason: {
      type: String
    },

    refundedAt: {
      type: Date
    },

    /* ===============================
       WEBHOOK / META
    =============================== */
    webhookVerified: {
      type: Boolean,
      default: false
    },

    paymentMethod: {
      type: String, // card, upi, netbanking
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
