const express = require("express");
const router = express.Router();

const {
  addProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

const adminAuth = require("../middleware/adminController");

/* ======================================================
   ADMIN PRODUCT ROUTES
   Base path: /api/admin/products
====================================================== */

// 🔹 ADD PRODUCT (BASE64)
router.post("/products", adminAuth, addProduct);

// 🔹 UPDATE PRODUCT
router.put("/products/:id", adminAuth, updateProduct);

// 🔹 DELETE / DEACTIVATE PRODUCT
router.delete("/products/:id", adminAuth, deleteProduct);

module.exports = router;
