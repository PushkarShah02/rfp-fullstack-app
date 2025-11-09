import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/productRoutes.js';
import scraperRoutes from './routes/scraperRoutes.js';

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/scrape', scraperRoutes);

app.get('/', (req, res) => {
  res.send('RFP Agent Backend is running...');
});

// Connect to DB and Start Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} and connected to MongoDB`);
    });
  })
  .catch((err) => console.log(err));