const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const adminAuth = require("../middleware/authMiddleware");

/* ======================================================
   ✅ PUBLIC ROUTES (USER SIDE)
   Base path: /api/products
====================================================== */

// 🔹 GET ALL ACTIVE PRODUCTS
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
});

// 🔹 GET SINGLE PRODUCT
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Invalid product ID"
    });
  }
});

/* ======================================================
   ✅ ADMIN ROUTES
   Base path: /api/admin/products
====================================================== */

// 🔹 ADD PRODUCT (BASE64)
router.post("/", adminAuth, async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      description,
      price,
      originalPrice,
      sizes,
      badge,
      image,
      images
    } = req.body;

    if (!name || !category || !price || !originalPrice || !image) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      brand: brand || "",
      category: category.trim(),
      description: description || "",
      price,
      originalPrice,
      sizes: sizes || [],
      badge: badge || "",
      image,
      images: images || [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      product
    });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// 🔹 UPDATE PRODUCT
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
});

// 🔹 DELETE (SOFT DELETE)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: "Product deactivated"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
});

module.exports = router;
