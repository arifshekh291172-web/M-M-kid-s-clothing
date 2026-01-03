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
   🔥 RAZORPAY WEBHOOK (MUST BE BEFORE express.json)
   NOTE: This route uses express.raw internally
====================================================== */
app.use("/api/payments", require("./routes/paymentRoutes"));

/* ======================================================
   GLOBAL MIDDLEWARES
====================================================== */
app.use(cors({ origin: "*" }));

// JSON & LARGE PAYLOAD SUPPORT (BASE64 images, etc.)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ======================================================
   STATIC FILES
====================================================== */
app.use(express.static(path.join(__dirname, "public")));

/* ======================================================
   ROOT ROUTE
====================================================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ======================================================
   SOCKET.IO SETUP
====================================================== */
const io = new Server(server, {
  cors: { origin: "*" }
});

/* ======================================================
   API ROUTES
====================================================== */

// 🔹 PUBLIC
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/checkout", require("./routes/checkoutRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));

// 🔹 ADMIN
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* ======================================================
   SOCKET.IO – LIVE SUPPORT CHAT
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
      console.error("CHAT ERROR:", err.message);
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
    console.error("SUPPORT ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */
app.use((err, req, res, next) => {
  console.error("🔥 SERVER ERROR:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Server error"
  });
});

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
