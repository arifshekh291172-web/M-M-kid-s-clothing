const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    issueType: {
      type: String,
      enum: [
        "Order Issue",
        "Payment Problem",
        "Return / Refund",
        "Technical Issue",
        "Other"
      ],
      default: "Other"
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open"
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal"
    },

    assignedTo: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/* ✅ CORRECT PRE-SAVE HOOK */
ticketSchema.pre("save", function () {
  if (!this.ticketNumber) {
    this.ticketNumber =
      "SH-" + Date.now() + "-" + Math.floor(1000 + Math.random() * 9000);
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);
