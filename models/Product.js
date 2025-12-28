const mongoose = require("mongoose");

/* ======================================================
   PRODUCT SCHEMA (FLIPKART STYLE)
====================================================== */
const productSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    brand: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      default: ""
    },

    /* PRICING */
    price: {
      type: Number,
      required: true,
      min: 0
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    /* INVENTORY */
    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    /* RATINGS (AGGREGATE) */
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    reviews: {
      type: Number,
      default: 0
    },

    /* MEDIA */
    image: {
      type: String,
      required: true
    },

    images: {
      type: [String],
      default: []
    },

    badge: {
      type: String,
      enum: ["New", "Bestseller", "Popular", "Trending", "Hot Deal", ""],
      default: ""
    }
  },
  {
    timestamps: true
  }
);

/* ======================================================
   AUTO CALCULATE DISCOUNT %
====================================================== */
productSchema.pre("save", function (next) {
  if (
    this.originalPrice &&
    this.price &&
    this.originalPrice > this.price
  ) {
    this.discount = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  } else {
    this.discount = 0;
  }
  next();
});

/* ======================================================
   INDEXES (PERFORMANCE)
====================================================== */
productSchema.index({ name: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);