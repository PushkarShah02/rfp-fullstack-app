import { compareTwoStrings } from 'string-similarity';

// This is our new "ML-like" matching function
export const calculateSpecMatch = (rfpSpecs, productSpecs) => {
  let totalScore = 0;
  let specCount = 0;

  // Combine specs into a single string for better semantic comparison
  const rfpString = Object.values(rfpSpecs).join(' ').toLowerCase();
  const productString = Object.values(productSpecs).join(' ').toLowerCase();

  // 1. Get a high-level "gestalt" similarity score
  // This compares "1.1kv 3.5c alum xlpe" with "1.1kv 3.5 core aluminum xlpe"
  const gestaltScore = compareTwoStrings(rfpString, productString);
  totalScore += gestaltScore * 100; // Weight this heavily
  specCount++;

  // 2. Do individual spec-to-spec checks for key values
  Object.keys(rfpSpecs).forEach(key => {
    specCount++;
    if (productSpecs[key]) {
      const rfpValue = String(rfpSpecs[key]).toLowerCase().trim();
      const productValue = String(productSpecs[key]).toLowerCase().trim();
      
      // Use string-similarity for each spec
      const similarity = compareTwoStrings(rfpValue, productValue);
      totalScore += similarity * 100;

    } else {
      // Penalize if the product is missing a required spec
      totalScore -= 20; 
    }
  });

  const finalScore = Math.round(totalScore / specCount);
  return finalScore > 100 ? 100 : finalScore < 0 ? 0 : finalScore; // Clamp score between 0-100
};

// We also move the hardcoded test pricing to the backend
export const testPricing = { 
  "Type Test": 50000, 
  "Routine Test": 15000, 
  "Sample Test": 8000, 
  "Installation Test": 12000 
};