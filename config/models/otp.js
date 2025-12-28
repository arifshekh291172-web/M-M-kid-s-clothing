const mongoose = require("mongoose");

/* ======================================================
   OTP SCHEMA (EMAIL OTP AUTH)
====================================================== */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    otp: {
      type: String,
      required: true
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/* ======================================================
   AUTO DELETE OTP AFTER EXPIRY (TTL INDEX)
   MongoDB will remove record automatically
====================================================== */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ======================================================
   SAFETY: ONE OTP PER EMAIL
====================================================== */
//  { unique: true });

module.exports = mongoose.model("Otp", otpSchema);
