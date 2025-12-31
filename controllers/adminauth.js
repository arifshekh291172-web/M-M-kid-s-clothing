const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await User.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Admin access denied" });
    }

    req.user = admin;
    next();

  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
