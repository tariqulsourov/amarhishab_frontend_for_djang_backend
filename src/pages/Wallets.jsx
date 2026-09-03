import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';
import api from '../utils/api';
import { Wallet, Plus, ArrowLeftRight, X, TrendingUp, TrendingDown, Building, Smartphone } from 'lucide-react';

const Wallets = () => {
  const [wallets, setWallets] = useState([]);
  const [predefined, setPredefined] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loansSummary, setLoansSummary] = useState({ total_payable: 0, total_receivable: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('wallets'); // 'wallets' or 'transfers'

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'transfer'

  // Form State
  const [walletForm, setWalletForm] = useState({ wallet_name: '', wallet_number: '', wallet_status: '', wallet_info: '' });
  const [transferForm, setTransferForm] = useState({ transfer_from: '', transfer_to: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, pRes, tRes, lRes] = await Promise.all([
        api.get('/api/v1/wallets/'),
        api.get('/api/v1/predefined-wallets/'),
        api.get('/api/v1/wallets/transfer/'),
        api.get('/api/v1/loans/summary/')
      ]);
      setWallets(wRes.data);
      setPredefined(pRes.data);
      setTransfers(tRes.data);
      setLoansSummary(lRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/wallets/', walletForm);
      setActiveModal(null);
      setWalletForm({ wallet_name: '', wallet_number: '', wallet_status: '', wallet_info: '' });
      fetchData();
    } catch (err) {
      alert('Failed to create wallet.');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/wallets/transfer/', transferForm);
      setActiveModal(null);
      setTransferForm({ transfer_from: '', transfer_to: '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Transfer failed.');
    }
  };

  const handleSwap = () => {
    setTransferForm({
      ...transferForm,
      transfer_from: transferForm.transfer_to,
      transfer_to: transferForm.transfer_from
    });
  };

  const addSuggestion = (val) => {
    const currentVal = parseFloat(transferForm.amount) || 0;
    setTransferForm({
      ...transferForm,
      amount: String(currentVal + val)
    });
  };

  const totalBalance = wallets.reduce((acc, w) => acc + (w.wallet_status || 0), 0);

  // Helper to determine config
  const getProviderConfig = (wallet) => {
    const name = wallet.wallet_info_detail?.name || '';
    if (name === 'bkash') {
      return {
        icon: Smartphone,
        bg: 'rgba(239, 68, 68, 0.08)', // Light coral
        color: '#ef4444',
        badge: 'MOBILE'
      };
    }
    if (name === 'nagad') {
      return {
        icon: Smartphone,
        bg: 'rgba(249, 115, 22, 0.08)', // Light orange
        color: '#f97316',
        badge: 'MOBILE'
      };
    }
    if (name === 'rocket') {
      return {
        icon: Smartphone,
        bg: 'rgba(168, 85, 247, 0.08)', // Light purple
        color: '#a855f7',
        badge: 'MOBILE'
      };
    }
    if (name === 'my-wallet') {
      return {
        icon: Wallet,
        bg: 'rgba(16, 185, 129, 0.08)', // Light green
        color: '#10b981',
        badge: 'CASH'
      };
    }
    return {
      icon: Building,
      bg: 'rgba(6, 182, 212, 0.08)', // Light cyan/teal bank
      color: '#06b6d4',
      badge: 'BANK'
    };
  };

  const selectedSourceWallet = wallets.find(w => String(w.id) === String(transferForm.transfer_from));

  const totalWalletBalance = wallets.reduce((acc, w) => acc + (w.wallet_status || 0), 0);
  const positiveWallets = wallets.filter(w => w.wallet_status > 0).reduce((acc, w) => acc + w.wallet_status, 0);
  const negativeWallets = wallets.filter(w => w.wallet_status < 0).reduce((acc, w) => acc + Math.abs(w.wallet_status), 0);

  const calculatedAssets = positiveWallets + (loansSummary.total_receivable || 0);
  const calculatedLiabilities = negativeWallets + (loansSummary.total_payable || 0);

  return (
    <MobileLayout title="Amar Hishab">
      {/* Top Total Balance Card */}
      <div className="glass-card" style={styles.topHeaderCard}>
        <span style={styles.headerLabel}>TOTAL BALANCE</span>
        <h1 style={styles.headerValue}>
          ৳ <span className="monospace-number">{totalWalletBalance.toLocaleString()}</span>
        </h1>
        
        {/* Dynamic sub-widgets row for Assets and Liabilities */}
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <TrendingUp size={12} color="#34d399" style={{ marginRight: '4px' }} />
              <span>ASSETS</span>
            </div>
            <h4 style={styles.miniValue}>
              ৳ <span className="monospace-number">{calculatedAssets.toLocaleString()}</span>
            </h4>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <TrendingDown size={12} color="#f87171" style={{ marginRight: '4px' }} />
              <span>LIABILITIES</span>
            </div>
            <h4 style={styles.miniValue}>
              -৳ <span className="monospace-number">{calculatedLiabilities.toLocaleString()}</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Tab Segmented Selectors */}
      <div style={styles.topActions}>
        <button 
          onClick={() => setSelectedTab('wallets')} 
          style={{
            ...styles.newWalletBtn,
            background: selectedTab === 'wallets' ? '#112d27' : '#e6f4f1',
            color: selectedTab === 'wallets' ? '#ffffff' : '#115e59',
          }}
        >
          All Wallets
        </button>
        <button 
          onClick={() => setSelectedTab('transfers')} 
          style={{
            ...styles.transferBtn,
            background: selectedTab === 'transfers' ? '#112d27' : '#e6f4f1',
            color: selectedTab === 'transfers' ? '#ffffff' : '#115e59',
          }}
        >
          All Transfers
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'wallets' ? (
        <>
          {/* Accounts List Header */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Accounts ({wallets.length})</span>
            <div style={styles.headerRightActions}>
              <button style={styles.sortBtn}>Sort</button>
              <Link to="/loans" style={styles.sortBtn}>Loans</Link>
              <button 
                onClick={() => { 
                  setWalletForm({ wallet_name: '', wallet_number: '', wallet_status: '', wallet_info: predefined[0]?.id || '' }); 
                  setActiveModal('create'); 
                }} 
                style={styles.addIconButton}
                title="Add New Wallet"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Wallets List */}
          <div style={styles.listContainer}>
            {loading ? (
              <p style={styles.infoText}>Loading wallets...</p>
            ) : wallets.length === 0 ? (
              <p style={styles.infoText}>No active wallets.</p>
            ) : (
              wallets.map((wallet) => {
                const config = getProviderConfig(wallet);
                const Icon = config.icon;
                const isNegative = wallet.wallet_status < 0;
                return (
                  <div key={wallet.id} className="glass-card" style={styles.card}>
                    <div style={styles.cardLeft}>
                      <div style={{ ...styles.iconContainer, background: config.bg, color: config.color }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={styles.titleRow}>
                          <h4 style={styles.walletName}>{wallet.wallet_name}</h4>
                          <span style={{ ...styles.badgePill, background: config.bg, color: config.color }}>{config.badge}</span>
                        </div>
                        <p style={styles.walletNo}>{wallet.wallet_number || 'No Account No.'}</p>
                      </div>
                    </div>
                    <h3 style={{ ...styles.balance, color: isNegative ? '#ef4444' : 'var(--color-text-primary)' }}>
                      {isNegative ? '-' : ''}৳ <span className="monospace-number">{Math.abs(wallet.wallet_status).toLocaleString()}</span>
                    </h3>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {/* Transfer History Header */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Transfer History ({transfers.length})</span>
            <button 
              onClick={() => { 
                setTransferForm({ transfer_from: wallets[0]?.id || '', transfer_to: wallets[1]?.id || '', amount: '', description: '', transfer_date: new Date().toISOString().split('T')[0] }); 
                setActiveModal('transfer'); 
              }} 
              style={styles.addIconButton}
              title="New Transfer"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Transfer History List */}
          <div style={styles.transferListContainer}>
            {loading ? (
              <p style={styles.infoText}>Loading transfers...</p>
            ) : transfers.length === 0 ? (
              <p style={styles.infoText}>No transfer logs found.</p>
            ) : (
              transfers.map((item) => {
                const displayDate = item.transfer_date || item.tansfered_date;
                return (
                  <div key={item.id} className="glass-card" style={styles.transferCard}>
                    {/* Detailed Transfer Grid */}
                    <div style={styles.transferGrid}>
                      {/* Left Column: From Wallet */}
                      <div style={styles.transferCol}>
                        <span style={styles.transferWalletLabel}>
                          {item.transfer_from_wallet.toUpperCase()}
                          <span style={styles.outflowBadge}>(-{item.transfered_amount.toLocaleString()})</span>
                        </span>
                        <span style={styles.transferAmountSub}>
                          {item.prev_amount_of_transfered_from.toLocaleString()} ৳
                        </span>
                        <span style={styles.transferAmountMain}>
                          {item.current_amount_of_transfered_from.toLocaleString()} ৳
                        </span>
                      </div>

                      {/* Middle Column: Arrow & Labels */}
                      <div style={styles.transferCenterCol}>
                        <span style={styles.transferArrow}>→</span>
                        <span style={styles.transferStepLabel}>prev</span>
                        <span style={styles.transferStepLabel}>now</span>
                      </div>

                      {/* Right Column: To Wallet */}
                      <div style={styles.transferCol}>
                        <span style={styles.transferWalletLabel}>
                          {item.transfer_to_wallet.toUpperCase()}
                          <span style={styles.inflowBadge}>(+{item.transfered_amount.toLocaleString()})</span>
                        </span>
                        <span style={styles.transferAmountSub}>
                          {item.prev_amount_of_transfered_to.toLocaleString()} ৳
                        </span>
                        <span style={styles.transferAmountMain}>
                          {item.current_amount_of_transfered_to.toLocaleString()} ৳
                        </span>
                      </div>
                    </div>

                    {/* Transfer Date and Memo description note */}
                    <div style={styles.transferFooter}>
                      <span style={styles.transferDateText}>{displayDate}</span>
                      {item.description && (
                        <span style={styles.transferMemoText}>"{item.description}"</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Modals Sheet */}
      {activeModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {activeModal === 'create' ? 'Create New Wallet' : 'Balance Transfer'}
              </h3>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            {activeModal === 'transfer' && (
              <p style={styles.modalSubtitle}>Move money instantly between your wallets.</p>
            )}

            {/* Create form */}
            {activeModal === 'create' && (
              <form onSubmit={handleCreate} style={styles.form}>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Wallet Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. My Bank Account"
                    value={walletForm.wallet_name}
                    onChange={(e) => setWalletForm({ ...walletForm, wallet_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Provider Type</label>
                  <select 
                    value={walletForm.wallet_info}
                    onChange={(e) => setWalletForm({ ...walletForm, wallet_info: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select template type...</option>
                    {predefined.map(p => <option key={p.id} value={p.id}>{p.full_name || p.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Account Number / Info</label>
                  <input 
                    type="text"
                    placeholder="e.g. 017xxxxxxxx or Bank AC"
                    value={walletForm.wallet_number}
                    onChange={(e) => setWalletForm({ ...walletForm, wallet_number: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Starting Balance (৳)</label>
                  <input 
                    type="number"
                    value={walletForm.wallet_status}
                    onChange={(e) => setWalletForm({ ...walletForm, wallet_status: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <button type="submit" className="primary-btn" style={styles.submitBtn}>
                  Create Wallet
                </button>
              </form>
            )}

            {/* Transfer form */}
            {activeModal === 'transfer' && (
              <form onSubmit={handleTransfer} style={styles.form}>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>FROM</label>
                  <select 
                    value={transferForm.transfer_from}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_from: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select source...</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.wallet_name} &nbsp; ৳{w.wallet_status.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Styled swap circle button */}
                <div style={styles.swapWrapper}>
                  <div style={styles.swapDivider} />
                  <button type="button" onClick={handleSwap} style={styles.swapCircleBtn}>
                    <ArrowLeftRight size={14} />
                  </button>
                  <div style={styles.swapDivider} />
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>TO</label>
                  <select 
                    value={transferForm.transfer_to}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_to: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select destination...</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.wallet_name} &nbsp; ৳{w.wallet_status.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <div style={styles.amountHeader}>
                    <label style={styles.label}>AMOUNT</label>
                    {selectedSourceWallet && (
                      <span style={styles.availableText}>
                        Available: ৳{selectedSourceWallet.wallet_status.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Taka symbol prefixed input */}
                  <div style={styles.amountInputWrapper}>
                    <span style={styles.takaPrefix}>৳</span>
                    <input 
                      type="number"
                      placeholder="Enter amount"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      style={styles.amountField}
                      required
                    />
                  </div>

                  {/* Suggestions Row */}
                  <div style={styles.suggestionsRow}>
                    <button type="button" onClick={() => addSuggestion(1000)} style={styles.suggestionBtn}>+1,000</button>
                    <button type="button" onClick={() => addSuggestion(5000)} style={styles.suggestionBtn}>+5,000</button>
                    <button type="button" onClick={() => addSuggestion(10000)} style={styles.suggestionBtn}>+10,000</button>
                  </div>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>TRANSFER DATE</label>
                  <input 
                    type="date"
                    value={transferForm.transfer_date}
                    onChange={(e) => setTransferForm({ ...transferForm, transfer_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>DESCRIPTION / NOTE</label>
                  <input 
                    type="text"
                    placeholder="e.g. Monthly rent allowance, pocket money"
                    value={transferForm.description}
                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                    className="input-field"
                  />
                </div>

                <button type="submit" className="primary-btn" style={styles.submitBtn}>
                  Confirm Transfer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  topHeaderCard: {
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
  headerLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#a9c0be',
    letterSpacing: '0.08em',
  },
  headerValue: {
    fontSize: '26px',
    fontWeight: '700',
    fontFamily: 'var(--font-sans)',
    color: '#2dd4bf', // Sleek mint teal highlight
  },
  metricsRow: {
    display: 'flex',
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '12px',
  },
  metricCard: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '10px 12px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  miniHeader: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '8.5px',
    color: '#a9c0be',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  miniValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  topActions: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    marginTop: '16px',
  },
  newWalletBtn: {
    flex: 1,
    height: '42px',
    borderRadius: '20px',
    border: 'none',
    background: '#112d27',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBtn: {
    flex: 1,
    height: '42px',
    borderRadius: '20px',
    border: 'none',
    background: '#e6f4f1',
    color: '#115e59',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    marginBottom: '8px',
  },
  headerRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addIconButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    background: '#112d27',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(17, 45, 39, 0.2)',
    transition: 'all 0.2s ease',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 12px rgba(30, 61, 55, 0.02)',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  walletName: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  badgePill: {
    fontSize: '8px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
  },
  walletNo: {
    fontSize: '10.5px',
    color: 'var(--color-text-muted)',
    marginTop: '1px',
  },
  balance: {
    fontSize: '14px',
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 7, 18, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    zIndex: 100,
  },
  modalContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'var(--bg-card)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--color-text-primary)',
  },
  modalSubtitle: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    marginTop: '-8px',
    marginBottom: '4px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.02em',
  },
  submitBtn: {
    marginTop: '10px',
    height: '42px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '13px',
    background: '#112d27',
  },
  swapWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '4px 0',
  },
  swapDivider: {
    flex: 1,
    height: '1px',
    background: 'var(--border-color)',
  },
  swapCircleBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  },
  amountHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableText: {
    fontSize: '10.5px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
  },
  amountInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  takaPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
  },
  amountField: {
    width: '100%',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    paddingLeft: '32px',
    paddingRight: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    outline: 'none',
  },
  suggestionsRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  suggestionBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.02)',
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  infoText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    padding: '30px 0',
  },
  transferListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  transferCard: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(30, 61, 55, 0.02)',
    overflow: 'hidden',
    padding: '0',
    background: 'var(--bg-card)',
  },
  transferGrid: {
    display: 'flex',
    padding: '12px 12px 6px 12px',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferCol: {
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    textAlign: 'center',
  },
  transferCenterCol: {
    flex: 0.6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  transferWalletLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1px',
  },
  outflowBadge: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#ef4444',
    marginTop: '2px',
  },
  inflowBadge: {
    fontSize: '9px',
    fontWeight: '700',
    color: '#10b981',
    marginTop: '2px',
  },
  transferAmountSub: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    marginTop: '6px',
    fontFamily: 'var(--font-mono)',
  },
  transferAmountMain: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  transferArrow: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  transferStepLabel: {
    fontSize: '8px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.04em',
    marginTop: '5px',
  },
  transferFooter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 12px 10px 12px',
    gap: '2px',
  },
  transferDateText: {
    fontSize: '10.5px',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
  },
  transferMemoText: {
    fontSize: '10px',
    fontStyle: 'italic',
    color: 'var(--color-text-secondary)',
  }
};

export default Wallets;
