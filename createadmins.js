/**
 * RUN THIS FILE ONCE ONLY
 * node createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// DB connect
const connectDB = require("./config/db");
const User = require("./models/User");

const ADMINS = [
  {
    name: "Shop Admin",
    email: "shop@mmkids.com",
    password: "M&Mkids@2025",
    role: "admin"
  },
  {
    name: "Support Admin",
    email: "support@mmkids.com",
    password: "Arif@mmkids.com",
    role: "admin"
  }
];

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    for (const admin of ADMINS) {
      const existing = await User.findOne({ email: admin.email });

      if (existing) {
        console.log(`⚠️ Admin already exists: ${admin.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await User.create({
        name: admin.name,
        email: admin.email,
        password: hashedPassword,
        role: admin.role,
        isVerified: true
      });

      console.log(`🟢 Admin created: ${admin.email}`);
    }

    console.log("🎉 All admins processed successfully");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR creating admins:", err);
    process.exit(1);
  }
})();
