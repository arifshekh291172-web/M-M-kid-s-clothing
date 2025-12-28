const User = require("../models/User");
const Order = require("../models/Order");

exports.getDashboardStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const orders = await Order.countDocuments();

    res.json({
      success: true,
      stats: { users, orders }
    });
  } catch {
    res.json({ success: false, message: "Admin stats failed" });
  }
};
