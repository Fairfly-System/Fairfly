import './admin-dashboard.css';
import StatCards from '../../../components/AdminComponents/StatCards/StatCards';
import { useEffect, useState } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {

  //Get the Statistics from the firestore listener and display them in the dashboard
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeServices, setActiveServices] = useState(0);
  const [clients, setClients] = useState(0);
  const [operators, setOperators] = useState(0);

  //For now, only the Total Active Services and Operators will be fetched from the firestore, the rest will be hardcoded for now
  useEffect(() => {
    // Subscribe to the services collection in Firestore
    const unsubscribeServices = onSnapshot(collection(firestore, 'services'), (snapshot) => {
      //Filter the services that are active and set the count to the state
      const activeServices = snapshot.docs.filter(doc => doc.data().status === 'Active');
      setActiveServices(activeServices.length); // Update active services count
    });

    // Subscribe to the operators collection in Firestore
    const unsubscribeOperators = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      //Filter the operators that are active and set the count to the state
      const activeOperators = snapshot.docs.filter(doc => doc.data().status === 'Active' && doc.data().role === 'operator');
      setOperators(activeOperators.length); // Update operators count
    });

    //Get the Clients count from the users collection in Firestore 
    const unsubscribeClients = onSnapshot(collection(firestore, 'users'), (snapshot) => {
      const activeClients = snapshot.docs.filter(doc => doc.data().role === 'client');
      setClients(activeClients.length); // Update clients count
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeServices();
      unsubscribeOperators();
      unsubscribeClients();
    };
  }, []);

  return (
    <div className="dashboard">

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

    </div>
  );
}