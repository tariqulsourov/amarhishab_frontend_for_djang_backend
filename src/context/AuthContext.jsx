import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // If we already have a cached user and an accessToken, do NOT block the screen!
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('currentUser');
    return Boolean(token && !savedUser);
  });

  // Load user profile / sync in background (stale-while-revalidate)
  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/v1/auth/profile/');
      setUser(response.data);
      localStorage.setItem('currentUser', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch profile', error);
      // Only purge credentials on explicit 401 unrecoverable authorization errors
      if (error.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
      }
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
      const { access, refresh, user: userData } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      if (userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
      } else {
        // Fallback for older backend responses
        await fetchProfile();
      }
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: errorMsg };
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const response = await api.post('/api/v1/auth/google/', { id_token: idToken });
      const { access, refresh, user: userData } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      if (userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
      } else {
        await fetchProfile();
      }
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Google Authentication failed.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/v1/auth/profile/', profileData);
      setUser(response.data);
      localStorage.setItem('currentUser', JSON.stringify(response.data));
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
