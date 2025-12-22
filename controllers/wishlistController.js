const Wishlist = require("../models/Wishlist");

/* ============================
   GET MY WISHLIST
============================ */
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate("products");

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: []
      });
    }

    res.json({ success: true, wishlist });
  } catch {
    res.json({ success: false, message: "Wishlist fetch failed" });
  }
};

/* ============================
   TOGGLE WISHLIST (ADD / REMOVE)
============================ */
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: []
      });
    }

    const exists = wishlist.products.includes(productId);

    if (exists) {
      wishlist.products.pull(productId);
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();

    res.json({
      success: true,
      added: !exists
    });
  } catch {
    res.json({ success: false, message: "Wishlist update failed" });
  }
};

/* ============================
   REMOVE FROM WISHLIST
============================ */
exports.removeFromWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    wishlist.products.pull(req.params.productId);
    await wishlist.save();

    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
};
