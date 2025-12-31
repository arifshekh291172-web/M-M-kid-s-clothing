const express = require("express");
const router = express.Router();

const {
  getProducts,
  getProductById
} = require("../controllers/productController");

/* ======================================================
   PUBLIC PRODUCT ROUTES
   Base path: /api/products
====================================================== */

// 🔹 GET ALL PRODUCTS
// Example: GET /api/products
router.get("/", getProducts);

// 🔹 GET SINGLE PRODUCT BY ID
// Example: GET /api/products/:id
// ⚠️ Always LAST (dynamic route)
router.get("/:id", getProductById);

module.exports = router;
