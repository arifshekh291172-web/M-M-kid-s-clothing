const express = require("express");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

/* =========================
   GET ADDRESSES
========================= */
router.get("/", auth, async (req, res) => {
  res.json(req.user.addresses || []);
});

/* =========================
   ADD ADDRESS
========================= */
router.post("/", auth, async (req, res) => {
  req.user.addresses.push(req.body);
  await req.user.save();
  res.json({ success: true });
});

/* =========================
   UPDATE ADDRESS
========================= */
router.put("/:id", auth, async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  Object.assign(addr, req.body);
  await req.user.save();
  res.json({ success: true });
});

/* =========================
   DELETE ADDRESS
========================= */
router.delete("/:id", auth, async (req, res) => {
  req.user.addresses.id(req.params.id).remove();
  await req.user.save();
  res.json({ success: true });
});

module.exports = router;
