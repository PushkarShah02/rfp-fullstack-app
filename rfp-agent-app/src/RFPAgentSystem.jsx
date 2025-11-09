import React, { useState, useCallback } from 'react';
import { Play, CheckCircle, FileText, DollarSign, Package, Upload, Calendar, X, LogOut } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import axios from 'axios';

// --- ALL CONSTANTS, HELPER FUNCTIONS (calculateSpecMatch, parsePDFFile, etc.) ARE REMOVED ---
// --- The backend handles all of this now ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const RFPAgentSystem = () => {
  const { token, logout } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // We'll just fake this
  const [logs, setLogs] = useState([]);
  const [finalResponse, setFinalResponse] = useState(null);

  const [rfpUrl, setRfpUrl] = useState('http://localhost:5173/rfp-detail-cables.html'); // <-- Default to dummy site
  const [rfpDeadline, setRfpDeadline] = useState('');
  const [rfpTitle, setRfpTitle] = useState('Power Distribution Network'); // <-- Default
  const [rfpOrganization, setRfpOrganization] = useState('Delhi Metro'); // <-- Default
  const [showUploadForm, setShowUploadForm] = useState(true);

  const addLog = useCallback((agent, message, type) => {
    setLogs(prev => [...prev, { agent, message, type: type || 'info', timestamp: new Date().toLocaleTimeString() }]);
  }, []);

  const resetSystem = useCallback(() => {
    setRfpUrl('http://localhost:5173/rfp-detail-cables.html');
    setRfpDeadline('');
    setRfpTitle('Power Distribution Network');
    setRfpOrganization('Delhi Metro');
    setShowUploadForm(true);
    setLogs([]);
    setCurrentStep(0);
    setFinalResponse(null);
  }, []);

  // --- UPDATED runAgentSystem function ---
  const runAgentSystem = useCallback(async () => {
    if (!rfpUrl) { alert('Please provide an RFP URL'); return; }
    if (!rfpDeadline) { alert('Please set the RFP deadline'); return; }
    if (!rfpTitle) { alert('Please enter the RFP title'); return; }

    setIsRunning(true);
    setLogs([]);
    setCurrentStep(0);
    setFinalResponse(null);
    setShowUploadForm(false);

    try {
      addLog('Main Agent', 'Initializing RFP Response System...', 'success');
      setCurrentStep(1);
      addLog('Scraper Agent', 'Accessing URL: ' + rfpUrl, 'info');

      // --- SINGLE API CALL TO DO EVERYTHING ---
      const response = await axios.post('/api/scrape/process',
        { rfpUrl, rfpTitle, rfpOrganization, rfpDeadline },
        { headers: { 'x-auth-token': token } }
      );

      // The backend did all the work. We just get the final result.
      const finalResult = response.data;

      // Simulate the agent flow for the UI
      addLog('Scraper Agent', 'RFP data scraped and parsed.', 'success');
      await sleep(500);
      setCurrentStep(2);
      addLog('Technical Agent', 'Matching against MongoDB... (using "ML" string similarity)', 'info');
      await sleep(500);
      setCurrentStep(3);
      addLog('Pricing Agent', 'Calculating costs...', 'info');
      await sleep(500);
      setCurrentStep(4);
      addLog('AI Agent', 'Generating final summary and recommendations...', 'info');
      await sleep(1000); // Simulate AI thinking time
      setCurrentStep(5);
      addLog('Consolidation Agent', 'Final response generated.', 'success');
      setCurrentStep(5);

      setFinalResponse(finalResult);

    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message;
      addLog('System', 'Error: ' + errorMsg, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [
    rfpUrl,
    rfpDeadline,
    rfpTitle,
    rfpOrganization,
    addLog,
    token
  ]);

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
              <FileText className="text-indigo-600" />
              Process New RFP
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">RFP URL</label>
                <input
                  type="text"
                  value={rfpUrl}
                  onChange={(e) => setRfpUrl(e.target.value)}
                  placeholder="e.g., http://localhost:5173/dummy-rfp.html"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
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
                  { num: 1, name: 'Scraping' },
                  { num: 2, name: 'Matching (ML)' },
                  { num: 3, name: 'Pricing' },
                  { num: 4, name: 'AI Summary' },
                  { num: 5, name: 'Done' }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${currentStep > step.num ? 'bg-green-500' : currentStep === step.num ? 'bg-indigo-600' : 'bg-gray-300'
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.matchPercentage >= 80 ? 'bg-green-100 text-green-800' :
                              product.matchPercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
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