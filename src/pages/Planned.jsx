import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import WalletBadge from '../components/WalletBadge';
import api from '../utils/api';
import { Plus, X, Trash2, Check, Calendar, DollarSign, Landmark, ChevronRight, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const Planned = () => {
  const [scheduledList, setScheduledList] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [costCategories, setCostCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    transaction_type: 'cost', // 'cost' | 'income'
    amount: '',
    wallet: '',
    cost_category: '',
    income_category: '',
    description: ''
  });

  const [selectedDates, setSelectedDates] = useState([new Date().toISOString().split('T')[0]]);
  const [tempDate, setTempDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, wRes, cRes, iRes] = await Promise.all([
        api.get('/api/v1/scheduled-transactions/'),
        api.get('/api/v1/wallets/'),
        api.get('/api/v1/costs/categories/'),
        api.get('/api/v1/income/categories/')
      ]);
      setScheduledList(sRes.data);
      setWallets(wRes.data);
      setCostCategories(cRes.data);
      setIncomeCategories(iRes.data);
      
      // Auto-set default wallet and categories
      if (wRes.data.length > 0) {
        setForm(prev => ({ 
          ...prev, 
          wallet: wRes.data[0].id,
          cost_category: cRes.data[0]?.id || '',
          income_category: iRes.data[0]?.id || ''
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert('Please add at least one schedule date.');
      return;
    }
    try {
      const payload = {
        transaction_type: form.transaction_type,
        amount: parseInt(form.amount, 10),
        wallet: form.wallet,
        scheduled_dates: selectedDates,
        description: form.description,
        cost_category: form.transaction_type === 'cost' ? form.cost_category : null,
        income_category: form.transaction_type === 'income' ? form.income_category : null
      };

      await api.post('/api/v1/scheduled-transactions/', payload);
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to schedule transaction.');
    }
  };

  const handleDirectApprove = async (id) => {
    try {
      await api.post(`/api/v1/scheduled-transactions/${id}/approve/`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve transaction.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this planned transaction?')) return;
    try {
      await api.delete(`/api/v1/scheduled-transactions/${id}/`);
      fetchData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({
      transaction_type: 'cost',
      amount: '',
      wallet: wallets[0]?.id || '',
      cost_category: costCategories[0]?.id || '',
      income_category: incomeCategories[0]?.id || '',
      description: ''
    });
    setSelectedDates([today]);
    setTempDate(today);
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'approved':
        return { label: 'Logged', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' };
      default:
        return { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
    }
  };

  return (
    <MobileLayout title="Planned Logs">
      {/* Top Header metrics summary */}
      <div className="glass-card" style={styles.topHeaderCard}>
        <span style={styles.headerLabel}>PLANNED SUMMARY</span>
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <ArrowUpRight size={12} color="#34d399" style={{ marginRight: '4px' }} />
              <span>PENDING INCOMES</span>
            </div>
            <h4 style={styles.miniValue}>
              ৳ <span className="monospace-number">
                {scheduledList
                  .filter(s => s.status === 'pending' && s.transaction_type === 'income')
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </span>
            </h4>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <ArrowDownLeft size={12} color="#f87171" style={{ marginRight: '4px' }} />
              <span>PENDING EXPENSES</span>
            </div>
            <h4 style={styles.miniValue}>
              ৳ <span className="monospace-number">
                {scheduledList
                  .filter(s => s.status === 'pending' && s.transaction_type === 'cost')
                  .reduce((sum, s) => sum + s.amount, 0)
                  .toLocaleString()}
              </span>
            </h4>
          </div>
        </div>
      </div>

      {/* Title & Add Button */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Schedules ({scheduledList.length})</span>
        <button onClick={() => { resetForm(); setShowAddModal(true); }} style={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Schedule
        </button>
      </div>

      {/* List content */}
      <div style={styles.listContainer}>
        {loading ? (
          <p style={styles.infoText}>Loading planned logs...</p>
        ) : scheduledList.length === 0 ? (
          <p style={styles.infoText}>No planned transactions scheduled.</p>
        ) : (
          scheduledList.map((item) => {
            const badge = getStatusBadgeStyles(item.status);
            const isCost = item.transaction_type === 'cost';
            const categoryName = isCost 
              ? item.cost_category_detail?.short_info 
              : item.income_category_detail?.short_info;
              
            return (
              <div key={item.id} className="glass-card" style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.cardMeta}>
                    <div style={styles.titleRow}>
                      <h4 style={styles.categoryTitle}>{categoryName || 'General'}</h4>
                      <span style={{ ...styles.badgePill, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    {item.description && <p style={styles.descText}>{item.description}</p>}
                    <div style={styles.subMeta}>
                      <WalletBadge 
                        walletName={item.wallet_detail?.wallet_name} 
                        walletId={item.wallet} 
                        allWallets={wallets} 
                      />
                      <span style={styles.dot}>•</span>
                      <span>Scheduled: {item.scheduled_date}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.cardRight}>
                  <h3 style={{ ...styles.amount, color: isCost ? '#ef4444' : '#10b981' }}>
                    {isCost ? '-' : '+'}৳ <span className="monospace-number">{item.amount.toLocaleString()}</span>
                  </h3>
                  
                  <div style={styles.actionGroup}>
                    {item.status === 'pending' && (
                      <button 
                        onClick={() => handleDirectApprove(item.id)} 
                        style={{ ...styles.actionBtn, color: '#10b981', background: 'rgba(16,185,129,0.06)' }}
                        title="Approve & Log Now"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      style={{ ...styles.actionBtn, color: 'var(--color-danger)', background: 'rgba(239,68,68,0.06)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="glass-card animate-slide-up" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Schedule Future Log</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={styles.form}>
              {/* Transaction type selector */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>TRANSACTION TYPE</label>
                <div style={styles.choiceGroup}>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, transaction_type: 'cost' })}
                    style={{ ...styles.choiceBtn, background: form.transaction_type === 'cost' ? '#112d27' : 'transparent', color: form.transaction_type === 'cost' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Expense
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, transaction_type: 'income' })}
                    style={{ ...styles.choiceBtn, background: form.transaction_type === 'income' ? '#112d27' : 'transparent', color: form.transaction_type === 'income' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>AMOUNT (৳)</label>
                <div style={styles.inputWrapper}>
                  <DollarSign size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                  <input 
                    type="number"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              {/* Wallet Select */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>WALLET ACCOUNT</label>
                <div style={styles.inputWrapper}>
                  <Landmark size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                  <select 
                    value={form.wallet}
                    onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    required
                  >
                    <option value="">Select wallet...</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.wallet_name} (৳{(w.wallet_status ?? 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category selector based on type */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>CATEGORY SECTOR</label>
                <div style={styles.inputWrapper}>
                  <Landmark size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                  {form.transaction_type === 'cost' ? (
                    <select 
                      value={form.cost_category}
                      onChange={(e) => setForm({ ...form, cost_category: e.target.value })}
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                      required
                    >
                      <option value="">Select category...</option>
                      {costCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.short_info}</option>
                      ))}
                    </select>
                  ) : (
                    <select 
                      value={form.income_category}
                      onChange={(e) => setForm({ ...form, income_category: e.target.value })}
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                      required
                    >
                      <option value="">Select category...</option>
                      {incomeCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.short_info}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Date selector with multi-date tag builder */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>SCHEDULE DATES</label>
                <div style={styles.multiDateRow}>
                  <div style={{ ...styles.inputWrapper, flex: 1 }}>
                    <Calendar size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                    <input 
                      type="date"
                      value={tempDate}
                      onChange={(e) => setTempDate(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (tempDate && !selectedDates.includes(tempDate)) {
                        setSelectedDates(prev => [...prev, tempDate].sort());
                      }
                    }} 
                    style={styles.addDateBtn}
                  >
                    + Add Date
                  </button>
                </div>
                
                {/* Visual list of selected dates */}
                {selectedDates.length > 0 && (
                  <div style={styles.tagsContainer}>
                    {selectedDates.map(d => (
                      <span key={d} style={styles.dateTag}>
                        <Calendar size={10} style={{ marginRight: '4px' }} />
                        {d}
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedDates(prev => prev.filter(x => x !== d));
                          }} 
                          style={styles.tagRemoveBtn}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>SHORT NOTE</label>
                <input 
                  type="text"
                  placeholder="e.g. Monthly rent, Salary bonus"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="primary-btn" style={styles.submitBtn}>
                Schedule Log
              </button>
            </form>
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
    padding: '16px 20px 18px 20px',
    borderBottomLeftRadius: '32px',
    borderBottomRightRadius: '32px',
    borderTopLeftRadius: '0px',
    borderTopRightRadius: '0px',
    marginTop: '-20px',
    marginLeft: '-20px',
    marginRight: '-20px',
    boxShadow: '0 8px 24px rgba(30, 61, 55, 0.12)',
  },
  headerLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#a9c0be',
    letterSpacing: '0.08em',
    textAlign: 'center',
    marginBottom: '4px',
  },
  metricsRow: {
    display: 'flex',
    gap: '12px',
  },
  metricCard: {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '10px 12px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    textAlign: 'center',
  },
  miniHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8.5px',
    color: '#a9c0be',
    fontWeight: '600',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  miniValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '800',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.02em',
  },
  addBtn: {
    height: '32px',
    padding: '0 12px',
    borderRadius: '16px',
    border: 'none',
    background: '#112d27',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(17, 45, 39, 0.15)',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingBottom: '20px',
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
    flex: 1.3,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  categoryTitle: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  badgePill: {
    fontSize: '8px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  descText: {
    fontSize: '11px',
    color: 'var(--color-text-secondary)',
    marginTop: '1px',
  },
  subMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10.5px',
    color: 'var(--color-text-muted)',
    marginTop: '3px',
  },
  dot: {
    color: 'var(--color-text-muted)',
  },
  walletName: {
    color: 'var(--color-primary)',
    fontWeight: '600',
  },
  cardRight: {
    flex: 0.7,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  },
  amount: {
    fontSize: '13.5px',
    fontWeight: '700',
  },
  actionGroup: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    border: 'none',
    cursor: 'pointer',
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    opacity: 0.85,
    ':hover': {
      opacity: 1
    }
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 7, 18, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    zIndex: 2000,
    touchAction: 'none',
  },
  modalContent: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 12px)) 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxHeight: '85vh',
    width: '100%',
    boxSizing: 'border-box',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-y',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.25)',
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
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.04em',
  },
  choiceGroup: {
    display: 'flex',
    background: 'rgba(30, 61, 55, 0.05)',
    borderRadius: '12px',
    padding: '4px',
    gap: '4px',
    border: '1px solid rgba(30, 61, 55, 0.08)',
  },
  choiceBtn: {
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    padding: '8px 2px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  submitBtn: {
    marginTop: '10px',
    height: '42px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '13px',
    background: '#112d27',
  },
  infoText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    padding: '30px 0',
  },
  multiDateRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  addDateBtn: {
    height: '38px',
    padding: '0 12px',
    borderRadius: '10px',
    border: '1px solid rgba(17, 45, 39, 0.2)',
    background: 'rgba(17, 45, 39, 0.05)',
    color: '#112d27',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px',
    padding: '8px 10px',
    background: 'rgba(30, 61, 55, 0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(30, 61, 55, 0.05)',
  },
  dateTag: {
    display: 'flex',
    alignItems: 'center',
    background: '#112d27',
    color: '#ffffff',
    fontSize: '10.5px',
    fontWeight: '600',
    padding: '4px 8px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(17, 45, 39, 0.08)',
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    marginLeft: '6px',
    padding: '0 2px',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
  }
};

export default Planned;
