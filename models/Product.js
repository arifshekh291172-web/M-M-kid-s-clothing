const mongoose = require("mongoose");

/* ======================================================
   SIZE SUB-SCHEMA (AGE / SIZE-WISE STOCK)
====================================================== */
const sizeSchema = new mongoose.Schema(
  {
    label: {
      type: String,          // e.g. "1Y-2Y", "2Y-3Y"
      required: true,
      trim: true
    },
    stock: {
      type: Number,          // stock for that size
      required: true,
      min: 0
    }
  },
  { _id: false }
);

/* ======================================================
   PRODUCT SCHEMA (E-COMMERCE READY)
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
      type: Number,          // auto calculated %
      default: 0
    },

    /* INVENTORY */
    stock: {
      type: Number,          // total stock (auto from sizes)
      default: 0,
      min: 0
    },

    sizes: {
      type: [sizeSchema],    // size-wise stock
      default: []
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    /* RATINGS */
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

    /* MEDIA (BASE64 IMAGES) */
    image: {
      type: String,          // main image (BASE64)
      required: true
    },

    images: {
      type: [String],        // extra images (BASE64)
      default: []
    },

    /* BADGE */
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
   AUTO CALCULATE TOTAL STOCK FROM SIZES
====================================================== */
productSchema.pre("save", function (next) {
  if (Array.isArray(this.sizes) && this.sizes.length > 0) {
    this.stock = this.sizes.reduce(
      (total, s) => total + (Number(s.stock) || 0),
      0
    );
  } else {
    this.stock = 0;
  }
  next();
});

/* ======================================================
   TEXT SEARCH INDEX
====================================================== */
productSchema.index({ name: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);
