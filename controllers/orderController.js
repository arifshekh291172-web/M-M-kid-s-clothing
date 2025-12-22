const Order = require("../models/Order");
const Product = require("../models/Product");

/* ======================================================
   CREATE ORDER (USER)
====================================================== */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      subtotal,
      shippingCharge,
      discount,
      totalAmount,
      paymentMethod,
      shippingAddress
    } = req.body;

    if (!items || !items.length) {
      return res.json({
        success: false,
        message: "Order items missing"
      });
    }

    // ✅ Reduce stock safely
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product)
        return res.json({
          success: false,
          message: "Product not found"
        });

      if (product.stock < item.quantity)
        return res.json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });

      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      userId: req.user.id,
      items,
      subtotal,
      shippingCharge,
      discount,
      totalAmount,
      paymentMethod,
      shippingAddress,
      statusHistory: [{ status: "Pending" }]
    });

    res.json({
      success: true,
      message: "Order placed successfully",
      order
    });

  } catch (err) {
    console.error("Create Order Error:", err);
    res.json({
      success: false,
      message: "Order creation failed"
    });
  }
};

/* ======================================================
   GET USER ORDERS
====================================================== */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch {
    res.json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

/* ======================================================
   GET SINGLE ORDER (USER / ADMIN)
====================================================== */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res.json({
        success: false,
        message: "Order not found"
      });

    // user can see only own order
    if (
      order.userId.toString() !== req.user.id &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.json({
      success: true,
      order
    });
  } catch {
    res.json({
      success: false,
      message: "Invalid order ID"
    });
  }
};

/* ======================================================
   CANCEL ORDER (USER)
====================================================== */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res.json({
        success: false,
        message: "Order not found"
      });

    if (order.status !== "Pending") {
      return res.json({
        success: false,
        message: "Order cannot be cancelled"
      });
    }

    order.status = "Cancelled";
    order.statusHistory.push({ status: "Cancelled" });
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled"
    });
  } catch {
    res.json({
      success: false,
      message: "Cancel failed"
    });
  }
};

/* ======================================================
   UPDATE ORDER STATUS (ADMIN)
====================================================== */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.json({
        success: false,
        message: "Order not found"
      });

    order.status = status;
    order.adminNote = adminNote || "";
    order.statusHistory.push({ status });

    // auto payment status
    if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated",
      order
    });
  } catch {
    res.json({
      success: false,
      message: "Status update failed"
    });
  }
};

/* ======================================================
   REQUEST RETURN / REFUND (USER)
====================================================== */
exports.requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.json({
        success: false,
        message: "Order not found"
      });

    if (order.status !== "Delivered") {
      return res.json({
        success: false,
        message: "Return not allowed"
      });
    }

    order.status = "Refund Requested";
    order.returnReason = reason;
    order.statusHistory.push({ status: "Refund Requested" });

    await order.save();

    res.json({
      success: true,
      message: "Return request submitted"
    });
  } catch {
    res.json({
      success: false,
      message: "Return request failed"
    });
  }
};

/* ======================================================
   ADMIN PROCESS REFUND
====================================================== */
exports.processRefund = async (req, res) => {
  try {
    const { refundAmount } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order)
      return res.json({
        success: false,
        message: "Order not found"
      });

    order.status = "Refunded";
    order.paymentStatus = "Refunded";
    order.refundAmount = refundAmount || order.totalAmount;
    order.statusHistory.push({ status: "Refunded" });

    await order.save();

    res.json({
      success: true,
      message: "Refund processed"
    });
  } catch {
    res.json({
      success: false,
      message: "Refund failed"
    });
  }
};
