import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // You could add logic here to verify the token with the backend
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response.data.msg || 'Login failed');
    }
    setLoading(false);
  };

  const register = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/register', { email, password });
      // Automatically log them in after register
      await login(email, password);
    } catch (err) {
      setError(err.response.data.msg || 'Registration failed');
    }
    setLoading(false);
  };

  const logout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, register, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);