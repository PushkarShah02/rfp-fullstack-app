import React, { useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Play, CheckCircle, FileText, DollarSign, Package, Upload, Calendar, X } from 'lucide-react';

// --- Constants moved outside component ---
// This static data doesn't need to be redefined on every render.
const productDatabase = [
  { sku: "LT-XLPE-AL-3.5C-1.1KV", name: "Aluminum XLPE Power Cable 3.5 Core 1.1kV",
    specs: { voltage: "1.1 kV", cores: "3.5 Core", conductor: "Aluminum", insulation: "XLPE", armoring: "Steel Wire Armored", standard: "IS 7098 Part 1" }, basePrice: 450 },
  { sku: "CTRL-CU-4C-PVC-1.1KV", name: "Copper Control Cable 4 Core PVC 1.1kV",
    specs: { voltage: "1.1 kV", cores: "4 Core", conductor: "Copper", insulation: "PVC", armoring: "Unarmored", standard: "IS 1554 Part 1" }, basePrice: 320 },
  { sku: "BW-CU-1C-PVC-1.1KV", name: "Copper Building Wire Single Core PVC 1.1kV",
    specs: { voltage: "1.1 kV", cores: "Single Core", conductor: "Copper", insulation: "PVC", armoring: "Unarmored", standard: "IS 694" }, basePrice: 180 }
];

const testPricing = { "Type Test": 50000, "Routine Test": 15000, "Sample Test": 8000, "Installation Test": 12000 };

// --- Pure helper functions moved outside component ---
// These functions don't depend on component state, so they can be defined globally.

const calculateSpecMatch = (rfpSpecs, productSpecs) => {
  let totalSpecs = 0;
  let matchedSpecs = 0;
  Object.keys(rfpSpecs).forEach(key => {
    totalSpecs++;
    if (productSpecs[key]) {
      const rfpValue = String(rfpSpecs[key]).toLowerCase().trim();
      const productValue = String(productSpecs[key]).toLowerCase().trim();
      if (rfpValue === productValue) {
        matchedSpecs++;
      } else if (rfpValue.includes(productValue) || productValue.includes(rfpValue)) {
        matchedSpecs += 0.7;
      }
    }
  });
  return totalSpecs > 0 ? Math.round((matchedSpecs / totalSpecs) * 100) : 0;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseCSVFile = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 3) {
          products.push({
            name: values[0] || 'Unknown Product',
            quantity: parseInt(values[1]) || 0,
            unit: values[2] || 'units',
            specs: { voltage: "1.1 kV", cores: "4 Core", conductor: "Copper", insulation: "PVC", standard: "IS 1554 Part 1" }
          });
        }
      }
      resolve(products);
    };
    reader.readAsText(file);
  });
};

const parsePDFFile = async () => {
  // This is still a mock, but it's now defined outside the component
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: "Low Voltage Power Cable", quantity: 5000, unit: "meters",
          specs: { voltage: "1.1 kV", cores: "3.5 Core", conductor: "Aluminum", insulation: "XLPE", armoring: "Steel Wire", standard: "IS 7098 Part 1" } },
        { name: "Control Cable", quantity: 3000, unit: "meters",
          specs: { voltage: "1.1 kV", cores: "4 Core", conductor: "Copper", insulation: "PVC", standard: "IS 1554 Part 1" } },
        { name: "Building Wire", quantity: 10000, unit: "meters",
          specs: { voltage: "1.1 kV", cores: "Single Core", conductor: "Copper", insulation: "PVC", standard: "IS 694" } }
      ]);
    }, 1000);
  });
};


// --- React Component ---
const RFPAgentSystem = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [finalResponse, setFinalResponse] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [rfpDeadline, setRfpDeadline] = useState('');
  const [rfpTitle, setRfpTitle] = useState('');
  const [rfpOrganization, setRfpOrganization] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(true);

  // --- State-dependent functions wrapped in useCallback ---
  
  // Wrapped in useCallback. Uses functional update for setLogs, so dependencies are empty.
  const addLog = useCallback((agent, message, type) => {
    setLogs(prev => [...prev, { agent, message, type: type || 'info', timestamp: new Date().toLocaleTimeString() }]);
  }, []); // No dependencies needed for functional state updates

  // Wrapped in useCallback.
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.type === 'application/pdf' || file.name.endsWith('.csv') || file.name.endsWith('.pdf')) {
        setUploadedFile(file);
      } else {
        alert('Please upload a CSV or PDF file only');
      }
    }
  }, []); // No dependencies needed as it only calls setUploadedFile

  // Wrapped in useCallback.
  const resetSystem = useCallback(() => {
    setUploadedFile(null);
    setRfpDeadline('');
    setRfpTitle('');
    setRfpOrganization('');
    setShowUploadForm(true);
    setLogs([]);
    setCurrentStep(0);
    setFinalResponse(null);
  }, []); // No dependencies needed as it only calls setters

  // Wrapped in useCallback. This is the main function.
  // It depends on the state variables it reads and the callback functions it calls.
  const runAgentSystem = useCallback(async () => {
    if (!uploadedFile) { alert('Please upload an RFP file'); return; }
    if (!rfpDeadline) { alert('Please set the RFP deadline'); return; }
    if (!rfpTitle) { alert('Please enter the RFP title'); return; }

    setIsRunning(true);
    setLogs([]);
    setCurrentStep(0);
    setFinalResponse(null);
    setShowUploadForm(false);

    try {
      setCurrentStep(1);
      addLog('Main Agent', 'Initializing RFP Response System...', 'success');
      addLog('Main Agent', 'Processing uploaded file: ' + uploadedFile.name, 'info');
      await sleep(1000);

      let products = [];
      if (uploadedFile.name.endsWith('.csv')) {
        addLog('Main Agent', 'Parsing CSV file...', 'info');
        products = await parseCSVFile(uploadedFile); // Using external function
      } else {
        addLog('Main Agent', 'Extracting data from PDF file...', 'info');
        products = await parsePDFFile(); // Using external function
      }

      addLog('Main Agent', 'Extracted ' + products.length + ' products from RFP document', 'success');
      await sleep(800);

      const selectedRFP = {
        id: 'RFP-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        title: rfpTitle, // From state
        organization: rfpOrganization || 'Organization Not Specified', // From state
        dueDate: rfpDeadline, // From state
        fileName: uploadedFile.name, // From state
        products: products,
        tests: ["Type Test", "Routine Test", "Sample Test", "Installation Test"]
      };

      setCurrentStep(2);
      addLog('Main Agent', 'RFP Details Confirmed', 'success');
      addLog('Main Agent', '- Title: ' + selectedRFP.title, 'info');
      
      const today = new Date();
      const deadline = new Date(selectedRFP.dueDate);
      const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      addLog('Main Agent', '- Days remaining: ' + daysRemaining + ' days', daysRemaining < 7 ? 'warning' : 'info');
      await sleep(1000);

      setCurrentStep(3);
      addLog('Technical Agent', 'Analyzing product specifications...', 'info');
      await sleep(1500);

      const technicalMatches = [];
      for (const rfpProduct of selectedRFP.products) {
        addLog('Technical Agent', 'Matching: ' + rfpProduct.name, 'info');
        await sleep(800);
        const matches = productDatabase.map(product => ({ ...product, matchScore: calculateSpecMatch(rfpProduct.specs, product.specs) })) // Using external function
          .sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
        matches.forEach((match, idx) => {
          addLog('Technical Agent', '  Option ' + (idx + 1) + ': ' + match.sku + ' - Match: ' + match.matchScore + '%', match.matchScore >= 80 ? 'success' : 'warning');
        });
        technicalMatches.push({ rfpProduct, selectedSKU: matches[0] });
        await sleep(500);
      }

      addLog('Technical Agent', 'Product matching completed', 'success');
      await sleep(1000);

      setCurrentStep(4);
      addLog('Pricing Agent', 'Calculating costs...', 'info');
      await sleep(1500);

      let totalMaterialCost = 0;
      let totalTestCost = 0;
      technicalMatches.forEach(match => {
        const materialCost = match.selectedSKU.basePrice * match.rfpProduct.quantity;
        totalMaterialCost += materialCost;
      });

      selectedRFP.tests.forEach(test => {
        totalTestCost += testPricing[test] || 0;
      });

      addLog('Pricing Agent', 'Total Material Cost: ₹' + totalMaterialCost.toLocaleString(), 'success');
      addLog('Pricing Agent', 'Total Test Cost: ₹' + totalTestCost.toLocaleString(), 'success');
      await sleep(1000);

      setCurrentStep(5);
      addLog('Main Agent', 'Consolidating RFP response...', 'info');
      await sleep(1500);

      const finalRFPResponse = {
        rfpId: selectedRFP.id,
        rfpTitle: selectedRFP.title,
        organization: selectedRFP.organization,
        dueDate: selectedRFP.dueDate,
        fileName: selectedRFP.fileName,
        daysRemaining,
        products: technicalMatches.map(match => ({
          rfpItem: match.rfpProduct.name,
          quantity: match.rfpProduct.quantity,
          unit: match.rfpProduct.unit,
          recommendedSKU: match.selectedSKU.sku,
          skuName: match.selectedSKU.name,
          matchPercentage: match.selectedSKU.matchScore,
          unitPrice: match.selectedSKU.basePrice,
          totalPrice: match.selectedSKU.basePrice * match.rfpProduct.quantity
        })),
        tests: selectedRFP.tests.map(test => ({ testName: test, cost: testPricing[test] })),
        pricing: { materialCost: totalMaterialCost, testCost: totalTestCost, totalCost: totalMaterialCost + totalTestCost }
      };

      setFinalResponse(finalRFPResponse);
      addLog('Main Agent', 'RFP Response successfully consolidated', 'success');
    } catch (error) {
      addLog('System', 'Error: ' + error.message, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [
    // Dependencies: state variables it READS and callbacks it CALLS
    uploadedFile, 
    rfpDeadline, 
    rfpTitle, 
    rfpOrganization, 
    addLog 
  ]);

  // --- JSX (No changes needed here) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">B2B RFP Multi-Agent Response System</h1>
          <p className="text-gray-600 mb-6">Automated RFP Processing, Product Matching and Pricing Estimation</p>
        </div>

        {showUploadForm && (
          <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Upload className="text-indigo-600" />
              Upload RFP Document
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RFP Document (CSV or PDF)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                  <input type="file" accept=".csv,.pdf" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={40} />
                    <p className="text-gray-600">Click to upload</p>
                    <p className="text-sm text-gray-500 mt-1">CSV or PDF files only</p>
                  </label>
                  {uploadedFile && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle size={20} />
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RFP Title</label>
                <input type="text" value={rfpTitle} onChange={(e) => setRfpTitle(e.target.value)}
                  placeholder="e.g., Power Distribution Network"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
                <input type="text" value={rfpOrganization} onChange={(e) => setRfpOrganization(e.target.value)}
                  placeholder="e.g., Delhi Metro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RFP Submission Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="date" value={rfpDeadline} onChange={(e) => setRfpDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button onClick={runAgentSystem} disabled={isRunning}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                  isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                }`}>
                <Play size={24} />
                {isRunning ? 'Processing...' : 'Process RFP'}
              </button>
            </div>
          </div>
        )}

        {!showUploadForm && (
          <>
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Process Flow</h2>
                <button onClick={resetSystem}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium">
                  <X size={18} />Reset
                </button>
              </div>
              <div className="flex items-center justify-between">
                {[
                  { num: 1, name: 'File Processing' },
                  { num: 2, name: 'Main Agent' },
                  { num: 3, name: 'Technical Agent' },
                  { num: 4, name: 'Pricing Agent' },
                  { num: 5, name: 'Consolidation' }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      currentStep > step.num ? 'bg-green-500' : currentStep === step.num ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}>
                      <span className="text-white font-bold">{step.num}</span>
                    </div>
                    <span className="text-sm font-medium mt-2 text-center">{step.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Agent Activity Logs</h2>
              <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {logs.map((log, idx) => (
                  <div key={idx} className="mb-2">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className="ml-2 font-semibold text-purple-400">[{log.agent}]</span>
                    <span className={`ml-2 ${log.type === 'success' ? 'text-green-300' : log.type === 'warning' ? 'text-yellow-300' : 'text-gray-300'}`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {finalResponse && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">RFP Details</h2>
              <div className="space-y-3">
                <div><span className="font-semibold">ID:</span> {finalResponse.rfpId}</div>
                <div><span className="font-semibold">Title:</span> {finalResponse.rfpTitle}</div>
                <div><span className="font-semibold">Organization:</span> {finalResponse.organization}</div>
                <div><span className="font-semibold">Deadline:</span> {finalResponse.dueDate}</div>
                <div><span className="font-semibold">Days Remaining:</span> <span className="font-bold text-green-600">{finalResponse.daysRemaining}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Cost Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Material Cost:</span>
                  <span className="font-semibold">₹{finalResponse.pricing.materialCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Testing Cost:</span>
                  <span className="font-semibold">₹{finalResponse.pricing.testCost.toLocaleString()}</span>
                </div>
                <div className="border-t-2 pt-3 flex justify-between">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold text-indigo-600">₹{finalResponse.pricing.totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Product Recommendations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left">RFP Item</th>
                      <th className="px-4 py-3 text-left">Quantity</th>
                      <th className="px-4 py-3 text-left">Recommended SKU</th>
                      <th className="px-4 py-3 text-center">Match</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {finalResponse.products.map((product, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3">{product.rfpItem}</td>
                        <td className="px-4 py-3">{product.quantity} {product.unit}</td>
                        <td className="px-4 py-3">{product.recommendedSKU}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {product.matchPercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">₹{product.totalPrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RFPAgentSystem;