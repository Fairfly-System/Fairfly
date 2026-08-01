import './admin-layout.css';
import { Outlet } from 'react-router';
import AdminNavbar from '../../../components/Admin/AdminNavbar/AdminNavbar';
import AdminSidebar from '../../../components/Admin/AdminSidebar/AdminSidebar';
import StatCards from '../../../components/Admin/StatCards/StatCards';
import { useEffect, useState } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function MainLayout() {
    const [activeServices, setActiveServices] = useState(0);
    const [clients, setClients] = useState(0);
    const [operators, setOperators] = useState(0);

    useEffect(() => {
      const unsubscribeServices = onSnapshot(collection(firestore, 'services'), (snapshot) => {
        const active = snapshot.docs.filter(doc => doc.data().status === 'Active');
        setActiveServices(active.length);
      });

      const unsubscribeUsers = onSnapshot(collection(firestore, 'users'), (snapshot) => {
        let opCount = 0;
        let clientCount = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.role === 'operator' && data.status === 'Active') opCount++;
          if (data.role === 'client') clientCount++;
        });
        setOperators(opCount);
        setClients(clientCount);
      });

      return () => {
        unsubscribeServices();
        unsubscribeUsers();
      };
    }, []);

  return (
    <>
      <AdminNavbar />
      <div className="dashboard-stats">
        <StatCards
          title="Total Revenue"
          value="000,000"
          subtitle="From last month"
          icon="fa-solid fa-peso-sign"
          iconColor="#16a34a"
          subtitleColor="#16a34a"
        />

        <StatCards
          title="Active Services"
          value={activeServices}
          subtitle="Total service"
          icon="fa-regular fa-file-lines"
          iconColor="#3b82f6"
        />

        <StatCards
          title="Clients"
          value={clients}
          subtitle="Total clients"
          icon="fa-solid fa-user-group"
          iconColor="#a855f7"
          subtitleColor="#c026d3"
        />

        <StatCards
          title="Operators"
          value={operators}
          subtitle="Franchise branches"
          icon="fa-solid fa-people-group"
          iconColor="#f0653e"
        />
      </div>

      <div className="layout-container">
        
        <AdminSidebar />
        
        <main className="layout-content">
            <Outlet />
        </main>

      </div>
    </>
  );
}
