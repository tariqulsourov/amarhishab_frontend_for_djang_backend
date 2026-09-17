import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import WalletBadge from '../components/WalletBadge';
import api from '../utils/api';
import { Plus, X, Edit2, Trash2, User, Calendar, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Landmark, Loader2 } from 'lucide-react';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'payable' | 'receivable'
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    person_name: '',
    amount: '',
    wallet: '',
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    entry_type: 'take' // 'take' | 'give' | 'repay' | 'collect'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lRes, wRes] = await Promise.all([
        api.get('/api/v1/loans/'),
        api.get('/api/v1/wallets/')
      ]);
      setLoans(lRes.data);
      setWallets(wRes.data);
      if (wRes.data.length > 0 && !form.wallet) {
        setForm(prev => ({ ...prev, wallet: wRes.data[0].id }));
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
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await api.post('/api/v1/loans/', form);
      setActiveModal(null);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record loan entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await api.put(`/api/v1/loans/${editingItem.id}/`, form);
      setActiveModal(null);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update loan entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loan entry? The associated wallet balance will be reversed.')) return;
    try {
      await api.delete(`/api/v1/loans/${id}/`);
      fetchData();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      person_name: item.person_name,
      amount: item.amount,
      wallet: item.wallet,
      entry_date: item.entry_date,
      description: item.description || '',
      entry_type: item.entry_type
    });
    setActiveModal('edit');
  };

  const resetForm = () => {
    setForm({
      person_name: '',
      amount: '',
      wallet: wallets[0]?.id || '',
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      entry_type: 'take'
    });
    setSubmitting(false);
  };

  // Calculations
  const totalTake = loans.filter(l => l.entry_type === 'take').reduce((sum, l) => sum + l.amount, 0);
  const totalRepay = loans.filter(l => l.entry_type === 'repay').reduce((sum, l) => sum + l.amount, 0);
  const totalGive = loans.filter(l => l.entry_type === 'give').reduce((sum, l) => sum + l.amount, 0);
  const totalCollect = loans.filter(l => l.entry_type === 'collect').reduce((sum, l) => sum + l.amount, 0);

  const outstandingPayable = totalTake - totalRepay; // We owe others
  const outstandingReceivable = totalGive - totalCollect; // Others owe us

  // Filtering
  const filteredLoans = loans.filter(item => {
    if (filterType === 'payable') {
      if (!['take', 'repay'].includes(item.entry_type)) return false;
    }
    if (filterType === 'receivable') {
      if (!['give', 'collect'].includes(item.entry_type)) return false;
    }
    if (searchQuery) {
      const text = (item.person_name + ' ' + (item.description || '')).toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const getEntryBadgeStyles = (type) => {
    switch (type) {
      case 'take':
        return { label: 'Borrowed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
      case 'repay':
        return { label: 'Repaid Debt', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' };
      case 'give':
        return { label: 'Lent Out', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
      case 'collect':
        return { label: 'Collected', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' };
      default:
        return { label: 'Loan', color: 'var(--color-text-secondary)', bg: 'rgba(255,255,255,0.05)' };
    }
  };

  return (
    <MobileLayout title="Personal Loans">
      {/* Top Loans Summary Card */}
      <div className="glass-card" style={styles.topHeaderCard}>
        <span style={styles.headerLabel}>LOANS SUMMARY</span>
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <ArrowUpRight size={12} color="#34d399" style={{ marginRight: '4px' }} />
              <span>RECEIVABLE (LENT)</span>
            </div>
            <h4 style={styles.miniValue}>
              ৳ <span className="monospace-number">{outstandingReceivable.toLocaleString()}</span>
            </h4>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.miniHeader}>
              <ArrowDownLeft size={12} color="#f87171" style={{ marginRight: '4px' }} />
              <span>PAYABLE (DEBT)</span>
            </div>
            <h4 style={styles.miniValue}>
              ৳ <span className="monospace-number">{outstandingPayable.toLocaleString()}</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Search Input Filter bar */}
      <div style={{ marginTop: '14px', width: '100%' }}>
        <input 
          type="text" 
          placeholder="Search by name or description..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Tab Filter Selectors and Add Button */}
      <div style={styles.tabActionsRow}>
        <div style={styles.tabGroup}>
          <button 
            onClick={() => setFilterType('all')} 
            style={{ ...styles.tabButton, background: filterType === 'all' ? '#112d27' : 'transparent', color: filterType === 'all' ? '#fff' : 'var(--color-text-secondary)' }}
          >
            All
          </button>
          <button 
            onClick={() => setFilterType('payable')} 
            style={{ ...styles.tabButton, background: filterType === 'payable' ? '#112d27' : 'transparent', color: filterType === 'payable' ? '#fff' : 'var(--color-text-secondary)' }}
          >
            Debt
          </button>
          <button 
            onClick={() => setFilterType('receivable')} 
            style={{ ...styles.tabButton, background: filterType === 'receivable' ? '#112d27' : 'transparent', color: filterType === 'receivable' ? '#fff' : 'var(--color-text-secondary)' }}
          >
            Lent
          </button>
        </div>
        <button 
          onClick={() => { resetForm(); setActiveModal('create'); }}
          style={styles.addBtn}
          title="New Loan Entry"
        >
          <Plus size={16} style={{ marginRight: '4px' }} /> Add
        </button>
      </div>

      {/* Loans List */}
      <div style={styles.listContainer}>
        {loading ? (
          <p style={styles.infoText}>Loading loan logs...</p>
        ) : filteredLoans.length === 0 ? (
          <p style={styles.infoText}>No loan entries found.</p>
        ) : (
          filteredLoans.map((item) => {
            const badge = getEntryBadgeStyles(item.entry_type);
            const isCashInflow = ['take', 'collect'].includes(item.entry_type);
            return (
              <div key={item.id} className="glass-card" style={styles.card}>
                <div style={styles.cardLeft}>
                  <div style={styles.cardMeta}>
                    <div style={styles.titleRow}>
                      <h4 style={styles.personName}>{item.person_name}</h4>
                      <span style={{ ...styles.badgePill, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    {item.description && <p style={styles.descriptionText}>{item.description}</p>}
                    <div style={styles.subMeta}>
                      <WalletBadge 
                        walletName={item.wallet_detail?.wallet_name} 
                        walletId={item.wallet} 
                        allWallets={wallets} 
                      />
                      <span style={styles.dot}>•</span>
                      <span>{item.entry_date}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.cardRight}>
                  <h3 style={{ ...styles.amount, color: isCashInflow ? '#10b981' : '#ef4444' }}>
                    {isCashInflow ? '+' : '-'}৳ <span className="monospace-number">{item.amount.toLocaleString()}</span>
                  </h3>
                  <div style={styles.actionGroup}>
                    <button onClick={() => startEdit(item)} style={styles.actionBtn}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ ...styles.actionBtn, color: 'var(--color-danger)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals Sheet */}
      {activeModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
              setEditingItem(null);
            }
          }}
        >
          <div className="glass-card animate-slide-up" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {activeModal === 'create' ? 'Add Loan Entry' : 'Edit Loan Entry'}
              </h3>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={activeModal === 'create' ? handleCreate : handleUpdate} style={styles.form}>
              {/* Entry Type Buttons */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>TRANSACTION TYPE</label>
                <div style={styles.choiceGroup}>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, entry_type: 'take' })}
                    style={{ ...styles.choiceBtn, background: form.entry_type === 'take' ? '#112d27' : 'transparent', color: form.entry_type === 'take' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Borrowed
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, entry_type: 'give' })}
                    style={{ ...styles.choiceBtn, background: form.entry_type === 'give' ? '#112d27' : 'transparent', color: form.entry_type === 'give' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Lent Out
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, entry_type: 'repay' })}
                    style={{ ...styles.choiceBtn, background: form.entry_type === 'repay' ? '#112d27' : 'transparent', color: form.entry_type === 'repay' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Repaid Debt
                  </button>
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, entry_type: 'collect' })}
                    style={{ ...styles.choiceBtn, background: form.entry_type === 'collect' ? '#112d27' : 'transparent', color: form.entry_type === 'collect' ? '#fff' : 'var(--color-text-secondary)' }}
                  >
                    Collected
                  </button>
                </div>
              </div>

              {/* Person Name */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>PERSON NAME</label>
                <div style={styles.inputWrapper}>
                  <User size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                  <input 
                    type="text"
                    placeholder="e.g. John Doe, Friend Bob"
                    value={form.person_name}
                    onChange={(e) => setForm({ ...form, person_name: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
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

              {/* Date */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>DATE</label>
                <div style={styles.inputWrapper}>
                  <Calendar size={15} color="var(--color-text-muted)" style={styles.inputIcon} />
                  <input 
                    type="date"
                    value={form.entry_date}
                    onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>DESCRIPTION / NOTE</label>
                <input 
                  type="text"
                  placeholder="e.g. Returned part, Emergency loan"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="primary-btn" 
                style={{
                  ...styles.submitBtn,
                  ...(submitting ? styles.submitBtnLoading : {})
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                    {activeModal === 'create' ? 'Logging loan...' : 'Saving changes...'}
                  </>
                ) : (
                  activeModal === 'create' ? 'Record Entry' : 'Save Changes'
                )}
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
  tabActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    marginBottom: '10px',
    gap: '12px',
  },
  tabGroup: {
    flex: 1,
    display: 'flex',
    background: 'rgba(30, 61, 55, 0.05)',
    borderRadius: '20px',
    padding: '3px',
    gap: '3px',
    border: '1px solid rgba(30, 61, 55, 0.08)',
  },
  tabButton: {
    flex: 1,
    border: 'none',
    borderRadius: '16px',
    padding: '8px 4px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  addBtn: {
    height: '34px',
    padding: '0 14px',
    borderRadius: '18px',
    border: 'none',
    background: '#112d27',
    color: '#ffffff',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(17, 45, 39, 0.2)',
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
  personName: {
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
  descriptionText: {
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
    gap: '8px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  submitBtnLoading: {
    background: '#0d9488',
    color: '#ffffff',
    cursor: 'not-allowed',
    opacity: 0.95,
  },
  infoText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    padding: '30px 0',
  }
};

export default Loans;
