//Hook for getting necessary admin data like quick links, service stats, etc.
import { createContext, useState, useEffect, useContext } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const AdminContext = createContext();

export default function AdminProvider({ children }) {

    //For Now, Services Data, Operators, and Franchise Applications
    //TODO: Quick Links, Service Stats, and other admin data

    //States to be consumed by the admin dashboard and other admin components
    const [services, setServices] = useState([]);
    const [serviceLoading, setServiceLoading] = useState(true);
    const [operators, setOperators] = useState([]);
    const [operatorLoading, setOperatorLoading] = useState(true);
    const [franchiseApplications, setFranchiseApplications] = useState([]);
    const [franchiseLoading, setFranchiseLoading] = useState(true);

    //UseEffect to register the firestore listeners for services, operators, and franchise applications
    useEffect(() => {

        // Subscribe to the services collection in Firestore
        const unsubscribeServices = onSnapshot(collection(firestore, 'services'), (snapshot) => {
            const servicesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setServices(servicesData);
            setServiceLoading(false);
        });

        // Subscribe to the operators collection in Firestore
        const unsubscribeOperators = onSnapshot(query(collection(firestore, 'users'), where('role', '==', 'operator')), (snapshot) => {
            const operatorsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setOperators(operatorsData);
            setOperatorLoading(false);
        });

        const unsubscribeFranchiseApplications = onSnapshot(collection(firestore, 'franchiseApplications'), (snapshot) => {
            const applications = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setFranchiseApplications(applications);
            setFranchiseLoading(false);
        });

        // Clean up the subscriptions when the component unmounts
        return () => {
            unsubscribeServices();
            unsubscribeOperators();
            unsubscribeFranchiseApplications();
        };

    }, []);

    return (
        <AdminContext.Provider value={{ services, operators, franchiseApplications, serviceLoading, operatorLoading, franchiseLoading }}>
            {children}
        </AdminContext.Provider>
    );
}

//UseAdminContext Hook to safely consume the AdminContext in other components
export function useAdminContext() {
    let context = useContext(AdminContext);
    if(!context){
        throw new Error("useAdminContext must be used within an AdminProvider");
    }
    return context;
}