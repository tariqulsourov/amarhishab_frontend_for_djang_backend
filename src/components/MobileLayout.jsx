import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, ArrowDownLeft, ArrowUpRight, Wallet, User 
} from 'lucide-react';

const MobileLayout = ({ children, title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/incomes', label: 'Incomes', icon: ArrowUpRight },
    { path: '/costs', label: 'Expenses', icon: ArrowDownLeft },
    { path: '/', label: 'Home', icon: Home },
    { path: '/wallets', label: 'Wallets', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const getInitials = () => {
    if (!user) return 'U';
    const f = user.first_name?.[0] || '';
    const l = user.last_name?.[0] || '';
    return (f + l).toUpperCase() || 'U';
  };

  return (
    <div className="app-container">
      {/* Top Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {title === 'Amar Hishab' && (
            <img src="/logo.png" alt="Logo" style={styles.logoImage} />
          )}
          <h2 style={styles.headerTitle}>{title}</h2>
        </div>
        <div style={styles.avatar} onClick={() => navigate('/profile')}>
          {getInitials()}
        </div>
      </header>

      {/* Main Screen Content View */}
      <main className="screen-content">
        {children}
      </main>

      {/* Persistent Bottom Nav Bar */}
      <nav style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navButton,
                color: isActive ? '#ffffff' : '#a9c0be'
              }}
            >
              <Icon size={20} />
              <span style={{
                ...styles.navLabel,
                color: isActive ? '#ffffff' : '#a9c0be',
                fontWeight: isActive ? '600' : '500',
                fontSize: '9px'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    background: '#1e3d37',
    zIndex: 1000,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoImage: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.3px',
    color: '#ffffff',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  navBar: {
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    height: '64px',
    background: '#1e3d37',
    borderRadius: '24px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 8px 30px rgba(30, 61, 55, 0.25)',
    zIndex: 1000,
  },
  navButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    flex: 1,
    height: '100%',
    transition: 'color 0.15s ease',
  },
  activeIcon: {
    transform: 'scale(1.05)',
  },
  navLabel: {
    fontSize: '10px',
    transition: 'color 0.15s ease',
  }
};

export default MobileLayout;
