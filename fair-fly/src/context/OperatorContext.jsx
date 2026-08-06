import { createContext, useState, useEffect, useContext } from 'react';
import { firestore } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

const OperatorContext = createContext();

export default function OperatorProvider({
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
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error(`OperatorProvider onSnapshot error on ${targetCollection}:`, error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [targetCollection, JSON.stringify(queryReq)]);

  return (
    <OperatorContext.Provider value={{ data, loading }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperatorContext() {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error('useOperatorContext must be used within an OperatorProvider');
  }
  return context;
}
