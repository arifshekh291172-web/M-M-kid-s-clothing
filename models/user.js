const mongoose = require("mongoose");

/* ---------------------------------
   ADDRESS SUB-SCHEMA (FLIPKART STYLE)
---------------------------------- */
const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true
    },

    addressLine2: {
      type: String,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      required: true,
      trim: true
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

/* ---------------------------------
   MAIN USER SCHEMA
---------------------------------- */
const userSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,        // email index
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      select: false        // hide password by default
    },

    /* ROLES */
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user"
    },

    /* ACCOUNT STATUS */
    isBlocked: {
      type: Boolean,
      default: false
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    /* OPTIONAL PROFILE */
    phone: {
      type: String,
      trim: true
    },

    avatar: {
      type: String
    },

    lastLogin: {
      type: Date
    },

    /* SAVED ADDRESSES */
    addresses: {
      type: [addressSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

/* ---------------------------------
   INDEXES (PERFORMANCE)
---------------------------------- */
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });

module.exports = mongoose.model("User", userSchema);
