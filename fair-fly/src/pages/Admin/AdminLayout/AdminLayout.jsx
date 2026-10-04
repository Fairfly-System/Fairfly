import './admin-layout.css';
import { Outlet } from 'react-router';
import AppLayout from '../../../components/UI/AppLayout/AppLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where, limit, getCountFromServer } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';

const baseAdminLinks = [
  { to: '/admin', end: true, icon: 'fa-solid fa-arrow-trend-up', label: 'Analytics' },
  { to: '/admin/services', icon: 'fa-regular fa-file-lines', label: 'Services' },
  { to: '/admin/workflow-templates', icon: 'fa-solid fa-diagram-project', label: 'Workflows' },
  { to: '/admin/operators', icon: 'fa-solid fa-users', label: 'Operators' },
  { to: '/admin/clients', icon: 'fa-solid fa-user-group', label: 'Clients' },
  { to: '/admin/resources', icon: 'fa-solid fa-folder-open', label: 'Resources' },
  { to: '/admin/announcements', icon: 'fa-solid fa-bullhorn', label: 'Announcements' },
  { to: '/admin/messages', icon: 'fa-solid fa-comments', label: 'Messages' },
  { to: '/admin/qualifications', icon: 'fa-solid fa-certificate', label: 'Qualifications' },
  { to: '/admin/tickets', icon: 'fa-solid fa-ticket', label: 'Tickets' },
  { to: '/admin/franchise-apps', icon: 'fa-solid fa-briefcase', label: 'Franchise Application' },
  { to: '/admin/appointments', icon: 'fa-regular fa-calendar-check', label: 'Consultations' },
  { to: '/admin/inquiry-history', icon: 'fa-solid fa-clipboard-list', label: 'Inquiry History' },
  { to: '/admin/quick-links', icon: 'fa-solid fa-link', label: 'Quick Links' },
  { to: '/admin/chatbot', icon: 'fa-solid fa-robot', label: 'Chatbot' },
];

export default function AdminLayout() {
  const { user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';

  const navLinks = useMemo(() => {
    if (isSuperAdmin) {
      const links = [...baseAdminLinks];
      links.splice(5, 0, {
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

  // Tickets requiring action
  const [openTickets, setOpenTickets] = useState(0);

  // Appointments requiring action
  const [pendingAppointments, setPendingAppointments] = useState(0);

  useEffect(() => {
    // 1. Lightweight Server Aggregation for Total Counts (Zero document bodies streamed)
    const fetchCounters = async () => {
      try {
        const [activeSrv, totalSrv, activeOp, disabledOp, clientsSnap] = await Promise.all([
          getCountFromServer(query(collection(firestore, 'services'), where('status', '==', 'Active'))),
          getCountFromServer(collection(firestore, 'services')),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'operator'), where('status', '==', 'Active'))),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'operator'), where('status', '==', 'Disabled'))),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'client')))
        ]);

        setActiveServices(activeSrv.data().count);
        setDisabledServices(Math.max(0, totalSrv.data().count - activeSrv.data().count));
        setActiveOperators(activeOp.data().count);
        setDisabledOperators(disabledOp.data().count);
        setClients(clientsSnap.data().count);
      } catch (err) {
        console.warn('AdminLayout getCountFromServer notice:', err?.message);
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 60000);

    // 2. Real-time badge indicators (capped to limit(100))
    const qFranchise = query(
      collection(firestore, 'franchiseApplications'),
      where('status', '==', 'pending'),
      limit(100)
    );
    const unsubFranchise = onSnapshot(qFranchise, (snapshot) => {
      setPendingApps(snapshot.size);
    }, () => setPendingApps(0));

    const qTickets = query(
      collection(firestore, 'tickets'),
      where('status', 'in', ['Open', 'open', 'In Progress', 'in_progress', 'pending']),
      limit(100)
    );
    const unsubTickets = onSnapshot(
      qTickets,
      (snapshot) => {
        setOpenTickets(snapshot.size);
      },
      () => {
        setOpenTickets(0);
      }
    );

    // NOTE: Querying only by 'type' (single-field index, auto-created by Firestore).
    // Status is filtered client-side to avoid requiring a composite index
    // (type + status) that doesn't yet exist.
    const qAppointments = query(
      collection(firestore, 'appointments'),
      where('type', '==', 'franchise_consultation'),
      limit(100)
    );
    const unsubAppointments = onSnapshot(
      qAppointments,
      (snapshot) => {
        const pending = snapshot.docs.filter((doc) => {
          const s = (doc.data().status || '').toLowerCase();
          return s === 'pending';
        });
        setPendingAppointments(pending.length);
      },
      () => {
        setPendingAppointments(0);
      }
    );

    return () => {
      clearInterval(interval);
      unsubFranchise();
      unsubTickets();
      unsubAppointments();
    };
  }, []);

  const totalOperators = activeOperators + disabledOperators;
  const totalServices = activeServices + disabledServices;

  const tabNotifications = useMemo(() => ({
    '/admin/franchise-apps': pendingApps,
    '/admin/tickets': openTickets,
    '/admin/appointments': pendingAppointments,
  }), [pendingApps, openTickets, pendingAppointments]);

  return (
    <AppLayout
      portalName="Admin"
      portalSubtitle="Management Portal"
      navLinks={navLinks}
      tabNotifications={tabNotifications}
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
