const Product = require("../models/Product");

/* ======================================================
   ADD PRODUCT (ADMIN)
====================================================== */
exports.addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.json({
      success: true,
      message: "Product added successfully",
      product
    });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.json({
      success: false,
      message: "Failed to add product"
    });
  }
};

/* ======================================================
   GET ALL PRODUCTS (INDEX PAGE)
   Supports: category, search
====================================================== */
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = { isActive: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (err) {
    console.error("Get Products Error:", err);
    res.json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};

/* ======================================================
   GET SINGLE PRODUCT (PRODUCT DETAIL PAGE)
====================================================== */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (err) {
    console.error("Get Product By ID Error:", err);
    res.json({
      success: false,
      message: "Invalid product ID"
    });
  }
};

/* ======================================================
   UPDATE PRODUCT (ADMIN)
====================================================== */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (err) {
    console.error("Update Product Error:", err);
    res.json({
      success: false,
      message: "Failed to update product"
    });
  }
};

/* ======================================================
   DELETE / DEACTIVATE PRODUCT (ADMIN)
====================================================== */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product removed successfully"
    });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.json({
      success: false,
      message: "Failed to delete product"
    });
  }
};

/* ======================================================
   REDUCE STOCK AFTER ORDER (CHECKOUT)
====================================================== */
exports.reduceStock = async (req, res) => {
  try {
    const { cart } = req.body;

    if (!cart || !cart.length) {
      return res.json({
        success: false,
        message: "Cart is empty"
      });
    }

    for (const item of cart) {
      const product = await Product.findById(item._id);

      if (!product) {
        return res.json({
          success: false,
          message: "Product not found"
        });
      }

      if (product.stock < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      product.stock -= item.quantity;
      await product.save();
    }

    res.json({
      success: true,
      message: "Stock updated successfully"
    });
  } catch (err) {
    console.error("Reduce Stock Error:", err);
    res.json({
      success: false,
      message: "Stock update failed"
    });
  }
};
