import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import Product from '../models/Product.js';
import authMiddleware from './authMiddleware.js'; // We'll create this simple middleware

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

// Middleware to get user ID from token
// IMPORTANT: Create this file `backend/routes/authMiddleware.js`
/*
import jwt from 'jsonwebtoken';
export default function (req, res, next) {
  const token = req.header('x-auth-token'); // We'll need to send this from React
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Add user ID to the request object
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
}
*/

// @route   POST /api/products/upload
// @desc    Upload a CSV of products
router.post('/upload', [authMiddleware, upload.single('file')], async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'Please upload a file' });
  }

  const results = [];
  const stream = Readable.from(req.file.buffer.toString('utf-8'));

  stream
    .pipe(csv())
    .on('data', (data) => {
      // --- This part is CRITICAL ---
      // You must map your CSV columns to your schema.
      // This is a likely example based on your hardcoded data.
      const productData = {
        user: req.user, // Associate product with the logged-in user
        sku: data.sku,
        name: data.name,
        basePrice: parseFloat(data.basePrice),
        specs: {
          voltage: data.voltage,
          cores: data.cores,
          conductor: data.conductor,
          insulation: data.insulation,
          armoring: data.armoring,
          standard: data.standard,
        },
      };
      results.push(productData);
    })
    .on('end', async () => {
      try {
        // Use insertMany for efficient bulk insertion
        await Product.insertMany(results);
        res.status(201).json({ msg: `${results.length} products uploaded successfully` });
      } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error saving products to database', error: err.message });
      }
    });
});

export default router;