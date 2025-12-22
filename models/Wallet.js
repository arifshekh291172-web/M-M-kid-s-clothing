const mongoose = require("mongoose");

/* ======================================================
   WALLET TRANSACTION SUB-SCHEMA
   - CREDIT / DEBIT history
====================================================== */
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String, // Order Payment / Refund / Cancel / Adjustment
      required: true,
      trim: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

/* ======================================================
   MAIN WALLET SCHEMA
====================================================== */
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    transactions: {
      type: [transactionSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/* ======================================================
   INDEXES (PERFORMANCE)
====================================================== */

module.exports = mongoose.model("Wallet", walletSchema);
