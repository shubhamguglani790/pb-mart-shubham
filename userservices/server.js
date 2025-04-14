const express = require('express');
const mongoose = require('mongoose');
const app = express();
const buyerRoutes = require('./routes/buyerRoutes');

mongoose.connect('mongodb://localhost:27017/indiamart', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected for User Service'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use('/buyers', buyerRoutes);

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
