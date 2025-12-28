const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const adminAuth = require("../middleware/adminAuth");
const Product = require("../models/Product");

const router = express.Router();

/* CLOUDINARY CONFIG */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* MULTER (MEMORY STORAGE) */
const upload = multer({ storage: multer.memoryStorage() });

/* ===============================
   ADD PRODUCT (REAL)
================================ */
router.post(
  "/products",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        brand,
        category,
        description,
        price,
        originalPrice,
        stock,
        badge
      } = req.body;

      if (!req.files || !req.files.image) {
        return res.status(400).json({ message: "Main image required" });
      }

      /* UPLOAD MAIN IMAGE */
      const main = await cloudinary.uploader.upload(
        `data:${req.files.image[0].mimetype};base64,${req.files.image[0].buffer.toString("base64")}`
      );

      /* EXTRA IMAGES */
      const extras = [];
      if (req.files.images) {
        for (let file of req.files.images) {
          const up = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
          );
          extras.push(up.secure_url);
        }
      }

      const product = await Product.create({
        name,
        brand,
        category,
        description,
        price: Number(price),
        originalPrice: Number(originalPrice),
        stock: Number(stock || 0),
        badge: badge || "",
        image: main.secure_url,
        images: extras
      });

      res.json({ success: true, product });

    } catch (err) {
      console.error("ADD PRODUCT ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
