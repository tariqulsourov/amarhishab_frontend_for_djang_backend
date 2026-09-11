import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, HelpCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setSlowNotice(false);

    const timer = setTimeout(() => {
      setSlowNotice(true);
    }, 2800);

    const result = await login(email, password);
    clearTimeout(timer);
    setSlowNotice(false);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSubmitting(true);
    setSlowNotice(false);

    const timer = setTimeout(() => {
      setSlowNotice(true);
    }, 2800);

    const result = await loginWithGoogle(credentialResponse.credential);
    clearTimeout(timer);
    setSlowNotice(false);
    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-in failed. Please try again.');
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox} className="glass-panel animate-fade-in">
        <div style={styles.header}>
          <img src="/logo.png" alt="Amar Hishab Logo" style={styles.logoImage} />
          <h1 style={styles.title}>Amar Hishab</h1>
          <p style={styles.subtitle}>Enter credentials to access your financial dashboard</p>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@domain.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.submitBtn}>
            {submitting ? 'Authenticating...' : (
              <>
                <LogIn size={18} style={{ marginRight: '8px' }} />
                Access Account
              </>
            )}
          </button>

          {slowNotice && (
            <div style={styles.slowNoticeBox} className="animate-fade-in">
              <span>⚡ Waking up secure cloud server, please hold on...</span>
            </div>
          )}
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <div style={styles.googleContainer}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="dark"
            shape="rectangular"
            size="large"
            width="360"
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '24px',
  },
  loginBox: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
    textAlign: 'center',
  },
  logoImage: {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    marginBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.5px',
    marginBottom: '6px',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  input: {
    background: 'rgba(11, 15, 25, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    width: '100%',
    '&:focus': {
      borderColor: 'var(--color-primary)',
    }
  },
  submitBtn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, var(--color-primary), #0891b2)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease, transform 0.1s ease',
    marginTop: '10px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
  },
  errorAlert: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid var(--color-danger)',
    borderRadius: '10px',
    color: 'var(--color-danger)',
    fontSize: '14px',
    padding: '12px 16px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  helpBox: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '32px',
  },
  helpTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: '4px',
  },
  helpText: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
  },
  dividerLine: {
    flexGrow: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  dividerText: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    padding: '0 12px',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  googleContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  slowNoticeBox: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(45, 212, 191, 0.08)',
    border: '1px solid rgba(45, 212, 191, 0.25)',
    color: 'var(--color-primary)',
    fontSize: '12px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  }
};

export default Login;
