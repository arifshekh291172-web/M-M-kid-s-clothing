const User = require("../models/User");
const bcrypt = require("bcryptjs");

/* ======================================================
   GET MY PROFILE (USER)
====================================================== */
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};

/* ======================================================
   UPDATE PROFILE (USER)
====================================================== */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated",
      user
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Profile update failed"
    });
  }
};

/* ======================================================
   CHANGE PASSWORD (USER)
====================================================== */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.json({
        success: false,
        message: "Old password incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password updated"
    });
  } catch {
    res.json({
      success: false,
      message: "Password change failed"
    });
  }
};

/* ======================================================
   ADD ADDRESS
====================================================== */
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // if default → unset others
    if (req.body.isDefault) {
      user.addresses.forEach(addr => (addr.isDefault = false));
    }

    user.addresses.push(req.body);
    await user.save();

    res.json({
      success: true,
      message: "Address added",
      addresses: user.addresses
    });
  } catch {
    res.json({
      success: false,
      message: "Add address failed"
    });
  }
};

/* ======================================================
   UPDATE ADDRESS
====================================================== */
exports.updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.json({
        success: false,
        message: "Address not found"
      });
    }

    if (req.body.isDefault) {
      user.addresses.forEach(addr => (addr.isDefault = false));
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      success: true,
      message: "Address updated",
      addresses: user.addresses
    });
  } catch {
    res.json({
      success: false,
      message: "Update address failed"
    });
  }
};

/* ======================================================
   DELETE ADDRESS
====================================================== */
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    res.json({
      success: true,
      message: "Address deleted",
      addresses: user.addresses
    });
  } catch {
    res.json({
      success: false,
      message: "Delete address failed"
    });
  }
};

/* ======================================================
   SET DEFAULT ADDRESS
====================================================== */
exports.setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
    });

    await user.save();

    res.json({
      success: true,
      message: "Default address updated",
      addresses: user.addresses
    });
  } catch {
    res.json({
      success: false,
      message: "Failed to set default address"
    });
  }
};

/* ======================================================
   ADMIN: GET ALL USERS
====================================================== */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      success: true,
      users
    });
  } catch {
    res.json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

/* ======================================================
   ADMIN: BLOCK / UNBLOCK USER
====================================================== */
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: user.isBlocked ? "User blocked" : "User unblocked"
    });
  } catch {
    res.json({
      success: false,
      message: "Action failed"
    });
  }
};

/* ======================================================
   ADMIN: CHANGE USER ROLE
====================================================== */
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Role updated",
      user
    });
  } catch {
    res.json({
      success: false,
      message: "Role update failed"
    });
  }
};
