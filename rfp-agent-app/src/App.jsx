import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RFPAgentSystem from './RFPAgentSystem';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // <-- IMPORT LAYOUT
import ProductUploader from './components/ProductUploader'; // <-- IMPORT UPLOADER

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* This is now a protected layout. 
        All pages inside will have the nav bar.
      */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}> 
          <Route path="/" element={<RFPAgentSystem />} />
          <Route path="/upload" element={<ProductUploader />} />
        </Route>
      </Route>
      
    </Routes>
  );
}

export default App;

