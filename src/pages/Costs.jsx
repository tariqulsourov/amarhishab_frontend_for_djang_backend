import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import WalletBadge from '../components/WalletBadge';
import api from '../utils/api';
import { Search, Plus, Trash2, Edit2, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Costs = () => {
  const [costs, setCosts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activePlannedId, setActivePlannedId] = useState(null);

  // Form State
  const [form, setForm] = useState({ amount: '', wallet: '', category: '', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchMetadata = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        api.get('/api/v1/wallets/'),
        api.get('/api/v1/costs/categories/')
      ]);
      setWallets(wRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Metadata load error', err);
    }
  };

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const params = selectedWallet ? { wallet: selectedWallet } : {};
      const response = await api.get('/api/v1/costs/', { params });
      setCosts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const location = useLocation();

  useEffect(() => {
    fetchMetadata();
    fetchCosts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plannedId = params.get('plannedId');
    if (location.state?.openAddModal || params.get('openAddModal') === 'true') {
      setShowAddModal(true);
      window.history.replaceState({}, document.title, location.pathname);
    } else if (plannedId) {
      setActivePlannedId(plannedId);
      api.get(`/api/v1/scheduled-transactions/${plannedId}/`)
        .then(res => {
          const data = res.data;
          setForm({
            amount: data.amount,
            wallet: data.wallet,
            category: data.cost_category,
            description: data.description || '',
            date: data.scheduled_date
          });
          setShowAddModal(true);
          window.history.replaceState({}, document.title, location.pathname);
        })
        .catch(err => {
          console.error('Failed to load planned transaction details:', err);
        });
    }
  }, [location]);

  const parseBackendError = (err, defaultMsg) => {
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === 'object') {
        const messages = [];
        for (const [key, value] of Object.entries(data)) {
          const fieldName = key.replace('_', ' ').replace(' id', '');
          const fieldNameCapitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          if (Array.isArray(value)) {
            messages.push(`${fieldNameCapitalized}: ${value.join(', ')}`);
          } else if (typeof value === 'string') {
            messages.push(`${fieldNameCapitalized}: ${value}`);
          }
        }
        if (messages.length > 0) return messages.join('\n');
      }
    }
    return err.response?.data?.error || defaultMsg;
  };

  const validateForm = () => {
    if (!form.category) {
      alert('Please select a category sector.');
      return false;
    }
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return false;
    }
    if (!form.wallet) {
      alert('Please select a wallet.');
      return false;
    }
    if (!form.date) {
      alert('Please select a date.');
      return false;
    }
    return true;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (activePlannedId) {
        // 1. Update the planned transaction first to reflect any edits during review
        await api.put(`/api/v1/scheduled-transactions/${activePlannedId}/`, {
          transaction_type: 'cost',
          amount: parseInt(form.amount, 10),
          wallet: form.wallet,
          cost_category: form.category,
          description: form.description,
          scheduled_date: form.date
        });
        // 2. Approve it to execute standard cost log and balance change
        await api.post(`/api/v1/scheduled-transactions/${activePlannedId}/approve/`);
      } else {
        await api.post('/api/v1/costs/', {
          amount: form.amount,
          wallet: form.wallet,
          cost_related_id: form.category,
          description: form.description,
          cost_date: form.date || new Date().toISOString().split('T')[0]
        });
      }
      setShowAddModal(false);
      resetForm();
      fetchCosts();
    } catch (err) {
      alert(parseBackendError(err, 'Failed to create expense entry.'));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await api.put(`/api/v1/costs/${editingItem.id}/`, {
        amount: form.amount,
        wallet: form.wallet,
        cost_related_id: form.category,
        description: form.description,
        cost_date: form.date
      });
      setEditingItem(null);
      resetForm();
      fetchCosts();
    } catch (err) {
      alert(parseBackendError(err, 'Failed to update expense.'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/v1/costs/${id}/`);
      fetchCosts();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      amount: item.amount,
      wallet: item.wallet,
      category: item.cost_related_id,
      description: item.description,
      date: item.cost_date
    });
  };

  const resetForm = () => {
    setForm({ amount: '', wallet: wallets[0]?.id || '', category: '', description: '', date: new Date().toISOString().split('T')[0] });
    setActivePlannedId(null);
  };

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const filteredCosts = costs.filter(item => {
    if (selectedMonth) {
      const itemMonth = item.cost_date?.substring(0, 7);
      if (itemMonth !== selectedMonth) return false;
    }
    if (selectedWallet && String(item.wallet) !== String(selectedWallet)) {
      return false;
    }
    if (fromDate && item.cost_date < fromDate) return false;
    if (toDate && item.cost_date > toDate) return false;
    if (searchQuery) {
      const text = (item.description + ' ' + (item.cost_related_detail?.short_info || '')).toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const totalSum = filteredCosts.reduce((sum, item) => sum + item.amount, 0);

  const getCategoryEmoji = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('servant') || n.includes('rent') || n.includes('home')) return '🏠';
    if (n.includes('bazar') || n.includes('grocery') || n.includes('food') || n.includes('bazaar')) return '🛒';
    if (n.includes('transport') || n.includes('car') || n.includes('bike') || n.includes('rickshaw')) return '🚗';
    if (n.includes('bill') || n.includes('utility') || n.includes('electricity') || n.includes('internet')) return '💡';
    if (n.includes('salary') || n.includes('business') || n.includes('freelance') || n.includes('work')) return '💼';
    if (n.includes('medical') || n.includes('health') || n.includes('doctor') || n.includes('medicine')) return '🏥';
    if (n.includes('education') || n.includes('book') || n.includes('school')) return '📚';
    if (n.includes('saving') || n.includes('invest')) return '💰';
    if (n.includes('fun') || n.includes('ent') || n.includes('movie')) return '🎬';
    return '📁';
  };

  const getRecentDatesList = () => {
    const dates = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Yesterday';
      else {
        label = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
      }
      dates.push({ iso, label });
    }
    return dates;
  };

  const getSuggestedAmounts = () => {
    if (!form.category) return [100, 500, 1000];
    const matches = costs.filter(item => String(item.cost_related_id) === String(form.category));
    if (matches.length === 0) return [100, 500, 1000];
    const freq = {};
    matches.forEach(item => {
      freq[item.amount] = (freq[item.amount] || 0) + 1;
    });
    const sorted = Object.entries(freq)
      .map(([val, count]) => ({ val: parseInt(val), count }))
      .sort((a, b) => b.count - a.count);
    const suggested = sorted.map(item => item.val).slice(0, 3);
    const fallbacks = [100, 500, 1000];
    while (suggested.length < 3) {
      const nextFallback = fallbacks.find(f => !suggested.includes(f));
      if (nextFallback !== undefined) {
        suggested.push(nextFallback);
      } else {
        suggested.push(100);
      }
    }
    return suggested;
  };

  const autoSelectWallet = (catId, amt, currentCosts) => {
    if (!catId) return;
    let match = currentCosts.find(item => 
      String(item.cost_related_id) === String(catId) && 
      parseInt(item.amount) === parseInt(amt)
    );
    if (!match) {
      match = currentCosts.find(item => String(item.cost_related_id) === String(catId));
    }
    if (match && match.wallet) {
      setForm(prev => ({ ...prev, wallet: match.wallet }));
    }
  };

  const getPieChartData = () => {
    const groups = {};
    filteredCosts.forEach(item => {
      const cat = item.cost_related_detail?.short_info || 'Other';
      groups[cat] = (groups[cat] || 0) + item.amount;
    });
    
    const sorted = Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    if (sorted.length <= 5) return sorted;
    const top5 = sorted.slice(0, 4);
    const otherVal = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
    top5.push({ name: 'Other', value: otherVal });
    return top5;
  };

  const renderPieChartSVG = () => {
    const chartData = getPieChartData();
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
      return (
        <svg width="72" height="72" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.15)" />
        </svg>
      );
    }
    
    const colors = ['#2dd4bf', '#fb7185', '#facc15', '#60a5fa', '#c084fc'];
    let accumulatedAngle = 0;
    
    return (
      <svg width="72" height="72" viewBox="0 0 100 100">
        {chartData.map((item, idx) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          
          const r = 40;
          const cx = 50;
          const cy = 50;
          
          const startAngleRad = (accumulatedAngle - 90) * Math.PI / 180;
          const endAngleRad = (accumulatedAngle + angle - 90) * Math.PI / 180;
          
          const x1 = cx + r * Math.cos(startAngleRad);
          const y1 = cy + r * Math.sin(startAngleRad);
          const x2 = cx + r * Math.cos(endAngleRad);
          const y2 = cy + r * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const d = `
            M ${cx} ${cy}
            L ${x1} ${y1}
            A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
            Z
          `;
          
          accumulatedAngle += angle;
          const sliceColor = colors[idx % colors.length];
          
          return (
            <path 
              key={idx} 
              d={d} 
              fill={sliceColor} 
              stroke="#1e3d37" 
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <MobileLayout title="Amar Hishab">
      {/* Top Header Card (Teal background) */}
      <div className="glass-card" style={styles.topHeaderCard}>
        <div style={styles.headerLeftContainer}>
          <div style={styles.metricRow}>
            <span style={styles.metricLabel}>Total Cost</span>
            <h4 style={styles.metricValue}>
              Tk. {totalSum.toLocaleString()}
            </h4>
          </div>

          {/* Side-by-side mini selectors */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="input-field"
              style={styles.headerSelect}
            >
              <option value="">All Wallets</option>
              {wallets.map(w => <option key={w.id} value={w.id}>{w.wallet_name}</option>)}
            </select>

            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
              style={styles.headerMonthInput}
            />
          </div>
        </div>

        {/* Pie Chart Display & Compact Legend */}
        <div style={styles.headerRightContainer}>
          {renderPieChartSVG()}
          <div style={styles.legendContainer}>
            {getPieChartData().slice(0, 3).map((item, idx) => {
              const colors = ['#2dd4bf', '#fb7185', '#facc15', '#60a5fa', '#c084fc'];
              const percent = totalSum > 0 ? Math.round((item.value / totalSum) * 100) : 0;
              return (
                <div key={idx} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: colors[idx % colors.length] }} />
                  <span style={styles.legendText}>
                    {item.name} ({percent}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compact Controls Row (Search, Filters toggle, Add button) */}
      <div style={styles.compactControlsRow}>
        <div style={styles.searchWrapper}>
          <Search size={16} color="var(--color-text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={styles.searchFieldInput}
          />
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          style={{
            ...styles.filterToggleBtn,
            background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)',
            color: showFilters ? '#ffffff' : 'var(--color-text-primary)'
          }}
          title="Toggle Filters"
        >
          <Filter size={16} />
        </button>

        <button 
          onClick={() => { resetForm(); setShowAddModal(true); }}
          style={styles.compactAddBtn}
          title="Add New Cost"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Expanded Date Range Filters (Rendered only when toggled) */}
      {showFilters && (
        <div className="glass-card animate-slide-up" style={styles.expandedFiltersCard}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={styles.compactLabel}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-field"
                style={styles.compactDatePicker}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.compactLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-field"
                style={styles.compactDatePicker}
              />
            </div>
          </div>

          {(searchQuery || selectedWallet || fromDate || toDate) && (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedWallet(''); setFromDate(''); setToDate(''); }}
              style={styles.resetFiltersBtn}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Cost Summary Header Bar */}
      <h3 style={styles.summaryTitle}>Cost Summary</h3>
      
      <div style={styles.tableHeader}>
        <span style={styles.tableHeaderLeft}>Total ({selectedMonth})</span>
        <span style={styles.tableHeaderRight}>Tk. <span className="monospace-number">{totalSum.toLocaleString()}</span></span>
      </div>

      {/* Cost List Entries */}
      <div style={styles.listContainer}>
        {loading ? (
          <p style={styles.infoText}>Loading expenses...</p>
        ) : filteredCosts.length === 0 ? (
          <p style={styles.infoText}>No cost entries found.</p>
        ) : (
          filteredCosts.map((item) => (
            <div key={item.id} className="glass-card" style={styles.card}>
              <div style={styles.cardLeft}>
                <div style={styles.badge}>
                  {item.cost_related_detail?.short_info || 'Other'}
                </div>
                <div style={styles.cardMeta}>
                  <h4 style={styles.itemTitle}>{item.description || 'Expense Entry'}</h4>
                  <div style={styles.subMeta}>
                    <WalletBadge 
                      walletName={item.wallet_detail?.wallet_name} 
                      walletId={item.wallet} 
                      allWallets={wallets} 
                    />
                    <span style={styles.dot}>•</span>
                    <span>{item.cost_date}</span>
                  </div>
                </div>
              </div>
              <div style={styles.cardRight}>
                <h3 style={styles.amount}>Tk. <span className="monospace-number">{item.amount.toLocaleString()}</span></h3>
                <div style={styles.actionGroup}>
                  <button onClick={() => startEdit(item)} style={styles.actionBtn}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ ...styles.actionBtn, color: 'var(--color-danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Month Navigation Arrow Controls */}
      <div style={styles.navArrowsContainer}>
        <button onClick={handlePrevMonth} style={styles.navArrowBtn}>
          ◀
        </button>
        <div style={styles.navDivider}>|</div>
        <button onClick={handleNextMonth} style={styles.navArrowBtn}>
          ▶
        </button>
      </div>

      {/* Add / Edit modal sliding panel */}
      {(showAddModal || editingItem) && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-slide-up" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>{editingItem ? 'Edit Expense' : 'Log New Expense'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingItem(null); }} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editingItem ? handleUpdate : handleCreate} style={styles.form}>
              {/* 1. Category */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <div style={styles.categoryChipsWrapper}>
                  {categories.length === 0 ? (
                    <div style={styles.noCategoryMsg}>
                      No cost category has been created. To create please{' '}
                      <span 
                        onClick={() => navigate('/categories')} 
                        style={styles.categoryLink}
                      >
                        click here
                      </span>.
                    </div>
                  ) : (
                    categories.map(c => {
                      const isSelected = String(form.category) === String(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, category: c.id });
                            autoSelectWallet(c.id, form.amount, costs);
                          }}
                          style={{
                            ...styles.chipButton,
                            background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                            color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                            borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                          }}
                        >
                          {getCategoryEmoji(c.short_info)} {c.short_info}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 2. Amount */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Amount (৳)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => {
                    setForm({ ...form, amount: e.target.value });
                    autoSelectWallet(form.category, e.target.value, costs);
                  }}
                  className="input-field"
                  required
                />
                
                {/* Suggestions Row */}
                <div style={styles.suggestionsContainer}>
                  <span style={styles.suggestionLabel}>Suggest:</span>
                  {getSuggestedAmounts().map((val, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, amount: val });
                        autoSelectWallet(form.category, val, costs);
                      }}
                      style={styles.suggestionPill}
                    >
                      Tk. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Wallet */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Select Wallet</label>
                <div style={styles.chipsWrapper}>
                  {wallets.map(w => {
                    const isSelected = String(form.wallet) === String(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setForm({ ...form, wallet: w.id })}
                        style={{
                          ...styles.chipButton,
                          background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                        }}
                      >
                        💳 {w.wallet_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Date */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {getRecentDatesList().map((item) => {
                    const isSelected = form.date === item.iso;
                    return (
                      <button
                        key={item.iso}
                        type="button"
                        onClick={() => setForm({ ...form, date: item.iso })}
                        style={{
                          ...styles.chipButton,
                          background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                          borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-color)',
                          padding: '6px 12px',
                          borderRadius: '16px',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-field"
                    style={{ width: '130px', height: '32px', padding: '4px 8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              {/* 5. Short Note */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Short Note</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly vegetable run"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>
                {editingItem ? 'Save Changes' : 'Log Expense'}
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
    padding: '16px',
    borderRadius: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#ffffff',
    gap: '12px',
  },
  headerLeftContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  headerRightContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  headerSelect: {
    flex: 1,
    padding: '6px 10px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '11px',
    outline: 'none',
    height: '32px',
    width: '100px',
  },
  headerMonthInput: {
    flex: 1,
    padding: '6px 10px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '11px',
    outline: 'none',
    height: '32px',
    width: '100px',
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '9px',
    textTransform: 'uppercase',
    color: '#a9c0be',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#f87171', // Bright soft red highlight
    fontFamily: 'var(--font-sans)',
    marginTop: '2px',
  },
  legendContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  legendDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  legendText: {
    fontSize: '8.5px',
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
  },
  compactControlsRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginTop: '12px',
    marginBottom: '8px',
    width: '100%',
  },
  searchWrapper: {
    position: 'relative',
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  searchFieldInput: {
    width: '100%',
    paddingLeft: '36px',
    height: '38px',
    fontSize: '13px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    boxSizing: 'border-box',
  },
  filterToggleBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    padding: 0,
  },
  compactAddBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--color-primary), #0d9488)',
    color: '#ffffff',
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
    boxSizing: 'border-box',
    padding: 0,
  },
  expandedFiltersCard: {
    padding: '14px',
    borderRadius: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '12px',
  },
  compactLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    marginBottom: '4px',
    display: 'block',
  },
  compactDatePicker: {
    height: '34px',
    padding: '6px 10px',
    fontSize: '12px',
    borderRadius: '10px',
    width: '100%',
  },
  resetFiltersBtn: {
    alignSelf: 'flex-end',
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  summaryTitle: {
    fontSize: '13px',
    fontWeight: '800',
    textAlign: 'center',
    color: 'var(--color-text-primary)',
    marginTop: '6px',
    marginBottom: '6px',
  },
  tableHeader: {
    background: '#1e3d37',
    padding: '12px 16px',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
  },
  tableHeaderLeft: {
    fontSize: '12px',
  },
  tableHeaderRight: {
    fontSize: '12px',
  },
  navArrowsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1e3d37',
    borderRadius: '20px',
    padding: '8px 16px',
    width: '120px',
    margin: '20px auto 10px auto',
    gap: '12px',
    boxShadow: '0 4px 12px rgba(30, 61, 55, 0.2)',
  },
  navArrowBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
  },
  navDivider: {
    color: '#a9c0be',
    fontSize: '14px',
    fontWeight: '300',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  infoText: {
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
    padding: '32px 0',
  },
  card: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  badge: {
    color: 'var(--color-danger)',
    fontSize: '11px',
    fontWeight: '700',
    width: 'fit-content',
    textTransform: 'uppercase',
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
  },
  subMeta: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dot: {
    color: 'var(--color-text-muted)',
  },
  cardRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  amount: {
    color: 'var(--color-danger)',
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: '700',
  },
  actionGroup: {
    display: 'flex',
    gap: '12px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
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
    padding: '24px 24px 80px 24px', // Extra bottom padding to sit comfortably above bottom navigation bar
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '90%',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  categoryChipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
    maxHeight: '85px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  chipsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '4px',
  },
  chipButton: {
    padding: '8px 12px',
    fontSize: '12px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  suggestionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '6px',
  },
  suggestionLabel: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
  },
  suggestionPill: {
    padding: '4px 10px',
    fontSize: '11px',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.15s ease',
  },
  noCategoryMsg: {
    color: 'var(--color-danger)',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '6px',
  },
  categoryLink: {
    color: 'var(--color-danger)',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '700',
  }
};

export default Costs;
