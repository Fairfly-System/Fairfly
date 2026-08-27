//Hook for getting necessary admin data like quick links, service stats, etc.
import { createContext, useState, useEffect, useContext } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, query, where, startAt, endAt } from 'firebase/firestore';

const AdminContext = createContext();

export default function AdminProvider({
    children,
    targetCollection,
    queryReq = null,
}) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!targetCollection) return;

        let collectionRef = collection(firestore, targetCollection);

        if (queryReq) {
            collectionRef = query(collectionRef, ...queryReq);
        }

        const unsubscribe = onSnapshot(
            collectionRef,
            (snapshot) => {
                setData(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
                setLoading(false);
            },
            (error) => {
                console.error(`[AdminProvider] Error listening to ${targetCollection}:`, error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [targetCollection]);

    return (
        <AdminContext.Provider
            value={{ data, loading }}
        >
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