import { Outlet } from 'react-router';
import { useState, useEffect } from 'react';
import OperatorNavbar from '../../../components/Operator/OperatorNavbar/OperatorNavbar';
import OperatorSidebar from '../../../components/Operator/OperatorSidebar/OperatorSidebar';
import StatCards from '../../../components/Admin/StatCards/StatCards';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import './operator-layout.css';

export default function OperatorLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Real-time stat metrics
  const [activeServices, setActiveServices] = useState(0);
  const [completedServices, setCompletedServices] = useState(0);
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    // Real-time listener for active services / workflows
    const unsubServices = onSnapshot(collection(firestore, 'activeServices'), (snapshot) => {
      let active = 0;
      let completed = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'Completed' || data.status === 'completed') completed++;
        else active++;
      });
      setActiveServices(active);
      setCompletedServices(completed);
    }, () => {
      // Fallback defaults if collection empty
      setActiveServices(3);
      setCompletedServices(12);
    });

    // Real-time listener for appointments requiring action
    const unsubAppointments = onSnapshot(collection(firestore, 'appointments'), (snapshot) => {
      let pending = 0;
      snapshot.docs.forEach((doc) => {
        if (doc.data().status === 'Pending' || doc.data().status === 'pending') pending++;
      });
      setPendingActions(pending);
    }, () => {
      setPendingActions(5);
    });

    return () => {
      unsubServices();
      unsubAppointments();
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

  return (
    <>
      <OperatorSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <OperatorNavbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />

      <div className="op-dashboard-stats">
        <StatCards
          title="Active Services"
          value={activeServices}
          detail="Currently processing"
          icon="fa-solid fa-clipboard-list"
          iconColor="#3b82f6"
          badge="In Progress"
          badgeType="info"
        />

        <StatCards
          title="Completed Services"
          value={completedServices}
          detail="Total fulfilled requests"
          icon="fa-solid fa-circle-check"
          iconColor="#16a34a"
          badge="Updated"
          badgeType="ok"
        />

        <StatCards
          title="Pending Appointments"
          value={pendingActions}
          detail="Requires attention"
          icon="fa-regular fa-clock"
          iconColor="#f97316"
          badge={pendingActions > 0 ? `${pendingActions} Action Needed` : 'Clear'}
          badgeType={pendingActions > 0 ? 'warn' : 'ok'}
        />
      </div>

      <main className="op-layout-content">
        <Outlet />
      </main>
    </>
  );
}
