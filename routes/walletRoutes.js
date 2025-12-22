const express = require("express");
const auth = require("../middleware/authMiddleware");
const Wallet = require("../models/Wallet");

const router = express.Router();

/* GET MY WALLET */
router.get("/", auth, async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user._id });
  res.json(wallet);
});

module.exports = router;
