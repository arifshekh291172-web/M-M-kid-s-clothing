const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/authMiddleware");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Wallet = require("../models/Wallet");

const { sendOrderConfirmation } = require("../utils/sendEmail");

const router = express.Router();

/* ======================================================
   ADDRESS MANAGEMENT
====================================================== */

/* ADD ADDRESS */
router.post("/address", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.addresses || user.addresses.length === 0) {
      req.body.isDefault = true;
    }

    user.addresses.push(req.body);
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to save address" });
  }
});

/* GET ADDRESSES */
router.get("/address", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user.addresses || []);
});

/* SET DEFAULT ADDRESS */
router.post("/address/default", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.addresses.forEach(a => (a.isDefault = false));

  const addr = user.addresses.id(req.body.addressId);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  addr.isDefault = true;
  await user.save();

  res.json({ success: true });
});

/* UPDATE ADDRESS */
router.put("/address/:id", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const addr = user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: "Address not found" });

  Object.assign(addr, req.body);
  await user.save();

  res.json({ success: true });
});

/* DELETE ADDRESS */
router.delete("/address/:id", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.addresses = user.addresses.filter(
    a => a._id.toString() !== req.params.id
  );

  await user.save();
  res.json({ success: true });
});

/* ======================================================
   PLACE ORDER (ATOMIC TRANSACTION)
====================================================== */

router.post("/place-order", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { addressId, paymentMethod = "COD", useWallet = false } = req.body;

    /* USER */
    const user = await User.findById(req.user.id).session(session);
    if (!user) throw new Error("User not found");

    /* CART */
    const cart = await Cart.findOne({ user: user._id })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0)
      throw new Error("Cart is empty");

    /* ADDRESS */
    const address = user.addresses.id(addressId);
    if (!address) throw new Error("Invalid address");

    /* ITEMS + STOCK CHECK */
    let items = [];
    let subtotal = 0;

    for (const c of cart.items) {
      const product = c.product;

      if (!product || !product.isActive)
        throw new Error("Product unavailable");

      if (product.stock < c.quantity)
        throw new Error(`${product.name} out of stock`);

      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: c.quantity,
        image: product.image
      });

      subtotal += product.price * c.quantity;
    }

    const shippingCharge = subtotal >= 999 ? 0 : 49;
    let totalAmount = subtotal + shippingCharge;

    /* WALLET */
    let walletUsed = 0;
    let wallet = null;

    if (useWallet) {
      wallet = await Wallet.findOne({ userId: user._id }).session(session);
      if (wallet && wallet.balance > 0) {
        walletUsed = Math.min(wallet.balance, totalAmount);
        totalAmount -= walletUsed;
      }
    }

    /* CREATE ORDER */
    const [order] = await Order.create(
      [{
        userId: user._id,
        items,
        subtotal,
        shippingCharge,
        totalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
        shippingAddress: address,
        statusHistory: [{ status: "Pending" }]
      }],
      { session }
    );

    /* STOCK DEDUCTION */
    for (const c of cart.items) {
      await Product.updateOne(
        { _id: c.product._id },
        { $inc: { stock: -c.quantity } },
        { session }
      );
    }

    /* WALLET DEBIT */
    if (walletUsed > 0 && wallet) {
      wallet.balance -= walletUsed;
      wallet.transactions.unshift({
        type: "DEBIT",
        amount: walletUsed,
        reason: "Order Payment",
        orderId: order._id
      });
      await wallet.save({ session });
    }

    /* CLEAR CART */
    cart.items = [];
    await cart.save({ session });

    /* COMMIT */
    await session.commitTransaction();
    session.endSession();

    /* EMAIL */
    sendOrderConfirmation(user.email, order._id, order.totalAmount);

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("CHECKOUT FAILED:", err.message);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
