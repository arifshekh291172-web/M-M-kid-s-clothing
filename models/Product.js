const mongoose = require("mongoose");

/* ======================================================
   SIZE SUB-SCHEMA (AGE / SIZE-WISE STOCK)
====================================================== */
const sizeSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
); 

/* ======================================================
   PRODUCT SCHEMA
====================================================== */
const productSchema = new mongoose.Schema(
  {
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

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    sizes: {
      type: [sizeSchema],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

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
  { timestamps: true }
);

/* ======================================================
   AUTO CALCULATE DISCOUNT %
====================================================== */
productSchema.pre("save", async function () {
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
});

/* ======================================================
   AUTO CALCULATE TOTAL STOCK FROM SIZES
====================================================== */
productSchema.pre("save", async function () {
  if (Array.isArray(this.sizes) && this.sizes.length > 0) {
    this.stock = this.sizes.reduce(
      (total, s) => total + (Number(s.stock) || 0),
      0
    );
  } else {
    this.stock = 0;
  }
});

/* ======================================================
   TEXT SEARCH INDEX
====================================================== */
productSchema.index({ name: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);
