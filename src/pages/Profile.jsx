import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Phone, Mail, Settings, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    settings: {
      prefered_view: user?.settings?.prefered_view || 'mobile',
      using_hand: user?.settings?.using_hand || 'right',
      reminder_time: user?.settings?.reminder_time || '21:00',
      reminder_enabled: user?.settings?.reminder_enabled || false
    }
  });

  const handlePushReminderToggle = async (enabled) => {
    // Check if the browser supports push notifications before attempting to use Notification or serviceWorker
    if (enabled) {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        alert(
          'Web Push Notifications are not supported in this browser.\n\n' +
          'Note for iOS/iPhone users: You must first add this app to your Home Screen ("Add to Home Screen" option in Safari) to enable push notifications.'
        );
        return;
      }
    }

    setForm(prev => ({
      ...prev,
      settings: { ...prev.settings, reminder_enabled: enabled }
    }));

    if (enabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission was denied. You cannot enable reminders.');
          setForm(prev => ({
            ...prev,
            settings: { ...prev.settings, reminder_enabled: false }
          }));
          return;
        }

        const keyRes = await api.get('/api/v1/auth/vapid-public-key/');
        const publicVapidKey = keyRes.data.public_key;

        const registration = await navigator.serviceWorker.ready;

        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const convertedKey = urlBase64ToUint8Array(publicVapidKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });

        await api.post('/api/v1/auth/push-subscription/', subscription);
      } catch (err) {
        console.error('Failed to subscribe to Web Push:', err);
        
        let friendlyMessage = err.message;
        if (err.response?.status === 401) {
          friendlyMessage = 'Your session has expired. Please log in again to configure notifications.';
        } else if (err.message?.includes('Notification') || !('Notification' in window)) {
          friendlyMessage = 'Notifications API is missing. If on iOS/iPhone, please add this app to your Home Screen to enable reminders.';
        }
        
        alert('Failed to register browser push notifications: ' + friendlyMessage);
        setForm(prev => ({
          ...prev,
          settings: { ...prev.settings, reminder_enabled: false }
        }));
      }
    }
  };

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    const result = await updateProfile(form);
    setSaving(false);
    if (result.success) {
      setMessage('Profile settings saved successfully.');
    } else {
      setError(result.error || 'Failed to update profile.');
    }
  };

  return (
    <MobileLayout title="User Profile">
      {/* Profile Info Summary Card */}
      <div className="glass-card" style={styles.card}>
        <div style={styles.avatarLarge}>
          {((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || 'U'}
        </div>
        <h3 style={styles.profileName}>{user?.first_name} {user?.last_name}</h3>
        <p style={styles.profileEmail}>{user?.email}</p>
      </div>

      {/* Success/Error Alerts */}
      {message && (
        <div style={styles.alertSuccess}>
          <CheckCircle size={16} style={{ marginRight: '6px' }} />
          {message}
        </div>
      )}
      {error && (
        <div style={styles.alertError}>
          <ShieldAlert size={16} style={{ marginRight: '6px' }} />
          {error}
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="glass-card" style={styles.formCard}>
        <h4 style={styles.sectionTitle}>Account Details</h4>
        
        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>First Name</label>
          <div style={styles.inputWrapper}>
            <User size={16} color="var(--color-text-muted)" style={styles.inputIcon} />
            <input 
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="input-field"
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>
        </div>

        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>Last Name</label>
          <div style={styles.inputWrapper}>
            <User size={16} color="var(--color-text-muted)" style={styles.inputIcon} />
            <input 
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="input-field"
              style={{ paddingLeft: '40px' }}
              required
            />
          </div>
        </div>

        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>Phone Number</label>
          <div style={styles.inputWrapper}>
            <Phone size={16} color="var(--color-text-muted)" style={styles.inputIcon} />
            <input 
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <h4 style={{ ...styles.sectionTitle, marginTop: '16px' }}>App Settings</h4>

        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>Using Hand Preference</label>
          <div style={styles.tabGroup}>
            <button 
              type="button"
              onClick={() => setForm({ ...form, settings: { ...form.settings, using_hand: 'right' } })}
              style={{
                ...styles.tabButton,
                background: form.settings.using_hand === 'right' ? 'var(--color-primary)' : 'transparent',
                color: form.settings.using_hand === 'right' ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              Right Hand
            </button>
            <button 
              type="button"
              onClick={() => setForm({ ...form, settings: { ...form.settings, using_hand: 'left' } })}
              style={{
                ...styles.tabButton,
                background: form.settings.using_hand === 'left' ? 'var(--color-primary)' : 'transparent',
                color: form.settings.using_hand === 'left' ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              Left Hand
            </button>
          </div>
        </div>

        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>Theme Mode</label>
          <div style={styles.tabGroup}>
            <button 
              type="button"
              onClick={() => setThemePreference('light')}
              style={{
                ...styles.tabButton,
                background: themePreference === 'light' ? 'var(--color-primary)' : 'transparent',
                color: themePreference === 'light' ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              ☀️ Light
            </button>
            <button 
              type="button"
              onClick={() => setThemePreference('dark')}
              style={{
                ...styles.tabButton,
                background: themePreference === 'dark' ? 'var(--color-primary)' : 'transparent',
                color: themePreference === 'dark' ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              🌙 Dark
            </button>
            <button 
              type="button"
              onClick={() => setThemePreference('system')}
              style={{
                ...styles.tabButton,
                background: themePreference === 'system' ? 'var(--color-primary)' : 'transparent',
                color: themePreference === 'system' ? '#ffffff' : 'var(--color-text-secondary)'
              }}
            >
              🖥️ System
            </button>
          </div>
        </div>

        <div className="form-group" style={styles.formGroup}>
          <label style={styles.label}>Daily Input Reminder</label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Notify me if I haven't entered transactions today
            </span>
            <input 
              type="checkbox"
              checked={form.settings.reminder_enabled}
              onChange={(e) => handlePushReminderToggle(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {form.settings.reminder_enabled && (
          <div className="form-group" style={styles.formGroup}>
            <label style={styles.label}>Reminder Time</label>
            <input 
              type="time"
              value={form.settings.reminder_time}
              onChange={(e) => setForm({
                ...form,
                settings: { ...form.settings, reminder_time: e.target.value }
              })}
              className="input-field"
              required
            />
          </div>
        )}

        <button type="submit" className="primary-btn" disabled={saving} style={{ marginTop: '8px' }}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Quick Links / Loans shortcut */}
      <div className="glass-card" style={{ ...styles.formCard, marginTop: '16px', gap: '8px' }}>
        <h4 style={styles.sectionTitle}>Manage Financials</h4>
        <Link to="/loans" className="secondary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textDecoration: 'none', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}>
          💰 Personal Loans Manager
        </Link>
      </div>

      {/* Logout button */}
      <button onClick={logout} className="secondary-btn" style={styles.logoutBtn}>
        <LogOut size={16} style={{ marginRight: '8px' }} />
        Sign Out Account
      </button>
    </MobileLayout>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    gap: '8px',
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, var(--color-primary), #0891b2)',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    fontWeight: '700',
    boxShadow: '0 8px 16px rgba(6, 182, 212, 0.3)',
    marginBottom: '8px',
  },
  profileName: {
    fontSize: '18px',
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },
  formCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--color-primary)',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  alertSuccess: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid var(--color-success)',
    borderRadius: '12px',
    color: 'var(--color-success)',
    fontSize: '13px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  alertError: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid var(--color-danger)',
    borderRadius: '12px',
    color: 'var(--color-danger)',
    fontSize: '13px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  tabGroup: {
    display: 'flex',
    background: 'rgba(30, 61, 55, 0.05)',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    border: '1px solid rgba(30, 61, 55, 0.08)',
  },
  tabButton: {
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    padding: '10px 6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
  },
  logoutBtn: {
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--color-danger)',
    marginTop: '12px',
  }
};

export default Profile;
