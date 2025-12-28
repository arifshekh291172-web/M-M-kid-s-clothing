const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  reduceStock
} = require("../controllers/productController");

/* ======================================================
   ADMIN ROUTES
====================================================== */

// Add product
router.post("/add", addProduct);

// Update product
router.put("/:id", updateProduct);

// Delete / deactivate product
router.delete("/:id", deleteProduct);

/* ======================================================
   PUBLIC ROUTES
====================================================== */

// Get all products (index.html, category, search)
router.get("/", getProducts);

// Get single product (product detail page)
router.get("/:id", getProductById);

/* ======================================================
   ORDER / STOCK
====================================================== */

// Reduce stock after checkout
router.put("/reduce-stock", reduceStock);

module.exports = router;
