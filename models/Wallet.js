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
      type: String, // Order Payment / Refund / Cancel / Admin Adjustment
      required: true,
      trim: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment"
    },

    createdAt: {
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
   INSTANCE METHODS (SAFE OPERATIONS)
====================================================== */

// CREDIT AMOUNT (Refund / Cashback / Admin Credit)
walletSchema.methods.credit = function (amount, reason, orderId, paymentId) {
  this.balance += amount;

  this.transactions.unshift({
    type: "CREDIT",
    amount,
    reason,
    orderId,
    paymentId
  });
};

// DEBIT AMOUNT (Wallet Payment)
walletSchema.methods.debit = function (amount, reason, orderId, paymentId) {
  if (this.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  this.balance -= amount;

  this.transactions.unshift({
    type: "DEBIT",
    amount,
    reason,
    orderId,
    paymentId
  });
};

module.exports = mongoose.model("Wallet", walletSchema);
