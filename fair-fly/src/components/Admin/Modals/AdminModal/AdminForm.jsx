import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../../../firebase';
import { useToast } from '../../../UI/toast/ToastProvider';
import useDebounce from '../../../../hooks/useDebounce';

const OPERATORS_PAGE_SIZE = 5;

export default function AdminForm({ onSubmit, isLoading, initialData }) {
  const { addToast } = useToast();
  const [username, setUsername] = useState(initialData?.username || initialData?.fullName || '');
  const [fullName, setFullName] = useState(initialData?.fullName || initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [status, setStatus] = useState(initialData?.status || 'Active');
  const [assignedOperators, setAssignedOperators] = useState(initialData?.assignedOperators || []);

  const [availableOperators, setAvailableOperators] = useState([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [operatorSearch, setOperatorSearch] = useState('');
  const debouncedOperatorSearch = useDebounce(operatorSearch, 300);
  const [visibleCount, setVisibleCount] = useState(OPERATORS_PAGE_SIZE);

  // Fetch all active operators
  useEffect(() => {
    const fetchOperators = async () => {
      setLoadingOperators(true);
      try {
        const q = query(
          collection(firestore, 'users'),
          where('role', '==', 'operator')
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvailableOperators(list);
      } catch (err) {
        console.error('Error fetching operators for assignment:', err);
      } finally {
        setLoadingOperators(false);
      }
    };

    fetchOperators();
  }, []);

  // Reset pagination when debounced search query changes
  useEffect(() => {
    setVisibleCount(OPERATORS_PAGE_SIZE);
  }, [debouncedOperatorSearch]);

  const handleToggleOperator = (opId) => {
    setAssignedOperators((prev) => {
      if (prev.includes(opId)) {
        return prev.filter((id) => id !== opId);
      } else {
        return [...prev, opId];
      }
    });
  };

  const handleSelectAll = () => {
    setAssignedOperators(availableOperators.map((op) => op.id));
  };

  const handleClearAll = () => {
    setAssignedOperators([]);
  };

  const filteredOperators = useMemo(() => {
    if (!debouncedOperatorSearch.trim()) return availableOperators;
    const q = debouncedOperatorSearch.toLowerCase().trim();
    return availableOperators.filter(
      (op) =>
        op.branchName?.toLowerCase().includes(q) ||
        op.name?.toLowerCase().includes(q) ||
        op.fullName?.toLowerCase().includes(q) ||
        op.email?.toLowerCase().includes(q)
    );
  }, [availableOperators, debouncedOperatorSearch]);

  const visibleOperators = useMemo(() => {
    return filteredOperators.slice(0, visibleCount);
  }, [filteredOperators, visibleCount]);

  const hasMore = visibleCount < filteredOperators.length;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40 && hasMore) {
      setVisibleCount((prev) => Math.min(prev + OPERATORS_PAGE_SIZE, filteredOperators.length));
    }
  };

  const isFormValid = Boolean(
    username.trim() &&
    (initialData || (email.trim() && password && password.length >= 6))
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim()) {
      addToast('Username is required', 'warning');
      return;
    }

    if (!initialData && !email.trim()) {
      addToast('Email address is required', 'warning');
      return;
    }

    if (!initialData && (!password || password.length < 6)) {
      addToast('Password must be at least 6 characters', 'warning');
      return;
    }

    const payload = {
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      name: fullName.trim() || username.trim(),
      phone: phone.trim(),
      status: status,
      assignedOperators: assignedOperators
    };

    if (!initialData) {
      payload.email = email.trim().toLowerCase();
      payload.password = password;
    }

    onSubmit(payload);
  };

  return (
    <form className="form-column" onSubmit={handleSubmit}>
      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">
            Username <span className="req-star">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. support.admin1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Full Name / Display Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Alex Santos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">
            Email Address <span className="req-star">*</span>
          </label>
          <input
            type="email"
            className="form-input"
            placeholder="admin.support@fairfly.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || !!initialData}
          />
          {initialData && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              Email cannot be changed after creation.
            </span>
          )}
        </div>

        {!initialData ? (
          <div className="form-column">
            <label className="form-label">
              Password <span className="req-star">*</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="form-column">
            <label className="form-label">Account Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isLoading || initialData?.isSuperAdmin}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      <div className="form-grid-2">
        <div className="form-column">
          <label className="form-label">Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            placeholder="0912 345 6789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="form-column">
          <label className="form-label">Role Assignment</label>
          <input
            type="text"
            className="form-input"
            value={initialData?.isSuperAdmin ? 'Super Administrator (Full System Authority)' : 'Support Administrator (Fairfly Admin)'}
            disabled
          />
        </div>
      </div>

      {/* ── Assigned Branch Operators ── */}
      <div className="form-column" style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0 }}>
            Assigned Branch Operators ({assignedOperators.length} selected)
          </label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem' }}
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '0.1875rem 0.5rem' }}
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
          Assign branch operators this administrator is responsible for monitoring and supporting.
        </p>

        {/* Search Filter */}
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.45rem 2rem 0.45rem 0.75rem', fontSize: '0.8125rem' }}
            placeholder="Search branch name, operator name, or email..."
            value={operatorSearch}
            onChange={(e) => setOperatorSearch(e.target.value)}
          />
          {operatorSearch && (
            <button
              type="button"
              onClick={() => setOperatorSearch('')}
              style={{
                position: 'absolute',
                right: '0.625rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div
          className="admin-form-operators-grid"
          onScroll={handleScroll}
          style={{ maxHeight: '13.5rem', overflowY: 'auto' }}
        >
          {loadingOperators ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.8125rem' }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Loading operators...
            </div>
          ) : filteredOperators.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.8125rem' }}>
              No branch operators found.
            </div>
          ) : (
            <>
              {visibleOperators.map((op) => {
                const isChecked = assignedOperators.includes(op.id);
                return (
                  <label
                    key={op.id}
                    className={`admin-operator-checkbox-card ${isChecked ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleOperator(op.id)}
                      style={{ accentColor: 'var(--purple)', width: '1rem', height: '1rem' }}
                    />
                    <div className="admin-op-card-info">
                      <span className="admin-op-card-name">
                        {op.branchName || op.name || op.fullName || 'Branch Operator'}
                      </span>
                      <span className="admin-op-card-email">{op.email}</span>
                    </div>
                  </label>
                );
              })}

              {hasMore && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(124, 58, 237, 0.04)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--purple-light)',
                    marginTop: '0.25rem'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--purple)', fontWeight: 600 }}>
                    <i className="fa-solid fa-angles-down" style={{ marginRight: '0.25rem' }}></i>
                    Showing {visibleOperators.length} of {filteredOperators.length} • Scroll down or
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.6875rem', padding: '0.125rem 0.45rem', color: 'var(--purple)', fontWeight: 700 }}
                    onClick={() => setVisibleCount((prev) => Math.min(prev + OPERATORS_PAGE_SIZE, filteredOperators.length))}
                  >
                    Load More (+{Math.min(OPERATORS_PAGE_SIZE, filteredOperators.length - visibleCount)})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !isFormValid}
        >
          <i className="fa-solid fa-user-shield"></i>
          {isLoading ? 'Saving...' : initialData ? 'Update Administrator' : 'Create Administrator'}
        </button>
      </div>
    </form>
  );
}
