import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Incomes from './pages/Incomes';
import Costs from './pages/Costs';
import Wallets from './pages/Wallets';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Loans from './pages/Loans';
import Planned from './pages/Planned';

const LoadingScreen = () => {
  const [slowNotice, setSlowNotice] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setSlowNotice(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg-app)', gap: '14px' }}>
      <img src="/logo.png" alt="Amar Hishab" style={{ width: '52px', height: '52px', borderRadius: '12px' }} />
      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
        Verifying credentials...
      </div>
      {slowNotice && (
        <div className="animate-fade-in" style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '280px', textAlign: 'center' }}>
          Connecting to cloud server, please wait a moment...
        </div>
      )}
    </div>
  );
};

// Route Guard for Protected Pages
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route Guard for Guest Pages (e.g. Login page)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/incomes" 
          element={
            <ProtectedRoute>
              <Incomes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/costs" 
          element={
            <ProtectedRoute>
              <Costs />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wallets" 
          element={
            <ProtectedRoute>
              <Wallets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/categories" 
          element={
            <ProtectedRoute>
              <Categories />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/loans" 
          element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/planned" 
          element={
            <ProtectedRoute>
              <Planned />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
