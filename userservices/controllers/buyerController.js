const Buyer = require('../models/Buyer');

// Create Buyer
exports.createBuyer = async (req, res) => {
  const { fullName, mobile, email, businessName, categories } = req.body;

  try {
    const exists = await Buyer.findOne({ mobile });
    if (exists) return res.status(400).json({ error: "Mobile already registered" });

    const buyer = new Buyer({ fullName, mobile, email, businessName, categories, isVerified: true });
    await buyer.save();

    res.json({ message: "Buyer created successfully", buyer });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Check if Mobile Exists
exports.checkMobile = async (req, res) => {
  const mobile = req.params.mobile;

  try {
    const buyer = await Buyer.findOne({ mobile });
    if (buyer) return res.json({ exists: true, isVerified: buyer.isVerified });

    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const buyerId = req.params.id;

  try {
    await Buyer.findByIdAndUpdate(buyerId, {
      ...req.body,
      updatedAt: new Date(),
    });

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

// Get All Buyers (for testing)
exports.getAll = async (req, res) => {
  const buyers = await Buyer.find();
  res.json(buyers);
};
