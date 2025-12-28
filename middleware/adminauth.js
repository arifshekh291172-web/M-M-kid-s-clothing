const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token)
      return res.status(401).json({ message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin" && decoded.role !== "superadmin")
      return res.status(403).json({ message: "Admin access denied" });

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
