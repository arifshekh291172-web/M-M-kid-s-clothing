const Cart = require("../models/Cart");
const Product = require("../models/Product");

/* ======================================================
   GET MY CART
====================================================== */
exports.getMyCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product");

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.json({
      success: true,
      cart
    });
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.json({
      success: false,
      message: "Failed to fetch cart"
    });
  }
};

/* ======================================================
   ADD ITEM TO CART
====================================================== */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.json({
        success: false,
        message: "Product not available"
      });
    }

    if (product.stock < quantity) {
      return res.json({
        success: false,
        message: "Insufficient stock"
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const item = cart.items.find(
      i => i.product.toString() === productId
    );

    if (item) {
      if (product.stock < item.quantity + quantity) {
        return res.json({
          success: false,
          message: "Stock limit exceeded"
        });
      }
      item.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    res.json({
      success: true,
      message: "Item added to cart",
      cart
    });
  } catch (err) {
    console.error("Add To Cart Error:", err);
    res.json({
      success: false,
      message: "Failed to add to cart"
    });
  }
};

/* ======================================================
   UPDATE CART ITEM QUANTITY
====================================================== */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (quantity < 1) {
      return res.json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.json({
        success: false,
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      i => i.product.toString() === productId
    );

    if (!item) {
      return res.json({
        success: false,
        message: "Item not found in cart"
      });
    }

    const product = await Product.findById(productId);
    if (product.stock < quantity) {
      return res.json({
        success: false,
        message: "Insufficient stock"
      });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({
      success: true,
      message: "Cart updated",
      cart
    });
  } catch (err) {
    console.error("Update Cart Error:", err);
    res.json({
      success: false,
      message: "Failed to update cart"
    });
  }
};

/* ======================================================
   REMOVE ITEM FROM CART
====================================================== */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      i => i.product.toString() !== productId
    );

    await cart.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      cart
    });
  } catch (err) {
    console.error("Remove Cart Item Error:", err);
    res.json({
      success: false,
      message: "Failed to remove item"
    });
  }
};

/* ======================================================
   CLEAR CART (AFTER ORDER)
====================================================== */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: "Cart cleared"
    });
  } catch (err) {
    console.error("Clear Cart Error:", err);
    res.json({
      success: false,
      message: "Failed to clear cart"
    });
  }
};
