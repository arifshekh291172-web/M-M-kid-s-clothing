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
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

/* ======================================================
   SOCKET.IO SETUP
====================================================== */
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* ======================================================
   API ROUTES
====================================================== */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/checkout", require("./routes/checkoutRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));

app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

/* ======================================================
   HEALTH CHECK
====================================================== */
app.get("/", (req, res) => {
  res.send("✅ M&M Kid's Wear Backend + Live Chat Running");
});

/* ======================================================
   SOCKET.IO – LIVE CHAT
====================================================== */
io.on("connection", socket => {
  console.log("🟢 Socket Connected:", socket.id);

  // Join ticket room
  socket.on("join_ticket", ticketId => {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) return;
    socket.join(ticketId);
    console.log("📩 Joined Ticket:", ticketId);
  });

  // USER MESSAGE
  socket.on("user_message", async ({ ticketId, userName, message }) => {
    try {
      if (
        !ticketId ||
        !mongoose.Types.ObjectId.isValid(ticketId) ||
        !message
      ) return;

      // Save user message
      await Message.create({
        ticket: ticketId,
        sender: "user",
        senderName: userName || "User",
        message,
        seen: false
      });

      io.to(ticketId).emit("receive_message", {
        sender: "user",
        senderName: userName || "User",
        message
      });

      // AI AUTO REPLY
      const aiReply = await getAIReply(message);

      await Message.create({
        ticket: ticketId,
        sender: "ai",
        senderName: "M&M Kid's Wear AI",
        message: aiReply,
        seen: false,
        aiMeta: {
          model: "gpt-4o-mini",
          confidence: 0.85
        }
      });

      io.to(ticketId).emit("receive_message", {
        sender: "ai",
        senderName: "M&M Kid's Wear AI",
        message: aiReply
      });

    } catch (err) {
      console.error("❌ USER MESSAGE ERROR:", err);
    }
  });

  // ADMIN MESSAGE
  socket.on("admin_message", async ({ ticketId, adminName, message }) => {
    try {
      if (
        !ticketId ||
        !mongoose.Types.ObjectId.isValid(ticketId) ||
        !message
      ) return;

      await Message.create({
        ticket: ticketId,
        sender: "admin",
        senderName: adminName || "Admin",
        message,
        seen: false
      });

      io.to(ticketId).emit("receive_message", {
        sender: "admin",
        senderName: adminName || "Admin",
        message
      });

    } catch (err) {
      console.error("❌ ADMIN MESSAGE ERROR:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected:", socket.id);
  });
});

/* ======================================================
   CREATE SUPPORT TICKET API
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

    // Create ticket
    const ticket = await Ticket.create({
      name,
      email,
      issueType: issueType || "Other",
      status: "open",
      priority: "normal"
    });

    // Save first message
    await Message.create({
      ticket: ticket._id,
      sender: "user",
      senderName: name,
      message,
      seen: false
    });

    res.json({
      success: true,
      ticketId: ticket._id
    });

  } catch (err) {
    console.error("❌ SUPPORT TICKET ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/* ======================================================
   ADMIN – GET ALL TICKETS
====================================================== */
app.get("/api/admin/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

/* ======================================================
   ADMIN – GET TICKET MESSAGES
====================================================== */
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
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
