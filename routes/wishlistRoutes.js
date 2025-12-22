const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getWishlist,
  toggleWishlist,
  removeFromWishlist
} = require("../controllers/wishlistController");

/* =====================================
   WISHLIST ROUTES (PROTECTED)
===================================== */

/**
 * @route   GET /api/wishlist
 * @desc    Get logged-in user's wishlist
 * @access  Private
 */
router.get("/", auth, getWishlist);

/**
 * @route   POST /api/wishlist/toggle
 * @desc    Add / Remove product from wishlist
 * @access  Private
 */
router.post("/toggle", auth, toggleWishlist);

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete("/:productId", auth, removeFromWishlist);

module.exports = router;
