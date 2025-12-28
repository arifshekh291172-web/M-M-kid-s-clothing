const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // किस ticket से message जुड़ा है
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true
    },

    // message किसने भेजा
    sender: {
      type: String,
      enum: ["user", "admin", "ai"],
      required: true
    },

    // दिखाने के लिए नाम
    senderName: {
      type: String,
      default: "User"
    },

    // actual message text
    message: {
      type: String,
      required: true,
      trim: true
    },

    // message पढ़ा गया या नहीं (admin / user)
    seen: {
      type: Boolean,
      default: false
    },

    // AI से जुड़ा extra data (optional)
    aiMeta: {
      model: {
        type: String, // eg: gpt-4o-mini
        default: null
      },
      confidence: {
        type: Number, // 0.0 – 1.0
        default: null
      }
    }
  },
  {
    timestamps: true // createdAt + updatedAt
  }
);

module.exports = mongoose.model("Message", messageSchema);
