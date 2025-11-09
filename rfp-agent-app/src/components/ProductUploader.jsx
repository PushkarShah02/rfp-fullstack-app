import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';

const ProductUploader = () => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // 1. Check if a file was selected at all
    if (!selectedFile) {
      setFile(null);
      return; // Exit early
    }

    // 2. Check if the file name ends with .csv
    // This is the most reliable check
    if (selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null); // Clear any previous error
    } else {
      // 3. If it doesn't end with .csv, set an error
      setFile(null);
      setError('Please select a .csv file only.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token,
        },
      });
      setMessage(res.data.msg || 'Products uploaded successfully!');
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred during upload.');
    }
    setIsUploading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Upload className="text-indigo-600" />
        Upload Your Product Datasheet
      </h2>

      {message && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Success</p>
          <p>{message}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Product CSV File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-600">Click to upload (CSV only)</p>
            </label>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading || !file}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-lg transition-all ${isUploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
            }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Products'}
        </button>
      </form>
    </div>
  );
};

export default ProductUploader;