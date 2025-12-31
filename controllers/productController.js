const Product = require("../models/Product");

/* ======================================================
   ADD PRODUCT (ADMIN) – BASE64 IMAGE
====================================================== */
exports.addProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("IMAGE LENGTH:", req.body.image?.length);

    const {
      name,
      brand,
      category,
      description,
      price,
      originalPrice,
      badge,
      sizes,
      image,
      images
    } = req.body;

    /* ===== BASIC VALIDATION ===== */
    if (
      !name ||
      !brand ||
      !category ||
      !price ||
      !originalPrice ||
      !image ||
      !sizes ||
      !sizes.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const product = await Product.create({
      name,
      brand,
      category,
      description,
      price,
      originalPrice,
      badge,
      sizes,          // [{ label, stock }]
      image,          // BASE64 main image
      images: images || [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });

  } catch (err) {
    console.error("Add Product Error:", err.message);

    res.status(500).json({
      success: false,
      message: err.message || "Failed to add product"
    });
  }
};

/* ======================================================
   GET ALL PRODUCTS (INDEX PAGE)
====================================================== */
exports.getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let filter = { isActive: true };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};

/* ======================================================
   GET SINGLE PRODUCT
====================================================== */
exports.getProductById = async (req, res) => {
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
    console.error("Get Product By ID Error:", err);
    res.status(400).json({
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
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
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
    res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};

/* ======================================================
   DELETE / DEACTIVATE PRODUCT
====================================================== */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
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
    res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};
