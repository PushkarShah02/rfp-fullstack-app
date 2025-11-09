import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RFPAgentSystem from './RFPAgentSystem';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* This is the protected route group */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RFPAgentSystem />} />
        {/* You could add more protected pages here, e.g., /dashboard, /profile */}
      </Route>
      
    </Routes>
  );
}

export default App;

