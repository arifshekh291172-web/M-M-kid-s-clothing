const mongoose = require("mongoose");

/* ---------------------------------
   ORDER ITEM SUB-SCHEMA
---------------------------------- */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    image: {
      type: String
    }
  },
  { _id: false }
);

/* ---------------------------------
   STATUS HISTORY (TRACKING)
---------------------------------- */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

/* ---------------------------------
   MAIN ORDER SCHEMA
---------------------------------- */
const orderSchema = new mongoose.Schema(
  {
    /* USER */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* ITEMS */
    items: {
      type: [orderItemSchema],
      required: true
    },

    /* PRICING */
    subtotal: {
      type: Number,
      required: true
    },

    shippingCharge: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      required: true
    },

    /* PAYMENT */
    paymentMethod: {
      type: String,
      enum: ["COD", "UPI", "CARD", "NETBANKING"],
      default: "COD"
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },

    paymentId: {
      type: String
    },

    /* ORDER STATUS */
    status: {
      type: String,
      enum: [
        "Pending",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Refund Requested",
        "Refunded"
      ],
      default: "Pending"
    },

    /* STATUS TIMELINE (TRACKING) */
    statusHistory: {
      type: [statusHistorySchema],
      default: [{ status: "Pending" }]
    },

    /* RETURN / REFUND */
    returnReason: {
      type: String
    },

    refundAmount: {
      type: Number,
      default: 0
    },

    /* SHIPPING ADDRESS (SNAPSHOT) */
    shippingAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String
    },

    /* ADMIN */
    adminNote: {
      type: String
    }
  },
  {
    timestamps: true // createdAt & updatedAt
  }
);

/* ---------------------------------
   INDEXES (PERFORMANCE)
---------------------------------- */
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
// orderSchema.index({ userId: 1 });

module.exports = mongoose.model("Order", orderSchema);
