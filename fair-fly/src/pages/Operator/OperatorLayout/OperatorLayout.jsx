import { Outlet } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../../components/UI/AppLayout/AppLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where, or, limit } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';
import './operator-layout.css';

const baseOperatorLinks = [
  { to: '/operator', end: true, icon: 'fa-solid fa-table-cells-large', label: 'Dashboard' },
  { to: '/operator/appointments', icon: 'fa-regular fa-calendar', label: 'Appointments' },
  { to: '/operator/services', icon: 'fa-solid fa-concierge-bell', label: 'Services' },
  { to: '/operator/inquiry-forms', icon: 'fa-solid fa-file-pen', label: 'Inquiry Forms' },
  { to: '/operator/quotations', icon: 'fa-solid fa-file-invoice-dollar', label: 'Quotations' },
  { to: '/operator/resources', icon: 'fa-solid fa-folder-open', label: 'Resources' },
  { to: '/operator/announcements', icon: 'fa-solid fa-bullhorn', label: 'Announcements' },
  { to: '/operator/messages', icon: 'fa-solid fa-comments', label: 'Messages' },
  { to: '/operator/tickets', icon: 'fa-solid fa-ticket', label: 'Tickets' },
  { to: '/operator/quick-links', icon: 'fa-solid fa-globe', label: 'Quick Links' },
  { to: '/operator/history', icon: 'fa-solid fa-clock-rotate-left', label: 'History' },
];

export default function OperatorLayout() {
  const { user, userDetails } = useAuthContext();
  // Real-time stat metrics
  const [activeServices, setActiveServices] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setActiveServices(0);
      setCompletedServices(0);
      setPendingActions(0);
      setOpenTickets(0);
      return;
    }

    // Real-time listener for active services / workflows scoped to this operator
    const qServices = query(
      collection(firestore, 'activeServices'),
      or(where('operatorId', '==', user.uid), where('branchUid', '==', user.uid)),
      limit(100)
    );
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      let active = 0;
      let completed = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Completed' || data.status === 'completed') completed++;
        else if (data.status !== 'Cancelled' && data.status !== 'cancelled') active++;
      });
      setActiveServices(active);
      setCompletedServices(completed);
    }, (err) => {
      console.warn('OperatorLayout services query notice:', err?.message);
      setActiveServices(0);
      setCompletedServices(0);
    });

    // Real-time listener for appointments requiring action (strictly operator-scoped)
    const qAppointments = query(
      collection(firestore, 'appointments'),
      or(where('branchUid', '==', user.uid), where('operatorId', '==', user.uid)),
      limit(50)
    );
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      let pending = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Pending' || data.status === 'pending') {
          pending++;
        }
      });
      setPendingActions(pending);
    }, (error) => {
      console.warn('OperatorLayout appointments onSnapshot notice:', error?.message);
      setPendingActions(0);
    });

    // Real-time listener for open tickets strictly scoped to this operator
    const qTickets = query(
      collection(firestore, 'tickets'),
      where('operatorId', '==', user.uid),
      limit(50)
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      let open = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const isOpenStatus = data.status === 'Open' || data.status === 'open' || data.status === 'pending' || data.status === 'In Progress';
        if (isOpenStatus) open++;
      });
      setOpenTickets(open);
    }, (err) => {
      console.warn('OperatorLayout tickets query notice:', err?.message);
      setOpenTickets(0);
    });

    return () => {
      unsubServices();
      unsubAppointments();
      unsubTickets();
    };
  }, [user?.uid]);

  const branchRevenue = Number(userDetails?.totalRevenue) || 0;

  const tabNotifications = useMemo(() => ({
    '/operator/appointments': pendingActions,
    '/operator/tickets': openTickets,
  }), [pendingActions, openTickets]);

  return (
    <AppLayout
      portalName="Operator"
      portalSubtitle="Branch Operations"
      navLinks={baseOperatorLinks}
      tabNotifications={tabNotifications}
      statCards={
        <>
          <KpiCard
            title="Fulfilled Revenue"
            value={`₱${branchRevenue.toLocaleString()}`}
            detail="Credited from completed services"
            icon="fa-solid fa-coins"
            iconColor="#eab308"
            badge="Revenue"
            badgeType="ok"
          />

          <KpiCard
            title="Active Services"
            value={activeServices}
            detail="Currently processing"
            icon="fa-solid fa-clipboard-list"
            iconColor="#3b82f6"
            badge="In Progress"
            badgeType="info"
          />

          <KpiCard
            title="Completed Services"
            value={completedServices}
            detail="Total fulfilled requests"
            icon="fa-solid fa-circle-check"
            iconColor="#16a34a"
            badge="Updated"
            badgeType="ok"
          />

          <KpiCard
            title="Pending Appointments"
            value={pendingActions}
            detail="Requires attention"
            icon="fa-regular fa-clock"
            iconColor="#f97316"
            badge={pendingActions > 0 ? `${pendingActions} Action Needed` : 'Clear'}
            badgeType={pendingActions > 0 ? 'warn' : 'ok'}
          />
        </>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
