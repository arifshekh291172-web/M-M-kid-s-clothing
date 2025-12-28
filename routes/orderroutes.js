const express = require("express");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const PDFDocument = require("pdfkit");

const router = express.Router();

/* =========================================================
   USER: GET MY ORDERS
========================================================= */
router.get("/my", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("MY ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* =========================================================
   USER: GET SINGLE ORDER (DETAILS + TRACKING)
========================================================= */
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error("ORDER DETAIL ERROR:", err);
    res.status(500).json({ message: "Failed to fetch order" });
  }
});

/* =========================================================
   USER: DOWNLOAD INVOICE PDF
========================================================= */
router.get("/invoice/:id", auth, async (req, res) => {
  try {
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
      `inline; filename=M&M Kid's Wear-Invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    /* HEADER */
    doc.fontSize(22).text("M&M Kid's Wear Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    /* SHIPPING */
    const a = order.shippingAddress;
    doc.fontSize(14).text("Shipping Address", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(
      `${a.name}\n${a.phone}\n${a.addressLine1}, ${a.addressLine2 || ""}\n${a.city}, ${a.state} - ${a.pincode}`
    );
    doc.moveDown();

    /* ITEMS */
    doc.fontSize(14).text("Order Items", { underline: true });
    doc.moveDown(0.5);
    order.items.forEach(item => {
      doc.fontSize(12).text(
        `${item.name} × ${item.quantity}   ₹${item.price * item.quantity}`
      );
    });

    doc.moveDown();

    /* TOTAL */
    doc.fontSize(12);
    doc.text(`Subtotal: ₹${order.subtotal}`);
    doc.text(`Shipping: ₹${order.shippingCharge}`);
    doc.text(`Discount: -₹${order.discount}`);
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Total Amount: ₹${order.totalAmount}`, { bold: true });

    doc.moveDown(2);
    doc.fontSize(10).text(
      "Thank you for shopping with M&M Kid's Wear!",
      { align: "center" }
    );

    doc.end();
  } catch (err) {
    console.error("INVOICE ERROR:", err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});

/* =========================================================
   USER: CANCEL ORDER (ONLY PENDING)
========================================================= */
router.post("/cancel/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Pending")
      return res.status(400).json({ message: "Order cannot be cancelled now" });

    order.status = "Cancelled";
    order.paymentStatus = "Refunded";
    order.statusHistory.push({ status: "Cancelled" });

    await order.save();

    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    res.status(500).json({ message: "Cancel failed" });
  }
});

/* =========================================================
   USER: REQUEST RETURN / REFUND (AFTER DELIVERY)
========================================================= */
router.post("/return/:id", auth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error("RETURN ERROR:", err);
    res.status(500).json({ message: "Return request failed" });
  }
});

/* =========================
   CANCEL ORDER (USER)
========================= */
router.post("/cancel/:id", auth, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!order)
    return res.status(404).json({ message: "Order not found" });

  if (order.status !== "Pending")
    return res.status(400).json({ message: "Cannot cancel now" });

  order.status = "Cancelled";
  order.paymentStatus = "Refunded";
  await order.save();

  // 👉 Wallet credit
  req.user.wallet += order.totalAmount;
  await req.user.save();

  res.json({ success: true });
});

/* =========================
   RETURN REQUEST
========================= */
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
  await order.save();

  res.json({ success: true });
});


module.exports = router;
