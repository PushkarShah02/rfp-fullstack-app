import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, FileText, Upload } from 'lucide-react';

const Layout = () => {
  const { logout } = useAuth();

  const linkClass = "flex items-center gap-2 px-4 py-2 rounded-md transition-all";
  const activeClass = "bg-indigo-600 text-white font-medium";
  const inactiveClass = "text-gray-600 hover:bg-gray-100";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white rounded-lg shadow-xl p-4 mb-6 flex justify-between items-center">
          <nav className="flex items-center gap-4">
            <NavLink 
              to="/" 
              className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}
            >
              <FileText size={18} />
              Process RFP
            </NavLink>
            <NavLink 
              to="/upload" 
              className={({ isActive }) => `${linkClass} ${isActive ? activeClass : inactiveClass}`}
            >
              <Upload size={18} />
              Upload Products
            </NavLink>
          </nav>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
        
        {/* Page Content */}
        <main>
          <Outlet /> {/* This will render either RFPAgentSystem or ProductUploader */}
        </main>
      </div>
    </div>
  );
};

export default Layout;