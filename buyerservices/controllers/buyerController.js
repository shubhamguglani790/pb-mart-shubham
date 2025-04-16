const Buyer = require('../models/Buyer');
const otp = '12345'; // Static OTP for demonstration
const jwt = require('jsonwebtoken');
require('dotenv').config();
const logger = require('../utils/logging');

let lastSignedInMobile = null;

const secretKey = process.env.JWT_SECRET || 'default-secret-key';

// Sign Up
exports.signup = async (req, res) => {
  const {
    fullName, mobile, email, businessName, panCardNumber, categories,
    businessAddress, gstin, businessType, turnover, bankDetails,
    accountNumber, ifscCode, nameOfBank, placeOfBank
  } = req.body;

  try {
    const newBuyer = new Buyer({
      fullName, mobile, email, businessName, panCardNumber, categories,
      businessAddress, gstin, businessType, turnover, bankDetails,
      accountNumber, ifscCode, nameOfBank, placeOfBank
    });
    await newBuyer.save();

    const message = `${fullName} is successfully registered`;
    logger.info(`Signup success for ${fullName} with mobile ${mobile}`);
    res.status(201).json({ message: message });
  } catch (error) {
    logger.error(`Signup error for mobile ${mobile}: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// Sign In
exports.signin = async (req, res) => {
  const { mobile } = req.body;

  try {
    const buyer = await Buyer.findOne({ mobile });
    if (!buyer) {
      logger.error(`Signin error: Buyer not found for mobile ${mobile}`);
      return res.status(404).json({ message: 'Buyer not found' });
    }

    const maskedMobile = mobile.replace(/\d(?=\d{4})/g, '*');
    lastSignedInMobile = mobile;
    logger.debug(`Signin: lastSignedInMobile set to ${lastSignedInMobile}`);
    const message = `OTP: ${otp} sent to ${maskedMobile}`;
    logger.info(`Signin success for mobile ${mobile}`);
    res.status(200).json({ message: message });
  } catch (error) {
    logger.error(`Signin error for mobile ${mobile}: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  const { otp: providedOtp } = req.body;

  if (!providedOtp) {
    logger.error('Verify OTP error: OTP is required');
    return res.status(400).json({ message: 'OTP is required' });
  }

  try {
    logger.debug(`Verify OTP: lastSignedInMobile is ${lastSignedInMobile}`);
    if (!lastSignedInMobile) {
      logger.error('Verify OTP error: No recent signin detected');
      return res.status(400).json({ message: 'No recent signin detected. Please sign in first' });
    }

    const buyer = await Buyer.findOne({ mobile: lastSignedInMobile });
    if (!buyer) {
      logger.error(`Verify OTP error: Buyer not found for mobile ${lastSignedInMobile}`);
      return res.status(404).json({ message: 'Buyer not found' });
    }

    if (providedOtp !== otp) {
      logger.error(`Verify OTP error: Invalid OTP for mobile ${lastSignedInMobile}`);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    buyer.isVerified = true;
    await buyer.save();

    const token = jwt.sign(
      {
        fullName: buyer.fullName,
        mobile: buyer.mobile,
        email: buyer.email,
        businessName: buyer.businessName,
        panCardNumber: buyer.panCardNumber,
        categories: buyer.categories,
        businessAddress: buyer.businessAddress,
        gstin: buyer.gstin,
        businessType: buyer.businessType,
        turnover: buyer.turnover,
        bankDetails: buyer.bankDetails,
        accountNumber: buyer.accountNumber,
        ifscCode: buyer.ifscCode,
        nameOfBank: buyer.nameOfBank,
        placeOfBank: buyer.placeOfBank,
        isVerified: buyer.isVerified,
        id: buyer._id
      },
      secretKey,
      { expiresIn: '1h' }
    );

    const message = `${buyer.fullName} is successfully logged in`;
    logger.info(`Verify OTP success for ${buyer.fullName} with mobile ${buyer.mobile}`);
    lastSignedInMobile = null;
    logger.debug('Verify OTP: lastSignedInMobile reset to null');
    res.status(200).json({ message: message, token: token });
  } catch (error) {
    logger.error(`Verify OTP error: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

// Verify Token
exports.verifyToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    logger.error('Verify Token error: Token is required in request body');
    return res.status(400).json({ message: 'Token is required in request body' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    logger.info(`Verify Token success for token issued to ${decoded.fullName}`);
    res.status(200).json({ message: 'Token is valid', decoded: decoded });
  } catch (error) {
    logger.error(`Verify Token error: ${error.message}`);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};