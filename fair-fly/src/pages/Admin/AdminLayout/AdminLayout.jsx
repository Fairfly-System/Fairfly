import './admin-layout.css';
import { Outlet } from 'react-router';
import AdminNavbar from '../../../components/Admin/AdminNavbar/AdminNavbar';
import AdminSidebar from '../../../components/Admin/AdminSidebar/AdminSidebar';
import StatCards from '../../../components/Admin/StatCards/StatCards';
import { useEffect, useState } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function MainLayout() {
  // ── Sidebar toggle (mobile drawer) ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Services
  const [activeServices, setActiveServices] = useState(0);
  const [disabledServices, setDisabledServices] = useState(0);

  // Users
  const [clients, setClients] = useState(0);
  const [activeOperators, setActiveOperators] = useState(0);
  const [disabledOperators, setDisabledOperators] = useState(0);

  // Franchise applications
  const [pendingApps, setPendingApps] = useState(0);

  useEffect(() => {
    // ── Services ──
    const unsubServices = onSnapshot(collection(firestore, 'services'), (snapshot) => {
      let active = 0;
      let disabled = 0;
      snapshot.docs.forEach((doc) => {
        if (doc.data().status === 'Active') active++;
        else disabled++;
      });
      setActiveServices(active);
      setDisabledServices(disabled);
    });

    // ── Users (Operators & Clients) ──
    const qUsers = query(
      collection(firestore, 'users'),
      where('role', 'in', ['operator', 'client'])
    );
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      let activeOp = 0;
      let disabledOp = 0;
      let clientCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'operator') {
          if (data.status === 'Active') activeOp++;
          else disabledOp++;
        } else if (data.role === 'client') {
          clientCount++;
        }
      });

      setActiveOperators(activeOp);
      setDisabledOperators(disabledOp);
      setClients(clientCount);
    });

    // ── Franchise Applications (pending) ──
    const qFranchise = query(
      collection(firestore, 'franchiseApplications'),
      where('status', '==', 'pending')
    );
    const unsubFranchise = onSnapshot(qFranchise, (snapshot) => {
      setPendingApps(snapshot.size);
    });

    return () => {
      unsubServices();
      unsubUsers();
      unsubFranchise();
    };
  }, []);

  /** Close sidebar when window resizes past mobile breakpoint */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const totalOperators = activeOperators + disabledOperators;
  const totalServices = activeServices + disabledServices;

  return (
    <>
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <AdminNavbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="dashboard-stats">
        {/* ── Revenue ── */}
        <StatCards
          title="Total Revenue"
          value="—"
          detail="Revenue tracking not yet configured"
          icon="fa-solid fa-peso-sign"
          iconColor="#16a34a"
          badge="Placeholder"
          badgeType="neutral"
        />

        {/* ── Active Services ── */}
        <StatCards
          title="Active Services"
          value={activeServices}
          detail={`${totalServices} service${totalServices !== 1 ? 's' : ''} in catalog`}
          icon="fa-regular fa-file-lines"
          iconColor="#3b82f6"
          badge={disabledServices > 0 ? `${disabledServices} Disabled` : 'All Active'}
          badgeType={disabledServices > 0 ? 'warn' : 'ok'}
        />

        {/* ── Clients ── */}
        <StatCards
          title="Clients"
          value={clients}
          detail="Registered client accounts"
          icon="fa-solid fa-user-group"
          iconColor="#a855f7"
          badge={clients > 0 ? `${clients} registered` : 'No clients yet'}
          badgeType={clients > 0 ? 'info' : 'neutral'}
        />

        {/* ── Operators ── */}
        <StatCards
          title="Operators"
          value={activeOperators}
          detail={`${totalOperators} total franchise branch${totalOperators !== 1 ? 'es' : ''}`}
          icon="fa-solid fa-people-group"
          iconColor="#f0653e"
          badge={
            pendingApps > 0 ? `${pendingApps} App${pendingApps !== 1 ? 's' : ''} Pending`
              : disabledOperators > 0 ? `${disabledOperators} Inactive` : 'All Active'
          }
          badgeType={
            pendingApps > 0
              ? 'warn'
              : disabledOperators > 0
                ? 'warn'
                : 'ok'
          }
        />
      </div>

      <main className="layout-content">
        <Outlet />
      </main>
    </>
  );
}
