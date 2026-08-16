import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthContext } from '../../../context/AuthContext';
import ClientServiceTracker from '../../../components/Client/ClientServiceTracker/ClientServiceTracker';
import ClientServiceRequestModal from '../../../components/Client/ClientServiceRequestModal/ClientServiceRequestModal';
import './client-tracking.css';

export default function ClientTrackingPage() {
  const { user } = useAuthContext();
  const [activeServices, setActiveServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'ongoing' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Subscribe to real-time active services
  useEffect(() => {
    let unsubscribe;
    try {
      setLoading(true);
      const activeServicesRef = collection(db, 'activeServices');

      let q = activeServicesRef;
      if (user?.uid) {
        q = query(activeServicesRef, where('clientUid', '==', user.uid));
      }

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          list.sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0));
          setActiveServices(list);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching client tracking onSnapshot:', error);
          // Fallback
          onSnapshot(activeServicesRef, (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const mine = user?.uid ? all.filter((s) => s.clientUid === user.uid) : all;
            setActiveServices(mine);
            setLoading(false);
          });
        }
      );
    } catch (err) {
      console.error('Setup tracking onSnapshot error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Compute KPI metrics
  const totalCount = activeServices.length;
  const ongoingCount = activeServices.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled').length;
  const completedCount = activeServices.filter((s) => s.status === 'Completed').length;

  // Filter & search
  const filteredServices = useMemo(() => {
    let result = [...activeServices];

    if (activeTab === 'ongoing') {
      result = result.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled');
    } else if (activeTab === 'completed') {
      result = result.filter((s) => s.status === 'Completed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const title = (s.serviceName || s.serviceType || s.title || '').toLowerCase();
        const branch = (s.branchName || '').toLowerCase();
        const status = (s.status || '').toLowerCase();
        return title.includes(q) || branch.includes(q) || status.includes(q);
      });
    }

    return result;
  }, [activeServices, activeTab, searchQuery]);

  return (
    <div className="client-tracking-page">
      {/* Header Banner */}
      <div className="tracking-header-row">
        <div>
          <h2 className="tracking-header-title">
            <i className="fa-solid fa-list-check" style={{ color: 'var(--purple)' }}></i>
            My Service Requests & Tracking
          </h2>
          <p className="tracking-header-subtitle">
            Follow the live status and step-by-step progress of your submitted service requests.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="tracking-realtime-badge">
            <i className="fa-solid fa-bolt"></i>
            Live Real-Time Sync
          </span>

          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsRequestModalOpen(true)}
          >
            <i className="fa-solid fa-plus-circle"></i>
            Request Another Service
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="tracking-kpi-grid">
        <div className="tracking-kpi-card">
          <div className="tracking-kpi-icon tracking-kpi-icon--purple">
            <i className="fa-solid fa-folder-open"></i>
          </div>
          <div className="tracking-kpi-info">
            <span className="tracking-kpi-label">Total Requested</span>
            <span className="tracking-kpi-val">{totalCount}</span>
          </div>
        </div>

        <div className="tracking-kpi-card">
          <div className="tracking-kpi-icon tracking-kpi-icon--orange">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          <div className="tracking-kpi-info">
            <span className="tracking-kpi-label">Currently In Progress</span>
            <span className="tracking-kpi-val">{ongoingCount}</span>
          </div>
        </div>

        <div className="tracking-kpi-card">
          <div className="tracking-kpi-icon tracking-kpi-icon--green">
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <div className="tracking-kpi-info">
            <span className="tracking-kpi-label">Completed & Released</span>
            <span className="tracking-kpi-val">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="tracking-toolbar-card">
        {/* Status Tabs */}
        <div className="tracking-tabs">
          <button
            type="button"
            className={`tracking-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests ({totalCount})
          </button>
          <button
            type="button"
            className={`tracking-tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            In Progress ({ongoingCount})
          </button>
          <button
            type="button"
            className={`tracking-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search Box */}
        <div className="tracking-search-box">
          <i className="fa-solid fa-magnifying-glass tracking-search-icon"></i>
          <input
            type="text"
            className="tracking-search-input"
            placeholder="Search by service name or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="tracking-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      {/* Trackers List Area */}
      <div className="tracking-cards-list">
        {loading ? (
          <div className="tracking-empty-card">
            <i className="fa-solid fa-spinner fa-spin tracking-empty-icon" style={{ fontSize: '2.5rem' }}></i>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Connecting to Live Tracker...</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', margin: 0 }}>
              Retrieving your active service request statuses from Firestore.
            </p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="tracking-empty-card">
            <div className="tracking-empty-icon">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
              {searchQuery ? 'No Matching Service Requests' : 'No Service Requests in this View'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-mid)', maxWidth: '28rem', margin: 0 }}>
              {searchQuery
                ? 'Try refining your search keyword to locate your active requests.'
                : 'Browse our services store to request passport processing, visa assistance, and civil documents.'}
            </p>
            <NavLink to="/client" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <i className="fa-solid fa-store"></i>
              Browse Services Store
            </NavLink>
          </div>
        ) : (
          filteredServices.map((service) => (
            <ClientServiceTracker key={service.id} service={service} />
          ))
        )}
      </div>

      {/* Request Modal */}
      <ClientServiceRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}
