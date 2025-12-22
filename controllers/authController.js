const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* SEND OTP */
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.json({ success: false, message: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000);

  await Otp.deleteMany({ email });

  await Otp.create({
    email,
    otp,
    expiry: Date.now() + 5 * 60 * 1000
  });

  console.log("OTP:", otp); // later send via email

  res.json({ success: true });
};

/* VERIFY OTP */
exports.verifyOtp = async (req, res) => {
  console.log("VERIFY OTP BODY:", req.body);

  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  const record = await Otp.findOne({ email, otp });

  if (!record || record.expiry < Date.now()) {
    return res.json({
      success: false,
      message: "Invalid or expired OTP"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true
  });

  await Otp.deleteMany({ email });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
};
