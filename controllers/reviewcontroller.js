const Review = require("../models/Review");
const Product = require("../models/Product");

exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    await Review.create({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });

    const reviews = await Review.find({ product: productId });
    const avg =
      reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: avg.toFixed(1),
      reviews: reviews.length
    });

    res.json({ success: true });
  } catch {
    res.json({ success: false, message: "Review failed" });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId
    }).sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch {
    res.json({ success: false, message: "Reviews fetch failed" });
  }
};
