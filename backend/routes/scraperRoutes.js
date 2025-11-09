import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import authMiddleware from './authMiddleware.js';
import Product from '../models/Product.js'; // Get our product model
import { calculateSpecMatch, testPricing } from '../utils/matching.js'; // Get our new ML matcher

const router = express.Router();

// @route   POST /api/scrape/process
// @desc    The NEW all-in-one agent flow
router.post('/process', authMiddleware, async (req, res) => {
  const { rfpUrl, rfpTitle, rfpOrganization, rfpDeadline } = req.body;
  if (!rfpUrl) return res.status(400).json({ msg: 'No URL provided' });

  try {
    // === 1. SCRAPER & PARSING AGENT ===
    const scrapedProducts = await scrapeAndParseRFP(rfpUrl);
    if (scrapedProducts.length === 0) {
      return res.status(400).json({ msg: 'Could not parse any products from the URL.' });
    }

    // === 2. TECHNICAL AGENT (Matching) ===
    // Get *your* products from the database
    const myProducts = await Product.find({ user: req.user });
    if (myProducts.length === 0) {
      return res.status(400).json({ msg: 'No products in your database. Please upload your product CSV first.' });
    }

    const technicalMatches = [];
    for (const rfpProduct of scrapedProducts) {
      const matches = myProducts.map(myProd => ({
        ...myProd.toObject(), // Convert Mongoose doc to plain object
        matchScore: calculateSpecMatch(rfpProduct.specs, myProd.specs)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
      
      // Select the best match
      technicalMatches.push({ rfpProduct, selectedSKU: matches[0] });
    }

    // === 3. PRICING AGENT ===
    let totalMaterialCost = 0;
    const allTests = ["Type Test", "Routine Test", "Sample Test", "Installation Test"];
    const totalTestCost = allTests.reduce((acc, test) => acc + (testPricing[test] || 0), 0);

    const finalProducts = technicalMatches.map(match => {
      const materialCost = match.selectedSKU.basePrice * match.rfpProduct.quantity;
      totalMaterialCost += materialCost;
      return {
        rfpItem: match.rfpProduct.name,
        quantity: match.rfpProduct.quantity,
        unit: match.rfpProduct.unit,
        recommendedSKU: match.selectedSKU.sku,
        skuName: match.selectedSKU.name,
        matchPercentage: match.selectedSKU.matchScore,
        unitPrice: match.selectedSKU.basePrice,
        totalPrice: materialCost
      };
    });

    // === 4. CONSOLIDATION AGENT ===
    const today = new Date();
    const deadline = new Date(rfpDeadline);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    const finalRFPResponse = {
      rfpId: 'RFP-DEMO-' + Math.floor(Math.random() * 1000),
      rfpTitle: rfpTitle,
      organization: rfpOrganization,
      dueDate: rfpDeadline,
      fileName: rfpUrl,
      daysRemaining,
      products: finalProducts,
      tests: allTests.map(test => ({ testName: test, cost: testPricing[test] })),
      pricing: { materialCost: totalMaterialCost, testCost: totalTestCost, totalCost: totalMaterialCost + totalTestCost }
    };
    
    // Send the complete response back to the frontend
    res.json(finalRFPResponse);

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Processing failed', error: error.message });
  }
});


// This is the new scraper/parser function
async function scrapeAndParseRFP(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const products = [];

  // Target the specific table by its ID
  $('#rfp-table tbody tr').each((i, el) => {
    const row = $(el).find('td');
    const rfpProduct = {
      name: $(row[0]).text(),
      quantity: parseInt($(row[1]).text()) || 0,
      unit: $(row[2]).text(),
      specs: {
        voltage: $(row[3]).text(),
        cores: $(row[4]).text(),
        conductor: $(row[5]).text(),
        insulation: $(row[6]).text(),
      }
    };
    products.push(rfpProduct);
  });
  return products;
}

export default router;