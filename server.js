require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/db");
const getAIReply = require("./utils/aiReply");

// MODELS
const Ticket = require("./models/Ticket");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

/* ======================================================
   DATABASE
====================================================== */
connectDB();

/* ======================================================
   MIDDLEWARES
====================================================== */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ======================================================
   STATIC FILES
====================================================== */
app.use(express.static(path.join(__dirname, "public")));

/* ======================================================
   SOCKET.IO SETUP
====================================================== */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* ======================================================
   API ROUTES
====================================================== */

// USER
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/checkout", require("./routes/checkoutRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
// app.use("/api/payment", require("./routes/paymentRoutes")); // 🔥 PAYMENT

// ADMIN
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* ======================================================
   HEALTH CHECK
====================================================== */
app.get("/", (req, res) => {
  res.send("✅ M&M Kid's Wear Backend + Payment + Live Chat Running");
});

/* ======================================================
   SOCKET.IO – LIVE CHAT
====================================================== */
io.on("connection", socket => {
  console.log("🟢 Socket Connected:", socket.id);

  socket.on("join_ticket", ticketId => {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) return;
    socket.join(ticketId);
  });

  socket.on("user_message", async ({ ticketId, userName, message }) => {
    try {
      if (!ticketId || !message) return;

      await Message.create({
        ticket: ticketId,
        sender: "user",
        senderName: userName || "User",
        message
      });

      io.to(ticketId).emit("receive_message", {
        sender: "user",
        senderName: userName || "User",
        message
      });

      const aiReply = await getAIReply(message);

      await Message.create({
        ticket: ticketId,
        sender: "ai",
        senderName: "M&M Kid's Wear AI",
        message: aiReply
      });

      io.to(ticketId).emit("receive_message", {
        sender: "ai",
        senderName: "M&M Kid's Wear AI",
        message: aiReply
      });

    } catch (err) {
      console.error("CHAT ERROR:", err);
    }
  });

  socket.on("admin_message", async ({ ticketId, adminName, message }) => {
    if (!ticketId || !message) return;

    await Message.create({
      ticket: ticketId,
      sender: "admin",
      senderName: adminName || "Admin",
      message
    });

    io.to(ticketId).emit("receive_message", {
      sender: "admin",
      senderName: adminName || "Admin",
      message
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected:", socket.id);
  });
});

/* ======================================================
   SUPPORT TICKET CREATE
====================================================== */
app.post("/api/support/ticket", async (req, res) => {
  try {
    const { name, email, message, issueType } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const ticket = await Ticket.create({
      name,
      email,
      issueType: issueType || "Other",
      status: "open"
    });

    await Message.create({
      ticket: ticket._id,
      sender: "user",
      senderName: name,
      message
    });

    res.json({
      success: true,
      ticketId: ticket._id
    });

  } catch (err) {
    console.error("SUPPORT ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* ======================================================
   ADMIN SUPPORT APIs
====================================================== */
app.get("/api/admin/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

app.get("/api/admin/tickets/:id/messages", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.json([]);
  }

  const messages = await Message.find({
    ticket: req.params.id
  }).sort({ createdAt: 1 });

  res.json(messages);
});

/* ======================================================
   RAZORPAY WEBHOOK (AUTO CONFIRM PAYMENT)
====================================================== */
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const crypto = require("crypto");
      const Payment = require("./models/Payment");
      const Order = require("./models/Order");

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const signature = req.headers["x-razorpay-signature"];

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(req.body)
        .digest("hex");

      if (expectedSignature !== signature) {
        return res.status(400).send("Invalid signature");
      }

      const event = JSON.parse(req.body);

      if (event.event === "payment.captured") {
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.order_id;

        await Payment.findOneAndUpdate(
          { razorpayOrderId: orderId },
          {
            razorpayPaymentId: paymentId,
            status: "PAID"
          }
        );

        await Order.findOneAndUpdate(
          { paymentId },
          {
            paymentStatus: "Paid",
            status: "Packed"
          }
        );
      }

      res.json({ status: "ok" });
    } catch (err) {
      console.error("WEBHOOK ERROR:", err);
      res.status(500).send("Webhook error");
    }
  }
);

/* ======================================================
   404 HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

/* ======================================================
   SERVER START
====================================================== */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
