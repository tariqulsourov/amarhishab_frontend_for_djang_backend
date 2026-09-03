import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import api from '../utils/api';
import { 
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, 
  PlusCircle, ArrowLeftRight, TrendingUp, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [firstWalletName, setFirstWalletName] = useState('Pocket Wallet');
  const [firstWalletBalance, setFirstWalletBalance] = useState('0');
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/dashboard/summary/');
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data && data.wallets && data.wallets.length === 0 && onboardingStep === 0) {
      setOnboardingStep(1);
    }
  }, [data]);

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingOnboarding(true);
      const pRes = await api.get('/api/v1/predefined-wallets/');
      const predefinedId = pRes.data[0]?.id || 1;

      await api.post('/api/v1/wallets/', {
        wallet_name: firstWalletName,
        wallet_status: parseInt(firstWalletBalance) || 0,
        wallet_info: predefinedId
      });

      setOnboardingStep(0);
      fetchData();
    } catch (err) {
      alert('Failed to complete wallet setup. Please try again.');
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={styles.loadingContainer}>
        <div className="animate-fade-in" style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          Syncing balance sheets...
        </div>
      </div>
    );
  }

  if (onboardingStep > 0) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <div style={styles.onboardingBox} className="animate-fade-in">
          {onboardingStep === 1 ? (
            <div style={styles.onboardingContent}>
              <div style={styles.onboardingLogoContainer}>
                <img src="/logo.png" alt="Amar Hishab Logo" style={styles.onboardingLogo} />
              </div>
              <h2 style={styles.onboardingTitle}>Welcome to Amar Hishab</h2>
              <p style={styles.onboardingDesc}>
                Take control of your daily financial transactions. Keep track of cash flows, log recurring incomes, and monitor your expenses seamlessly in one secure place.
              </p>
              <button 
                onClick={() => setOnboardingStep(2)}
                className="primary-btn" 
                style={{ width: '100%', marginTop: '20px', fontWeight: '500', textTransform: 'none' }}
              >
                Set Up My First Wallet ➔
              </button>
            </div>
          ) : (
            <form onSubmit={handleOnboardingSubmit} style={styles.onboardingContent}>
              <div style={styles.onboardingLogoContainer}>
                <img src="/logo.png" alt="Amar Hishab Logo" style={styles.onboardingLogo} />
              </div>
              <h2 style={styles.onboardingTitle}>Create Your First Wallet</h2>
              <p style={styles.onboardingDesc}>
                A wallet represents where your money resides (such as cash in hand, a bank account, or mobile payments). It lets you set starting balances and log items against it.
              </p>
              
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Wallet Name</label>
                <input 
                  type="text"
                  value={firstWalletName}
                  onChange={(e) => setFirstWalletName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Starting Balance (Tk.)</label>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  value={firstWalletBalance}
                  onChange={(e) => setFirstWalletBalance(e.target.value)}
                  className="input-field"
                  required
                />
                <span style={styles.inputNote}>
                  Note: You can update the wallet name and balance settings later.
                </span>
              </div>

              <button 
                type="submit" 
                className="primary-btn" 
                style={{ width: '100%', marginTop: '16px', fontWeight: '500', textTransform: 'none' }}
                disabled={submittingOnboarding}
              >
                {submittingOnboarding ? 'Setting up...' : 'Finish Setup & Open App ➔'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Calculate coordinates for the SVG Bar Chart (Income vs Cost vs Saved)
  const renderSVGBarChart = () => {
    if (!data?.graph_data || data.graph_data.length === 0) return null;

    // Reverse to show chronological order (left to right)
    const points = [...data.graph_data].reverse();
    
    // Find maximum cost/income to scale the Y-axis
    const maxVal = Math.max(...points.map(p => Math.max(p.cost, p.income)), 1000);
    // Find minimum saved value (which can be negative)
    const minVal = Math.min(...points.map(p => p.income - p.cost), 0);
    
    const totalRange = maxVal - minVal;
    
    const svgWidth = 340;
    const svgHeight = 150;
    const paddingX = 45;
    const paddingYTop = 20;
    const paddingYBottom = 20;
    
    const chartWidth = svgWidth - paddingX - 10;
    const chartHeight = svgHeight - paddingYTop - paddingYBottom;

    const intervalWidth = chartWidth / points.length;
    const barWidth = 10;
    const gapBetween = 2;

    const getY = (val) => {
      const ratio = (val - minVal) / totalRange;
      return svgHeight - paddingYBottom - ratio * chartHeight;
    };

    const yZero = getY(0);

    // Generate grid lines
    const gridLines = [];
    for (let j = 0; j <= 4; j++) {
      gridLines.push(minVal + (j / 4) * totalRange);
    }

    return (
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={styles.svgChart}>
        {/* Grid lines */}
        {gridLines.map((val, idx) => {
          const y = getY(val);
          return (
            <g key={idx}>
              <line 
                x1={paddingX} 
                y1={y} 
                x2={svgWidth - 10} 
                y2={y} 
                stroke="var(--border-color)" 
                strokeWidth="1"
                strokeDasharray="3 3" 
              />
              <text 
                x={paddingX - 8} 
                y={y + 3} 
                textAnchor="end" 
                fill="var(--color-text-muted)" 
                fontSize="8"
                fontFamily="var(--font-mono)"
              >
                {Math.round(val).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* 0 Baseline highlight */}
        <line 
          x1={paddingX} 
          y1={yZero} 
          x2={svgWidth - 10} 
          y2={yZero} 
          stroke="var(--color-text-muted)" 
          strokeWidth="1" 
          opacity="0.3"
        />

        {/* Bars */}
        {points.map((p, i) => {
          const monthCenterX = paddingX + i * intervalWidth + intervalWidth / 2;
          
          const costVal = p.cost;
          const incomeVal = p.income;
          const savedVal = p.income - p.cost;

          const yCost = getY(costVal);
          const yIncome = getY(incomeVal);
          const ySaved = getY(savedVal);

          const hCost = Math.abs(yZero - yCost);
          const hIncome = Math.abs(yZero - yIncome);
          const hSaved = Math.abs(yZero - ySaved);

          const xCost = monthCenterX - 1.5 * barWidth - gapBetween;
          const xIncome = monthCenterX - 0.5 * barWidth;
          const xSaved = monthCenterX + 0.5 * barWidth + gapBetween;

          return (
            <g key={i}>
              {/* Cost bar (Pink) */}
              <rect 
                x={xCost}
                y={costVal >= 0 ? yCost : yZero}
                width={barWidth}
                height={hCost || 1}
                fill="#ffe2e2"
                stroke="#f87171"
                strokeWidth="1"
                rx="1"
              />
              {/* Income bar (Blue) */}
              <rect 
                x={xIncome}
                y={incomeVal >= 0 ? yIncome : yZero}
                width={barWidth}
                height={hIncome || 1}
                fill="#dbeafe"
                stroke="#60a5fa"
                strokeWidth="1"
                rx="1"
              />
              {/* Saved bar (Yellow/Orange) */}
              <rect 
                x={xSaved}
                y={savedVal >= 0 ? ySaved : yZero}
                width={barWidth}
                height={hSaved || 1}
                fill={savedVal >= 0 ? "#fef9c3" : "#ffe4e6"}
                stroke={savedVal >= 0 ? "#facc15" : "#fda4af"}
                strokeWidth="1"
                rx="1"
              />

              {/* Month label */}
              <text 
                x={monthCenterX} 
                y={svgHeight - 6} 
                textAnchor="middle" 
                fill="var(--color-text-secondary)" 
                fontSize="8.5"
                fontWeight="600"
              >
                {p.month_name.substring(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Calculate coordinates for the SVG Line Chart (Account balance trend)
  const renderSVGLineChart = () => {
    if (!data?.graph_data || data.graph_data.length === 0) return null;
    
    // Reverse to show chronological order (left to right)
    const points = [...data.graph_data].reverse();
    const maxVal = Math.max(...points.map(p => p.balance), 1);
    
    const svgWidth = 340;
    const svgHeight = 120;
    const paddingX = 35;
    const paddingY = 15;
    
    const chartWidth = svgWidth - paddingX * 2;
    const chartHeight = svgHeight - paddingY * 2;
    
    // Construct line coordinates
    const coordinates = points.map((p, i) => {
      const x = paddingX + (i / Math.max(1, points.length - 1)) * chartWidth;
      const y = paddingY + chartHeight - (p.balance / maxVal) * chartHeight;
      return { x, y, label: p.month_name.slice(0, 3), balance: p.balance };
    });
    
    const dPath = coordinates.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, '');

    return (
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={styles.svgChart}>
        {/* Draw subtle grid lines */}
        <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="var(--border-color)" strokeDasharray="3 3" />
        <line x1={paddingX} y1={paddingY + chartHeight/2} x2={svgWidth - paddingX} y2={paddingY + chartHeight/2} stroke="var(--border-color)" strokeDasharray="3 3" />
        <line x1={paddingX} y1={paddingY + chartHeight} x2={svgWidth - paddingX} y2={paddingY + chartHeight} stroke="var(--border-color)" />
        
        {/* Line Path */}
        {dPath && <path d={dPath} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />}
        
        {/* Plot points & labels */}
        {coordinates.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--color-primary)" strokeWidth="2" />
            <text x={p.x} y={svgHeight - 2} textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="600">
              {p.label}
            </text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fill="var(--color-text-primary)" fontSize="8.5" fontWeight="700" fontFamily="var(--font-mono)">
              Tk. {Math.round(p.balance/1000)}k
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <MobileLayout title="Amar Hishab">
      {/* Balance Teal Card */}
      <div className="glass-card" style={styles.balanceCard}>
        <span style={styles.balanceLabel}>CURRENT LIQUIDITY</span>
        <h1 style={styles.balanceValue}>Tk. <span className="monospace-number">{(data?.total_balance ?? 0).toLocaleString()}</span></h1>
        <div style={styles.metricsRow}>
          <div style={styles.metricCol}>
            <div>
              <span style={styles.miniLabel}>↗ MONTHLY INCOME</span>
              <h4 style={styles.incomeVal}>Tk. <span className="monospace-number">{(data?.current_month_income ?? 0).toLocaleString()}</span></h4>
            </div>
          </div>
          <div style={styles.verticalDivider} />
          <div style={styles.metricCol}>
            <div>
              <span style={styles.miniLabel}>↙ MONTHLY EXPENSE</span>
              <h4 style={styles.costVal}>Tk. <span className="monospace-number">{(data?.current_month_cost ?? 0).toLocaleString()}</span></h4>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Operations */}
      <div style={styles.actionGrid}>
        <div onClick={() => navigate('/incomes', { state: { openAddModal: true } })} style={{ ...styles.actionCard, background: '#ede9fe', color: '#5b21b6' }}>
          <div style={{ ...styles.actionIconContainer, background: 'rgba(91, 33, 182, 0.1)', color: '#5b21b6' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>+</span>
          </div>
          <span style={{ ...styles.actionText, color: '#5b21b6' }}>INCOME</span>
        </div>
        
        <div onClick={() => navigate('/costs', { state: { openAddModal: true } })} style={{ ...styles.actionCard, background: '#ffece3', color: '#c2410c' }}>
          <div style={{ ...styles.actionIconContainer, background: 'rgba(194, 65, 12, 0.1)', color: '#c2410c' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>−</span>
          </div>
          <span style={{ ...styles.actionText, color: '#c2410c' }}>EXPENSE</span>
        </div>

        <div onClick={() => navigate('/loans')} style={{ ...styles.actionCard, background: '#e0f2fe', color: '#0369a1' }}>
          <div style={{ ...styles.actionIconContainer, background: 'rgba(3, 105, 161, 0.1)', color: '#0369a1' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>%</span>
          </div>
          <span style={{ ...styles.actionText, color: '#0369a1' }}>LOANS</span>
        </div>

        <div onClick={() => navigate('/planned')} style={{ ...styles.actionCard, background: '#fef3c7', color: '#b45309' }}>
          <div style={{ ...styles.actionIconContainer, background: 'rgba(180, 83, 9, 0.1)', color: '#b45309' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>🗓</span>
          </div>
          <span style={{ ...styles.actionText, color: '#b45309' }}>PLANNED</span>
        </div>

        <div onClick={() => navigate('/categories')} style={{ ...styles.actionCard, background: '#e6f4f1', color: '#115e59' }}>
          <div style={{ ...styles.actionIconContainer, background: 'rgba(17, 94, 89, 0.1)', color: '#115e59' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>♢</span>
          </div>
          <span style={{ ...styles.actionText, color: '#115e59' }}>SECTORS</span>
        </div>
      </div>

      {/* Cash Flow Comparison Chart */}
      <div className="glass-card" style={styles.chartPanel}>
        <div style={styles.panelHeader}>
          <TrendingUp size={16} color="var(--color-primary)" style={{ marginRight: '6px' }} />
          <h4 style={styles.panelTitle}>Cash Flow Comparison (Bar)</h4>
        </div>
        <div style={styles.chartLegend}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendBadge, background: '#ffe2e2', borderColor: '#f87171' }} />
            <span style={styles.legendText}>COST</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendBadge, background: '#dbeafe', borderColor: '#60a5fa' }} />
            <span style={styles.legendText}>INCOME</span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendBadge, background: '#fef9c3', borderColor: '#facc15' }} />
            <span style={styles.legendText}>SAVED</span>
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          {renderSVGBarChart()}
        </div>
      </div>

      {/* Account trend Chart */}
      <div className="glass-card" style={styles.chartPanel}>
        <div style={styles.panelHeader}>
          <TrendingUp size={16} color="var(--color-primary)" style={{ marginRight: '6px' }} />
          <h4 style={styles.panelTitle}>Balance History (Line)</h4>
        </div>
        <div style={{ marginTop: '16px' }}>
          {renderSVGLineChart()}
        </div>
      </div>

      {/* Wallet Carousel list */}
      <div style={styles.walletsSection}>
        <div style={styles.sectionHeader}>
          <h4 style={styles.sectionTitle}>My Wallets</h4>
          <span onClick={() => navigate('/wallets')} style={styles.seeAll}>See All</span>
        </div>
        
        <div style={styles.walletsScroll}>
          {data?.wallets.map((wallet) => (
            <div key={wallet.id} className="glass-card" style={styles.walletCard}>
              <div style={styles.walletHeader}>
                <div style={styles.walletIcon}>
                  <WalletIcon size={16} color="var(--color-primary)" />
                </div>
                <span style={styles.walletNumber}>{wallet.wallet_number || 'Cash'}</span>
              </div>
              <div style={{ marginTop: '14px' }}>
                <h5 style={styles.walletName}>{wallet.wallet_name}</h5>
                <h4 style={styles.walletBalance}>Tk. <span className="monospace-number">{(wallet.wallet_status ?? 0).toLocaleString()}</span></h4>
              </div>
            </div>
          ))}
          {data?.wallets.length === 0 && (
            <p style={styles.mutedText}>No wallets configured.</p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
  },
  balanceCard: {
    background: '#1e3d37',
    color: '#fff',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '20px',
    borderRadius: '24px',
    boxShadow: '0 8px 24px rgba(30, 61, 55, 0.12)',
  },
  balanceLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#a9c0be',
    letterSpacing: '0.08em',
  },
  balanceValue: {
    fontSize: '26px',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
    color: '#2dd4bf', // Sleek mint teal highlight
  },
  metricsRow: {
    display: 'flex',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '20px',
  },
  metricCol: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  verticalDivider: {
    width: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  miniLabel: {
    fontSize: '9px',
    color: '#a9c0be',
    display: 'block',
    letterSpacing: '0.06em',
    marginBottom: '2px',
  },
  incomeVal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#34d399',
    fontFamily: 'var(--font-sans)',
  },
  costVal: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f87171',
    fontFamily: 'var(--font-sans)',
  },
  actionGrid: {
    display: 'flex',
    gap: '10px',
    width: 'auto',
    overflowX: 'auto',
    paddingBottom: '12px',
    marginLeft: '-20px',
    marginRight: '-20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    flexShrink: 0,
    minHeight: '102px',
  },
  actionCard: {
    width: '82px',
    minWidth: '82px',
    height: '90px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 6px',
    cursor: 'pointer',
    borderRadius: '16px',
    boxShadow: '0 6px 16px rgba(30, 61, 55, 0.04)',
    border: '1px solid rgba(30, 61, 55, 0.03)',
  },
  actionIconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  chartPanel: {
    padding: '16px 20px',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  panelTitle: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.08em',
  },
  svgChart: {
    overflow: 'visible',
  },
  walletsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-text-secondary)',
  },
  seeAll: {
    fontSize: '10px',
    color: 'var(--color-primary)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
  },
  walletsScroll: {
    display: 'flex',
    gap: '14px',
    overflowX: 'auto',
    paddingBottom: '10px',
    scrollbarWidth: 'none',
  },
  walletCard: {
    flexShrink: 0,
    width: '160px',
    padding: '16px',
    background: '#ffffff',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-lg)',
  },
  walletHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletIcon: {
    background: 'rgba(30, 61, 55, 0.05)',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletNumber: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  walletName: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
  },
  walletBalance: {
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'var(--font-mono)',
    marginTop: '2px',
  },
  mutedText: {
    color: 'var(--color-text-muted)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '16px 0',
    width: '100%',
  },
  onboardingBox: {
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    maxWidth: '400px',
    margin: 'auto',
  },
  onboardingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '16px',
    width: '100%',
  },
  onboardingLogoContainer: {
    width: '96px',
    height: '96px',
    borderRadius: '24px',
    background: 'var(--bg-card)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-color)',
    padding: '12px',
  },
  onboardingLogo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  onboardingTitle: {
    fontSize: '24px',
    fontWeight: '800',
    fontFamily: 'var(--font-display)',
    color: 'var(--color-text-primary)',
  },
  onboardingDesc: {
    fontSize: '13.5px',
    lineHeight: '1.6',
    color: 'var(--color-text-secondary)',
    marginBottom: '8px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    textAlign: 'left',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.05em',
  },
  inputNote: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendBadge: {
    width: '16px',
    height: '10px',
    borderRadius: '3px',
    border: '1px solid',
  },
  legendText: {
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.05em',
  }
};

export default Dashboard;
