import './admin-layout.css';
import { Outlet } from 'react-router';
import AppLayout from '../../../components/UI/AppLayout/AppLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';

const baseAdminLinks = [
  { to: '/admin', end: true, icon: 'fa-solid fa-arrow-trend-up', label: 'Analytics' },
  { to: '/admin/services', icon: 'fa-regular fa-file-lines', label: 'Services' },
  { to: '/admin/workflow-templates', icon: 'fa-solid fa-diagram-project', label: 'Workflows' },
  { to: '/admin/operators', icon: 'fa-solid fa-users', label: 'Operators' },
  { to: '/admin/resources', icon: 'fa-solid fa-folder-open', label: 'Resources' },
  { to: '/admin/franchise-apps', icon: 'fa-solid fa-briefcase', label: 'Franchise Application' },
  { to: '/admin/tickets', icon: 'fa-solid fa-ticket', label: 'Tickets' },
  { to: '/admin/inquiry-history', icon: 'fa-solid fa-clipboard-list', label: 'Inquiry History' },
  { to: '/admin/quick-links', icon: 'fa-solid fa-link', label: 'Quick Links' },
];

export default function AdminLayout() {
  const { user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';

  const navLinks = useMemo(() => {
    if (isSuperAdmin) {
      // Insert Admins link right after Operators (index 3)
      const links = [...baseAdminLinks];
      links.splice(4, 0, {
        to: '/admin/admins',
        icon: 'fa-solid fa-user-shield',
        label: 'Admins'
      });
      return links;
    }
    return baseAdminLinks;
  }, [isSuperAdmin]);
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

  const totalOperators = activeOperators + disabledOperators;
  const totalServices = activeServices + disabledServices;

  return (
    <AppLayout
      portalName="Admin"
      portalSubtitle="Management Portal"
      navLinks={navLinks}
      statCards={
        <>
          {/* ── Revenue ── */}
          <KpiCard
            title="Total Revenue"
            value="—"
            detail="Revenue tracking not yet configured"
            icon="fa-solid fa-peso-sign"
            iconColor="#16a34a"
            badge="Placeholder"
            badgeType="neutral"
          />

          {/* ── Active Services ── */}
          <KpiCard
            title="Active Services"
            value={activeServices}
            detail={`${totalServices} service${totalServices !== 1 ? 's' : ''} in catalog`}
            icon="fa-regular fa-file-lines"
            iconColor="#3b82f6"
            badge={disabledServices > 0 ? `${disabledServices} Disabled` : 'All Active'}
            badgeType={disabledServices > 0 ? 'warn' : 'ok'}
          />

          {/* ── Clients ── */}
          <KpiCard
            title="Clients"
            value={clients}
            detail="Registered client accounts"
            icon="fa-solid fa-user-group"
            iconColor="#a855f7"
            badge={clients > 0 ? `${clients} registered` : 'No clients yet'}
            badgeType={clients > 0 ? 'info' : 'neutral'}
          />

          {/* ── Operators ── */}
          <KpiCard
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
        </>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
