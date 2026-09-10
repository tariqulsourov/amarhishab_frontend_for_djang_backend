import React, { useState, useEffect } from 'react';
import MobileLayout from '../components/MobileLayout';
import api from '../utils/api';
import { Plus, Trash2, Edit2, X, Check, FolderOpen, AlertTriangle } from 'lucide-react';

const Categories = () => {
  const [activeTab, setActiveTab] = useState('cost'); // 'cost' or 'income'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Alert modal state
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);

  const triggerAlert = (err, defaultMsg) => {
    let msg = defaultMsg;
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data === 'string') msg = data;
      else if (data.error) msg = data.error;
      else if (data.detail) msg = data.detail;
      else if (Array.isArray(data)) msg = data[0];
      else if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        if (Array.isArray(val)) msg = val[0];
        else if (typeof val === 'string') msg = val;
      }
    }
    setAlertMessage(msg);
    setShowAlertModal(true);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'cost' 
        ? '/api/v1/costs/categories/' 
        : '/api/v1/income/categories/';
      const res = await api.get(url);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      setCreating(true);
      const url = activeTab === 'cost' 
        ? '/api/v1/costs/categories/' 
        : '/api/v1/income/categories/';
      await api.post(url, { short_info: newCategoryName });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      triggerAlert(err, 'Failed to create sector.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    try {
      setUpdating(true);
      const url = activeTab === 'cost' 
        ? `/api/v1/costs/categories/${id}/` 
        : `/api/v1/income/categories/${id}/`;
      await api.put(url, { short_info: editingName });
      setEditingId(null);
      setEditingName('');
      fetchCategories();
    } catch (err) {
      triggerAlert(err, 'Failed to update sector.');
    } finally {
      setUpdating(false);
    }
  };

  const triggerDeleteConfirm = (id) => {
    setDeleteConfirmId(id);
    setShowConfirmModal(true);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const url = activeTab === 'cost' 
        ? `/api/v1/costs/categories/${deleteConfirmId}/` 
        : `/api/v1/income/categories/${deleteConfirmId}/`;
      await api.delete(url);
      setShowConfirmModal(false);
      setDeleteConfirmId(null);
      fetchCategories();
    } catch (err) {
      triggerAlert(err, 'Failed to delete sector.');
    }
  };

  return (
    <MobileLayout title="Cash Flow Sectors">
      {/* Tab Selectors */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('cost')}
          style={{
            ...styles.tabButton,
            background: activeTab === 'cost' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'cost' ? '#ffffff' : 'var(--color-text-secondary)',
          }}
        >
          Expense Sectors
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          style={{
            ...styles.tabButton,
            background: activeTab === 'income' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'income' ? '#ffffff' : 'var(--color-text-secondary)',
          }}
        >
          Income Sectors
        </button>
      </div>

      {/* Add New Sector Form */}
      <form onSubmit={handleCreate} style={styles.addForm}>
        <input 
          type="text" 
          placeholder={activeTab === 'cost' ? 'e.g. Daily Groceries' : 'e.g. Freelance Projects'}
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="input-field"
          style={{ flexGrow: 1, height: '38px', borderRadius: '10px' }}
          required
        />
        <button type="submit" className="primary-btn" style={styles.addButton} disabled={creating}>
          <Plus size={16} style={{ marginRight: '4px' }} /> Add
        </button>
      </form>

      {/* Category List */}
      <div style={styles.listContainer}>
        {loading ? (
          <p style={styles.loadingText}>Syncing sectors...</p>
        ) : categories.length === 0 ? (
          <div style={styles.emptyState}>
            <FolderOpen size={36} color="var(--color-text-muted)" />
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              No sectors defined for this type.
            </p>
          </div>
        ) : (
          categories.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="glass-card" style={styles.sectorCard}>
                {isEditing ? (
                  <div style={styles.editRow}>
                    <input 
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="input-field"
                      style={styles.editInput}
                      required
                      autoFocus
                    />
                    <div style={styles.actionGroup}>
                      <button 
                        onClick={() => handleUpdate(c.id)}
                        disabled={updating}
                        style={{ ...styles.actionBtn, color: 'var(--color-primary)' }}
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => { setEditingId(null); setEditingName(''); }}
                        style={{ ...styles.actionBtn, color: 'var(--color-text-muted)' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.viewRow}>
                    <span style={styles.sectorName}>
                      {c.short_info} 
                      <span style={styles.typeTag}>
                        (cash {activeTab === 'cost' ? '−' : '+'})
                      </span>
                    </span>
                    <div style={styles.actionGroup}>
                      <button 
                        onClick={() => { setEditingId(c.id); setEditingName(c.short_info); }}
                        style={styles.actionBtn}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => triggerDeleteConfirm(c.id)}
                        style={{ ...styles.actionBtn, color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showConfirmModal && (
        <div style={styles.confirmOverlay}>
          <div className="glass-card animate-scale-up" style={styles.confirmModalBox}>
            <div style={styles.warningHeaderIcon}>
              <AlertTriangle size={24} color="var(--color-danger)" />
            </div>
            <h3 style={styles.confirmTitle}>Delete Category?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to delete this category? 
              All existing transactions mapped to this category will be preserved and automatically reassigned to your default fallback category.
            </p>
            <div style={styles.confirmActionsRow}>
              <button 
                onClick={() => { setShowConfirmModal(false); setDeleteConfirmId(null); }}
                style={styles.confirmCancelBtn}
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                style={styles.confirmDeleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Info/Alert Modal */}
      {showAlertModal && (
        <div style={styles.confirmOverlay}>
          <div className="glass-card animate-scale-up" style={styles.confirmModalBox}>
            <div style={styles.warningHeaderIcon}>
              <AlertTriangle size={24} color="var(--color-warning)" />
            </div>
            <h3 style={styles.confirmTitle}>Action Required</h3>
            <p style={styles.confirmText}>{alertMessage}</p>
            <div style={styles.confirmActionsRow}>
              <button 
                onClick={() => { setShowAlertModal(false); setAlertMessage(''); }}
                style={{ ...styles.confirmCancelBtn, flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  tabContainer: {
    display: 'flex',
    background: 'rgba(30, 61, 55, 0.05)',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '16px',
    border: '1px solid var(--border-color)',
  },
  tabButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  addForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  addButton: {
    height: '38px',
    borderRadius: '10px',
    padding: '0 16px',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
    textTransform: 'none',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectorCard: {
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 12px rgba(30, 61, 55, 0.02)',
  },
  viewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    width: '100%',
  },
  sectorName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: 'var(--color-text-secondary)',
  },
  typeTag: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginLeft: '6px',
    fontWeight: '500',
  },
  editInput: {
    flexGrow: 1,
    height: '32px',
    padding: '4px 8px',
    fontSize: '13px',
    borderRadius: '8px',
  },
  actionGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    padding: '24px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 7, 18, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    zIndex: 2000,
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: '290px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    borderRadius: '24px',
    background: 'var(--bg-card)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
  },
  warningHeaderIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px',
  },
  confirmTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: 'var(--color-text-primary)',
  },
  confirmText: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--color-text-secondary)',
  },
  confirmActionsRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    marginTop: '8px',
  },
  confirmCancelBtn: {
    flex: 1,
    height: '36px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--color-text-primary)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1.2,
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    background: 'var(--color-danger)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
  }
};

export default Categories;
