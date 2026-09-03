import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile if token is already in local storage
  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/v1/auth/profile/');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/v1/auth/login/', { email, password });
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      await fetchProfile();
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: errorMsg };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await api.post('/api/v1/auth/google/', { id_token: idToken });
      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      await fetchProfile();
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Google Authentication failed.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/v1/auth/profile/', profileData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data || 'Failed to update profile.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, updateProfile, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
