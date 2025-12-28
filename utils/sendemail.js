const nodemailer = require("nodemailer");

/* ======================================================
   EMAIL TRANSPORTER (GMAIL / SMTP)
====================================================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ======================================================
   BASE SEND FUNCTION
====================================================== */
async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"M&M Kid's Wear" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

/* ======================================================
   1️⃣ SEND OTP (LOGIN / SIGNUP / VERIFY)
====================================================== */
async function sendOTP(email, otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2 style="color:#2563eb">M&M Kid's Wear Verification Code</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This OTP is valid for <b>5 minutes</b>.</p>
      <p style="color:#64748b;font-size:13px">
        If you did not request this, please ignore this email.
      </p>
    </div>
  `;

  return sendMail({
    to: email,
    subject: "Your M&M Kid's Wear OTP",
    html
  });
}

/* ======================================================
   2️⃣ ORDER STATUS UPDATE EMAIL
====================================================== */
async function sendOrderStatusEmail(email, orderId, status) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2>Order Status Updated</h2>
      <p>Your order status has been updated.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Current Status:</b> ${status}</p>
      <p>Thank you for shopping with <b>M&M Kid's Wear</b>.</p>
    </div>
  `;

  return sendMail({
    to: email,
    subject: `Order Update – ${status}`,
    html
  });
}

/* ======================================================
   3️⃣ REFUND / WALLET CREDIT EMAIL
====================================================== */
async function sendRefundEmail(email, orderId, amount) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2 style="color:#16a34a">Refund Successful</h2>
      <p>Your refund has been processed successfully.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Amount Credited:</b> ₹${amount}</p>
      <p>The amount has been credited to your <b>M&M Kid's Wear Wallet</b>.</p>
    </div>
  `;

  return sendMail({
    to: email,
    subject: "Refund Processed – M&M Kid's Wear",
    html
  });
}

/* ======================================================
   4️⃣ ORDER CONFIRMATION EMAIL
====================================================== */
async function sendOrderConfirmation(email, orderId, amount) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <h2>Order Placed Successfully 🎉</h2>
      <p>Your order has been placed.</p>
      <p><b>Order ID:</b> ${orderId}</p>
      <p><b>Total Amount:</b> ₹${amount}</p>
      <p>We will notify you as your order progresses.</p>
    </div>
  `;

  return sendMail({
    to: email,
    subject: "Order Confirmed – M&M Kid's Wear",
    html
  });
}

/* ======================================================
   5️⃣ GENERIC EMAIL (ADMIN / SUPPORT)
====================================================== */
async function sendGenericEmail(to, subject, message) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px">
      <p>${message}</p>
      <p>– M&M Kid's Wear Team</p>
    </div>
  `;

  return sendMail({
    to,
    subject,
    html
  });
}

/* ======================================================
   EXPORTS
====================================================== */
module.exports = {
  sendOTP,
  sendOrderStatusEmail,
  sendRefundEmail,
  sendOrderConfirmation,
  sendGenericEmail
};
