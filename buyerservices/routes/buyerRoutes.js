const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

router.post('/register', buyerController.signup);
router.post('/signin', buyerController.signin);
router.post('/verify-otp', buyerController.verifyOtp);
router.post('/verifytoken', buyerController.verifyToken); // Changed to POST

module.exports = router;