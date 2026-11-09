import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import WalletBadge from '../components/WalletBadge';
import api from '../utils/api';
import { 
  Plus, X, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, 
  Landmark, Loader2, History, Edit3, ShieldAlert, CheckCircle2, ChevronRight,
  Archive, RefreshCw, BarChart2, PieChart, Info
} from 'lucide-react';

const Investments = () => {
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState('outgoing'); // 'outgoing' | 'incoming'
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'all' | 'liquidated'
  
  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'transaction' | 'valuation' | 'history'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityTransactions, setEntityTransactions] = useState([]);
  const [historyFilterTab, setHistoryFilterTab] = useState('all');
  const [loadingTx, setLoadingTx] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    direction: 'outgoing',
    entity_type: 'stock',
    initial_wallet_id: '',
    initial_amount: '',
    notes: ''
  });

  // Transaction Form State
  const [txForm, setTxForm] = useState({
    transaction_type: 'capital_inject',
    wallet: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Valuation Form State
  const [valForm, setValForm] = useState({
    new_valuation: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entRes, sumRes, walRes] = await Promise.all([
        api.get(`/api/v1/investments/?direction=${direction}&status=${statusFilter}`),
        api.get('/api/v1/investments/summary/'),
        api.get('/api/v1/wallets/')
      ]);
      setEntities(entRes.data);
      setSummary(sumRes.data);
      setWallets(walRes.data);

      if (walRes.data.length > 0) {
        setTxForm(prev => ({ ...prev, wallet: prev.wallet || walRes.data[0].id }));
        setCreateForm(prev => ({ ...prev, initial_wallet_id: prev.initial_wallet_id || walRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [direction, statusFilter]);

  // Prevent background scroll when modal is open
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

  const openCreateModal = () => {
    setFormError('');
    setCreateForm({
      name: '',
      direction: direction,
      entity_type: direction === 'outgoing' ? 'stock' : 'investor_equity',
      initial_wallet_id: wallets[0]?.id || '',
      initial_amount: '',
      notes: ''
    });
    setActiveModal('create');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    try {
      setSubmitting(true);
      const payload = {
        name: createForm.name,
        direction: createForm.direction,
        entity_type: createForm.entity_type,
        metadata: { notes: createForm.notes }
      };

      if (createForm.initial_amount && parseInt(createForm.initial_amount, 10) > 0) {
        payload.initial_amount = parseInt(createForm.initial_amount, 10);
        payload.initial_wallet_id = parseInt(createForm.initial_wallet_id, 10);
      }

      await api.post('/api/v1/investments/', payload);
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create investment asset.');
    } finally {
      setSubmitting(false);
    }
  };

  const openTxModal = (entity, defaultType = 'capital_inject') => {
    setSelectedEntity(entity);
    setFormError('');
    setTxForm({
      transaction_type: defaultType,
      wallet: wallets[0]?.id || '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setActiveModal('transaction');
  };

  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !selectedEntity) return;
    setFormError('');

    try {
      setSubmitting(true);
      const payload = {
        wallet: parseInt(txForm.wallet, 10),
        transaction_type: txForm.transaction_type,
        amount: parseInt(txForm.amount, 10),
        transaction_date: txForm.transaction_date,
        notes: txForm.notes
      };

      await api.post(`/api/v1/investments/${selectedEntity.id}/transactions/`, payload);
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Transaction failed. Please check available wallet balance.');
    } finally {
      setSubmitting(false);
    }
  };

  const openValuationModal = (entity) => {
    setSelectedEntity(entity);
    setFormError('');
    setValForm({
      new_valuation: entity.current_valuation || entity.total_capital_invested,
      notes: ''
    });
    setActiveModal('valuation');
  };

  const handleValuationSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !selectedEntity) return;
    setFormError('');

    try {
      setSubmitting(true);
      await api.post(`/api/v1/investments/${selectedEntity.id}/update-valuation/`, {
        new_valuation: parseInt(valForm.new_valuation, 10),
        notes: valForm.notes
      });
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update valuation.');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (entity) => {
    setSelectedEntity(entity);
    setActiveModal('history');
    setHistoryFilterTab('all');
    setLoadingTx(true);
    try {
      const res = await api.get(`/api/v1/investments/${entity.id}/transactions/`);
      setEntityTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleArchive = async (entity) => {
    if (!window.confirm(`Are you sure you want to archive '${entity.name}'? Existing financial history will be preserved.`)) return;
    try {
      await api.post(`/api/v1/investments/${entity.id}/archive/`);
      fetchData();
    } catch (err) {
      alert('Failed to archive.');
    }
  };

  const getEntityTypeLabel = (type) => {
    const map = {
      stock: 'Stock / Shares',
      mutual_fund: 'Mutual Fund',
      fixed_deposit: 'Fixed Deposit / DPS',
      crypto: 'Cryptocurrency',
      gold: 'Gold / Precious Metal',
      real_estate: 'Real Estate / Land',
      own_business_batch: 'Own Business: Inventory Batch',
      own_business_running: 'Own Business: Working Capital',
      investor_equity: 'Investor Equity',
      other: 'Other'
    };
    return map[type] || type;
  };

  const getTxTypeBadge = (type) => {
    switch (type) {
      case 'capital_inject':
        return { label: 'Capital Injected / Buy', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'capital_withdraw':
        return { label: 'Capital Recovered / Buyback', bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'profit_received':
        return { label: 'Profit / Dividend Received', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'profit_paid':
        return { label: 'Profit Paid Out to Investor', bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      default:
        return { label: type, bg: 'rgba(148, 163, 184, 0.1)', color: '#64748b' };
    }
  };

  const historyTabs = selectedEntity?.direction === 'incoming'
    ? [
        { key: 'all', label: 'All' },
        { key: 'capital_inject', label: 'Capital In' },
        { key: 'capital_withdraw', label: 'Buyback' },
        { key: 'profit_paid', label: 'Profit Paid' },
      ]
    : [
        { key: 'all', label: 'All' },
        { key: 'capital_inject', label: 'Capital Add' },
        { key: 'capital_withdraw', label: 'Recovery / Sell' },
        { key: 'profit_received', label: 'Profit' },
      ];

  const filteredTransactions = entityTransactions.filter((tx) => {
    if (historyFilterTab === 'all') return true;
    return tx.transaction_type === historyFilterTab;
  });

  const filteredTotalAmount = filteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  return (
    <MobileLayout title="Investments & Assets">
      {/* Top Hero Summary Metric Card */}
      <div className="glass-card" style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div>
            <span style={styles.heroLabel}>NET INVESTMENT EQUITY</span>
            <h1 style={styles.heroAmount}>
              Tk. <span className="monospace-number">{(summary?.net_investment_equity || 0).toLocaleString()}</span>
            </h1>
          </div>
          <div style={styles.heroIconBox}>
            <TrendingUp size={22} color="#ffffff" />
          </div>
        </div>

        {/* Breakdown Metric Sub-Grid */}
        <div style={styles.heroGrid}>
          <div style={styles.heroCol}>
            <span style={styles.miniLabel}>PORTFOLIO ASSETS</span>
            <span style={styles.miniVal}>
              Tk. <span className="monospace-number">{(summary?.outgoing?.current_portfolio_value || 0).toLocaleString()}</span>
            </span>
          </div>
          <div style={styles.heroCol}>
            <span style={styles.miniLabel}>REALIZED PROFIT</span>
            <span style={{ ...styles.miniVal, color: '#34d399' }}>
              +Tk. <span className="monospace-number">{(summary?.outgoing?.total_realized_profit || 0).toLocaleString()}</span>
            </span>
          </div>
          <div style={styles.heroCol}>
            <span style={styles.miniLabel}>INVESTOR CAPITAL HELD</span>
            <span style={{ ...styles.miniVal, color: '#fca5a5' }}>
              Tk. <span className="monospace-number">{(summary?.incoming?.total_investors_capital_held || 0).toLocaleString()}</span>
            </span>
          </div>
          <div style={styles.heroCol}>
            <span style={styles.miniLabel}>ALL-TIME ROI</span>
            <span style={{ ...styles.miniVal, color: (summary?.outgoing?.roi_percentage || 0) >= 0 ? '#34d399' : '#f87171' }}>
              {(summary?.outgoing?.roi_percentage || 0) >= 0 ? '+' : ''}{summary?.outgoing?.roi_percentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Direction Switcher Tabs */}
      <div style={styles.segmentContainer}>
        <button
          onClick={() => setDirection('outgoing')}
          style={{
            ...styles.segmentBtn,
            background: direction === 'outgoing' ? 'var(--color-primary)' : 'transparent',
            color: direction === 'outgoing' ? '#ffffff' : 'var(--color-text-secondary)'
          }}
        >
          💼 My Assets & Portfolio
        </button>
        <button
          onClick={() => setDirection('incoming')}
          style={{
            ...styles.segmentBtn,
            background: direction === 'incoming' ? 'var(--color-primary)' : 'transparent',
            color: direction === 'incoming' ? '#ffffff' : 'var(--color-text-secondary)'
          }}
        >
          🤝 Business Investors
        </button>
      </div>

      {/* Sub-Header Bar (Filters + New Button) */}
      <div style={styles.actionHeader}>
        <div style={styles.filterGroup}>
          <button 
            onClick={() => setStatusFilter('active')} 
            style={{ ...styles.pillBtn, ...(statusFilter === 'active' ? styles.pillActive : {}) }}
          >
            Active
          </button>
          <button 
            onClick={() => setStatusFilter('all')} 
            style={{ ...styles.pillBtn, ...(statusFilter === 'all' ? styles.pillActive : {}) }}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter('liquidated')} 
            style={{ ...styles.pillBtn, ...(statusFilter === 'liquidated' ? styles.pillActive : {}) }}
          >
            Closed
          </button>
        </div>

        <button onClick={openCreateModal} style={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '4px' }} />
          {direction === 'outgoing' ? 'New Asset' : 'Add Investor'}
        </button>
      </div>

      {/* Entities List */}
      <div style={styles.listContainer}>
        {loading ? (
          <div style={styles.centerLoading}>
            <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading investments...</p>
          </div>
        ) : entities.length === 0 ? (
          <div className="glass-card" style={styles.emptyState}>
            <Landmark size={36} color="var(--color-text-muted)" />
            <h4 style={{ margin: '8px 0 4px', fontSize: '15px' }}>
              {direction === 'outgoing' ? 'No Investment Assets Found' : 'No Business Investors Found'}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '280px' }}>
              {direction === 'outgoing'
                ? 'Track your stocks, mutual funds, gold, fixed deposits, or business batch inventory in one safe place.'
                : 'Track capital accepted from angel investors, profit distributions, and equity buybacks.'}
            </p>
            <button onClick={openCreateModal} className="primary-btn" style={{ marginTop: '14px', fontSize: '13px' }}>
              <Plus size={15} style={{ marginRight: '6px' }} />
              {direction === 'outgoing' ? 'Add Your First Asset' : 'Record Investor Capital'}
            </button>
          </div>
        ) : (
          entities.map((item) => {
            const isBatch = item.entity_type === 'own_business_batch';
            const recoveryRatio = item.total_capital_invested > 0 
              ? Math.min(100, Math.round(((item.total_capital_invested - item.current_valuation) / item.total_capital_invested) * 100))
              : 100;

            return (
              <div key={item.id} className="glass-card" style={styles.itemCard}>
                <div style={styles.itemHeader}>
                  <div>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <span style={styles.itemType}>{getEntityTypeLabel(item.entity_type)}</span>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: item.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    color: item.status === 'active' ? '#10b981' : '#64748b'
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </div>

                {/* Key Numbers Grid */}
                <div style={styles.statsGrid}>
                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      {direction === 'outgoing' ? 'CAPITAL INVESTED' : 'CAPITAL HELD'}
                    </span>
                    <span style={styles.statVal}>
                      Tk. <span className="monospace-number">{item.total_capital_invested.toLocaleString()}</span>
                    </span>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      {direction === 'outgoing' ? 'CURRENT VALUATION' : 'STATUS'}
                    </span>
                    <span style={{ ...styles.statVal, color: 'var(--color-primary)' }}>
                      {direction === 'outgoing' ? (
                        <>Tk. <span className="monospace-number">{item.current_valuation.toLocaleString()}</span></>
                      ) : (
                        item.status.toUpperCase()
                      )}
                    </span>
                  </div>

                  <div style={styles.statBox}>
                    <span style={styles.statLabel}>
                      {direction === 'outgoing' ? 'REALIZED PROFIT' : 'PROFIT PAID OUT'}
                    </span>
                    <span style={{ ...styles.statVal, color: direction === 'outgoing' ? '#10b981' : '#ef4444' }}>
                      Tk. <span className="monospace-number">{item.total_profit_realized.toLocaleString()}</span>
                    </span>
                  </div>

                  {direction === 'outgoing' && (
                    <div style={styles.statBox}>
                      <span style={styles.statLabel}>UNREALIZED GAIN</span>
                      <span style={{ ...styles.statVal, color: item.unrealized_gain >= 0 ? '#10b981' : '#ef4444' }}>
                        {item.unrealized_gain >= 0 ? '+' : ''}Tk. <span className="monospace-number">{item.unrealized_gain.toLocaleString()}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Cash-to-Cash Batch Cost Recovery Progress Bar (if applicable) */}
                {isBatch && (
                  <div style={styles.progressContainer}>
                    <div style={styles.progressHeader}>
                      <span style={styles.progressLabel}>Batch Cost Recovery Progress</span>
                      <span style={styles.progressPercent}>{recoveryRatio}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: `${recoveryRatio}%` }} />
                    </div>
                  </div>
                )}

                {/* Card Quick Actions Bar */}
                <div style={styles.itemActions}>
                  <button 
                    onClick={() => openTxModal(item, 'capital_inject')} 
                    style={{ ...styles.actionPill, background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}
                    title={direction === 'outgoing' ? 'Buy / Add Capital' : 'Receive Capital'}
                  >
                    <Plus size={13} style={{ marginRight: '3px' }} />
                    {direction === 'outgoing' ? 'Add Capital' : 'Receive'}
                  </button>

                  <button 
                    onClick={() => openTxModal(item, 'capital_withdraw')} 
                    style={{ ...styles.actionPill, background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}
                    title={direction === 'outgoing' ? 'Recover Capital / Sell' : 'Buyback Capital'}
                  >
                    <ArrowDownLeft size={13} style={{ marginRight: '3px' }} />
                    {direction === 'outgoing' ? 'Recover/Sell' : 'Buyback'}
                  </button>

                  <button 
                    onClick={() => openTxModal(item, direction === 'outgoing' ? 'profit_received' : 'profit_paid')} 
                    style={{ ...styles.actionPill, background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}
                    title={direction === 'outgoing' ? 'Log Dividend / Profit' : 'Pay Profit to Investor'}
                  >
                    <DollarSign size={13} style={{ marginRight: '3px' }} />
                    {direction === 'outgoing' ? 'Log Profit' : 'Pay Profit'}
                  </button>

                  {direction === 'outgoing' && (
                    <button 
                      onClick={() => openValuationModal(item)} 
                      style={{ ...styles.actionPill, background: 'rgba(168, 85, 247, 0.08)', color: '#a855f7' }}
                      title="Update Market Valuation"
                    >
                      <Edit3 size={13} style={{ marginRight: '3px' }} />
                      Valuation
                    </button>
                  )}

                  <button 
                    onClick={() => openHistoryModal(item)} 
                    style={{ ...styles.actionPill, background: 'var(--bg-app)', color: 'var(--color-text-secondary)' }}
                    title="Transaction History"
                  >
                    <History size={13} />
                  </button>

                  {item.status === 'active' && (
                    <button 
                      onClick={() => handleArchive(item)} 
                      style={{ ...styles.actionPill, background: 'transparent', color: 'var(--color-text-muted)' }}
                      title="Archive"
                    >
                      <Archive size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. CREATE MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'create' && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {createForm.direction === 'outgoing' ? 'New Investment Asset' : 'Add Business Investor'}
              </h3>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={15} style={{ marginRight: '6px', flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={styles.modalForm}>
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>
                  {createForm.direction === 'outgoing' ? 'Asset Name' : 'Investor / Partner Name'}
                </label>
                <input
                  type="text"
                  placeholder={createForm.direction === 'outgoing' ? 'e.g. BRAC Bank Stock, Eid Batch 2026' : 'e.g. Investor Rahim'}
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Asset Type / Category</label>
                <select
                  value={createForm.entity_type}
                  onChange={(e) => setCreateForm({ ...createForm, entity_type: e.target.value })}
                  className="input-field"
                >
                  {createForm.direction === 'outgoing' ? (
                    <>
                      <option value="stock">Stock / Share Market</option>
                      <option value="mutual_fund">Mutual Fund</option>
                      <option value="fixed_deposit">Fixed Deposit / DPS</option>
                      <option value="gold">Gold / Precious Metals</option>
                      <option value="crypto">Cryptocurrency</option>
                      <option value="own_business_batch">Own Business: Inventory / Batch</option>
                      <option value="own_business_running">Own Business: Working Capital</option>
                      <option value="real_estate">Real Estate / Land</option>
                      <option value="other">Other Asset</option>
                    </>
                  ) : (
                    <>
                      <option value="investor_equity">Investor Equity / Partner</option>
                      <option value="own_business_running">Business Debt / Loan Partner</option>
                      <option value="other">Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Optional Initial Funding */}
              <div style={styles.fundingDivider}>
                <span style={styles.fundingDividerText}>INITIAL CAPITAL FUNDING (OPTIONAL)</span>
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>
                  {createForm.direction === 'outgoing' ? 'Source Wallet (Funds Deducted)' : 'Deposit Wallet (Funds Added)'}
                </label>
                <select
                  value={createForm.initial_wallet_id}
                  onChange={(e) => setCreateForm({ ...createForm, initial_wallet_id: e.target.value })}
                  className="input-field"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wallet_name} (Bal: ৳{w.wallet_status?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Initial Amount (Tk.)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000 (leave blank to start with 0)"
                  value={createForm.initial_amount}
                  onChange={(e) => setCreateForm({ ...createForm, initial_amount: e.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Notes / Terms (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 15% profit split, 1-year maturity"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={submitting} style={styles.submitBtn}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Investment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRANSACTION MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'transaction' && selectedEntity && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Record Transaction</h3>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                  {selectedEntity.name} ({getEntityTypeLabel(selectedEntity.entity_type)})
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={15} style={{ marginRight: '6px', flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleTxSubmit} style={styles.modalForm}>
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Transaction Action</label>
                <select
                  value={txForm.transaction_type}
                  onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                  className="input-field"
                >
                  {selectedEntity.direction === 'outgoing' ? (
                    <>
                      <option value="capital_inject">➕ Add Capital / Buy (Deducts from Wallet)</option>
                      <option value="capital_withdraw">🔄 Recover Capital / Sell (Adds to Wallet)</option>
                      <option value="profit_received">💰 Log Profit / Dividend (Adds to Wallet)</option>
                    </>
                  ) : (
                    <>
                      <option value="capital_inject">➕ Receive Capital (Adds to Wallet)</option>
                      <option value="profit_paid">💰 Pay Profit to Investor (Deducts from Wallet)</option>
                      <option value="capital_withdraw">🔄 Capital Buyback (Deducts from Wallet)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Associated Wallet</label>
                <select
                  value={txForm.wallet}
                  onChange={(e) => setTxForm({ ...txForm, wallet: e.target.value })}
                  className="input-field"
                  required
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wallet_name} (Current: ৳{w.wallet_status?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Amount (Tk.)</label>
                <input
                  type="number"
                  placeholder="e.g. 10000"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="input-field"
                  required
                  min="1"
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={txForm.transaction_date}
                  onChange={(e) => setTxForm({ ...txForm, transaction_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dividend split for Q3, Batch sales payment"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={submitting} style={styles.submitBtn}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VALUATION MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'valuation' && selectedEntity && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Update Market Valuation</h3>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                  {selectedEntity.name} (Non-cash market adjustment)
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={15} style={{ marginRight: '6px', flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleValuationSubmit} style={styles.modalForm}>
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Current Recorded Valuation</label>
                <input
                  type="text"
                  value={`৳ ${selectedEntity.current_valuation?.toLocaleString()}`}
                  className="input-field"
                  disabled
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>New Fair Market Valuation (Tk.)</label>
                <input
                  type="number"
                  placeholder="e.g. 125000"
                  value={valForm.new_valuation}
                  onChange={(e) => setValForm({ ...valForm, new_valuation: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  * This updates paper value & Net Worth. It does NOT move money out of any wallet.
                </span>
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Valuation Reason / Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Gold market rate update, Q4 portfolio statement"
                  value={valForm.notes}
                  onChange={(e) => setValForm({ ...valForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="primary-btn" disabled={submitting} style={styles.submitBtn}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Valuation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TRANSACTION HISTORY MODAL */}
      {/* ========================================================================= */}
      {activeModal === 'history' && selectedEntity && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={{ ...styles.modalBox, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Transaction History</h3>
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                  {selectedEntity.name}
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs Bar (All, Capital Add, Recovery/Sell, Profit) */}
            <div style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '10px',
              borderBottom: '1px solid var(--border-color)',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
              {historyTabs.map((tab) => {
                const isActive = historyFilterTab === tab.key;
                const count = tab.key === 'all'
                  ? entityTransactions.length
                  : entityTransactions.filter((tx) => tx.transaction_type === tab.key).length;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setHistoryFilterTab(tab.key)}
                    style={{
                      ...styles.pillBtn,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap',
                      padding: '5px 10px',
                      fontSize: '11px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      ...(isActive ? styles.pillActive : {})
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      opacity: isActive ? 1 : 0.75,
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-app)',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      border: isActive ? 'none' : '1px solid var(--border-color)'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-summary stats banner */}
            {!loadingTx && entityTransactions.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 12px',
                background: 'rgba(13, 148, 136, 0.06)',
                borderRadius: '10px',
                marginBottom: '10px',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                border: '1px solid rgba(13, 148, 136, 0.15)'
              }}>
                <span>
                  Showing {filteredTransactions.length} of {entityTransactions.length} record{entityTransactions.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>
                  Total: Tk. <span className="monospace-number">{filteredTotalAmount.toLocaleString()}</span>
                </span>
              </div>
            )}

            {/* Scrollable Transaction Records List */}
            <div style={{ overflowY: 'auto', maxHeight: '55vh', padding: '2px 0' }}>
              {loadingTx ? (
                <div style={styles.centerLoading}>
                  <Loader2 size={20} className="animate-spin" color="var(--color-primary)" />
                </div>
              ) : entityTransactions.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', padding: '24px 0' }}>
                  No transactions recorded yet.
                </p>
              ) : filteredTransactions.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', padding: '24px 0' }}>
                  No transactions in this category.
                </p>
              ) : (
                filteredTransactions.map((tx) => {
                  const badge = getTxTypeBadge(tx.transaction_type);
                  return (
                    <div key={tx.id} style={styles.historyRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ ...styles.badgePill, background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        </div>
                        {tx.notes && <p style={styles.historyNotes}>{tx.notes}</p>}
                        <div style={styles.historyMeta}>
                          <span>{tx.wallet_detail?.wallet_name || 'Wallet'}</span>
                          <span>•</span>
                          <span>{tx.transaction_date}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <h4 style={styles.historyAmount}>
                          Tk. <span className="monospace-number">{tx.amount.toLocaleString()}</span>
                        </h4>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  heroCard: {
    padding: '20px',
    background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
    color: '#ffffff',
    borderRadius: '16px',
    marginBottom: '16px',
    boxShadow: '0 8px 20px rgba(13, 148, 136, 0.25)',
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  heroLabel: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#ffffff',
    margin: '4px 0 0',
  },
  heroIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    paddingTop: '12px',
  },
  heroCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  miniLabel: {
    fontSize: '9.5px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: '0.4px',
  },
  miniVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
  },
  segmentContainer: {
    display: 'flex',
    background: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '14px',
    border: '1px solid var(--border-color)',
    gap: '4px',
  },
  segmentBtn: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '8px',
  },
  filterGroup: {
    display: 'flex',
    gap: '6px',
  },
  pillBtn: {
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  pillActive: {
    background: 'var(--color-primary)',
    color: '#ffffff',
    borderColor: 'var(--color-primary)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--color-primary)',
    color: '#ffffff',
    padding: '7px 12px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingBottom: '20px',
  },
  itemCard: {
    padding: '16px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '700',
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  itemType: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
    display: 'block',
  },
  statusBadge: {
    fontSize: '9.5px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    background: 'var(--bg-app)',
    borderRadius: '10px',
    padding: '10px',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statLabel: {
    fontSize: '9px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.3px',
  },
  statVal: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10.5px',
  },
  progressLabel: {
    color: 'var(--color-text-muted)',
    fontWeight: '600',
  },
  progressPercent: {
    color: 'var(--color-primary)',
    fontWeight: '700',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'var(--border-color)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    background: 'var(--color-primary)',
    transition: 'width 0.3s ease',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '10px',
  },
  actionPill: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 9px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  emptyState: {
    padding: '36px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '14px',
  },
  centerLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 2000,
  },
  modalBox: {
    width: '100%',
    maxWidth: '460px',
    background: 'var(--bg-card)',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    animation: 'slideUp 0.25s ease-out',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    padding: '4px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
  },
  fundingDivider: {
    margin: '4px 0',
    borderBottom: '1px dashed var(--border-color)',
    position: 'relative',
    textAlign: 'center',
  },
  fundingDividerText: {
    background: 'var(--bg-card)',
    padding: '0 8px',
    fontSize: '9.5px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    letterSpacing: '0.5px',
    position: 'relative',
    top: '7px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    fontWeight: '600',
  },
  historyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-color)',
  },
  badgePill: {
    fontSize: '9.5px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  historyNotes: {
    fontSize: '11px',
    color: 'var(--color-text-primary)',
    margin: '3px 0 2px',
  },
  historyMeta: {
    display: 'flex',
    gap: '4px',
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  historyAmount: {
    fontSize: '13px',
    fontWeight: '700',
    margin: 0,
    color: 'var(--color-text-primary)',
  },
};

export default Investments;
