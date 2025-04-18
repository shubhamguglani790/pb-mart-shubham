const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const categoryRoutes = require('./routes/categoryRoutes');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors()); // Enable CORS for all routes
// Increase payload size limit to 50MB (adjust as needed)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Optional, for form data
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/', categoryRoutes);

// Create Uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(UploadsDir, { recursive: true });
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected successfully'))
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => logger.info(`Category Service running on port ${PORT}`));

// Error handling for payload too large
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    logger.error('Payload too large', { size: req.headers['content-length'] });
    return res.status(413).json({ error: 'Payload too large, maximum allowed is 50MB' });
  }
  next(err);
});