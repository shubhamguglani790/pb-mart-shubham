require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db'); // Adjust path if necessary
const buyerRoutes = require('./routes/buyerRoutes');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Use buyer routes
app.use('/api/buyer', buyerRoutes);

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));