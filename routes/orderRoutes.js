const express = require("express");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const PDFDocument = require("pdfkit");

const router = express.Router();

/* =========================================================
   USER: PLACE ORDER (SIZE-WISE STOCK MINUS)
========================================================= */
router.post("/place", auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product)
        return res.status(404).json({ message: "Product not found" });

      const sizeObj = product.sizes.find(s => s.label === item.size);
      if (!sizeObj)
        return res.status(400).json({ message: "Size not available" });

      if (sizeObj.stock < item.quantity)
        return res.status(400).json({
          message: `Only ${sizeObj.stock} left for ${item.size}`
        });

      // 🔻 SIZE-WISE STOCK MINUS
      sizeObj.stock -= item.quantity;
      subtotal += product.price * item.quantity;

      // ❌ Remove zero stock size
      product.sizes = product.sizes.filter(s => s.stock > 0);
      await product.save();
    }

    const order = await Order.create({
      userId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCharge: 0,
      discount: 0,
      totalAmount: subtotal,
      paymentStatus: "Paid",
      status: "Pending",
      statusHistory: [{ status: "Pending" }]
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      orderId: order._id
    });
  } catch (err) {
    console.error("ORDER PLACE ERROR:", err);
    res.status(500).json({ message: "Order failed" });
  }
});

/* =========================================================
   USER: GET MY ORDERS
========================================================= */
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* =========================================================
   USER: GET SINGLE ORDER
========================================================= */
router.get("/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  res.json(order);
});

/* =========================================================
   USER: DOWNLOAD INVOICE PDF
========================================================= */
router.get("/invoice/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=Invoice-${order._id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(22).text("M&M Kid's Wear Invoice", { align: "center" });
  doc.moveDown();

  doc.text(`Order ID: ${order._id}`);
  doc.text(`Order Date: ${order.createdAt.toDateString()}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.text(`Status: ${order.status}`);
  doc.moveDown();

  doc.fontSize(14).text("Items", { underline: true });
  order.items.forEach(i => {
    doc.fontSize(12).text(
      `${i.name} (${i.size}) × ${i.quantity} = ₹${i.price * i.quantity}`
    );
  });

  doc.moveDown();
  doc.fontSize(14).text(`Total: ₹${order.totalAmount}`);

  doc.end();
});

/* =========================================================
   USER: CANCEL ORDER (SIZE-WISE STOCK RESTORE)
========================================================= */
router.post("/cancel/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  if (order.status !== "Pending")
    return res.status(400).json({ message: "Cannot cancel now" });

  // 🔁 Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;

    let sizeObj = product.sizes.find(s => s.label === item.size);
    if (sizeObj) {
      sizeObj.stock += item.quantity;
    } else {
      product.sizes.push({
        label: item.size,
        stock: item.quantity
      });
    }
    await product.save();
  }

  order.status = "Cancelled";
  order.paymentStatus = "Refunded";
  order.statusHistory.push({ status: "Cancelled" });
  await order.save();

  req.user.wallet += order.totalAmount;
  await req.user.save();

  res.json({ success: true, message: "Order cancelled & stock restored" });
});

/* =========================================================
   USER: RETURN REQUEST
========================================================= */
router.post("/return/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  if (order.status !== "Delivered")
    return res.status(400).json({ message: "Return not allowed" });

  order.status = "Refund Requested";
  order.statusHistory.push({ status: "Refund Requested" });
  await order.save();

  res.json({ success: true, message: "Return request submitted" });
});

module.exports = router;
