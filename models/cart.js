const mongoose = require("mongoose");

/* ======================================================
   CART ITEM SUB-SCHEMA
   - One product + quantity
====================================================== */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    _id: false
  }
);

/* ======================================================
   MAIN CART SCHEMA
   - One cart per user
====================================================== */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    items: {
      type: [cartItemSchema],
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


module.exports = mongoose.model("Cart", cartSchema);
