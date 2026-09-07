import { Outlet } from 'react-router';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../../../components/UI/AppLayout/AppLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';
import './operator-layout.css';

const baseOperatorLinks = [
  { to: '/operator', end: true, icon: 'fa-solid fa-table-cells-large', label: 'Dashboard' },
  { to: '/operator/appointments', icon: 'fa-regular fa-calendar', label: 'Appointments' },
  { to: '/operator/services', icon: 'fa-solid fa-concierge-bell', label: 'Services' },
  { to: '/operator/inquiry-forms', icon: 'fa-solid fa-file-pen', label: 'Inquiry Forms' },
  { to: '/operator/quotations', icon: 'fa-solid fa-file-invoice-dollar', label: 'Quotations' },
  { to: '/operator/resources', icon: 'fa-solid fa-folder-open', label: 'Resources' },
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

  useEffect(() => {
    // Real-time listener for active services / workflows
    const unsubServices = onSnapshot(collection(firestore, 'activeServices'), (snapshot) => {
      let active = 0;
      let completed = 0;
      const userHasScoped = user?.uid && snapshot.docs.some((d) => d.data().operatorId === user.uid || d.data().branchUid === user.uid);

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (userHasScoped && data.operatorId !== user.uid && data.branchUid !== user.uid) {
          return;
        }
        if (data.status === 'Completed' || data.status === 'completed') completed++;
        else if (data.status !== 'Cancelled' && data.status !== 'cancelled') active++;
      });
      setActiveServices(active);
      setCompletedServices(completed);
    }, () => {
      setActiveServices(0);
      setCompletedServices(0);
    });

    // Real-time listener for appointments requiring action
    const unsubAppointments = onSnapshot(collection(firestore, 'appointments'), (snapshot) => {
      let pending = 0;
      snapshot.docs.forEach((doc) => {
        if (doc.data().status === 'Pending' || doc.data().status === 'pending') pending++;
      });
      setPendingActions(pending);
    }, () => {
      setPendingActions(0);
    });

    return () => {
      unsubServices();
      unsubAppointments();
    };
  }, [user?.uid]);

  const branchRevenue = Number(userDetails?.totalRevenue) || 0;

  return (
    <AppLayout
      portalName="Operator"
      portalSubtitle="Branch Operations"
      navLinks={baseOperatorLinks}
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
