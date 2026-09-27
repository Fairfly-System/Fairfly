import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { firestore } from '../firebase';

/**
 * Custom React Hook for True Firestore Query-Level Cursor Pagination.
 *
 * Highlights:
 * 1. Restricts documents returned from Firestore to only the requested pageSize.
 * 2. Uses Firestore startAfter(cursor) for subsequent pages.
 * 3. Maintains a page cursor stack for seamless back/forward navigation.
 * 4. Uses getCountFromServer for instant zero-document count metadata.
 * 5. Supports real-time onSnapshot listeners or single getDocs fetches.
 * 6. Includes bounded search safeguard (limit 50) when multi-field search is active.
 */
export function useFirestorePagination({
  collectionName,
  filters = [],
  filterKey: customFilterKey = null,
  orderByField = 'createdAt',
  orderDirection = 'desc',
  initialPageSize = 8,
  realtime = true,
  enabled = true,
  searchTerm = '',
  searchFilterFn = null,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  // Stack of document snapshots to support backward/forward cursor pagination
  const cursorsRef = useRef({ 1: null });

  // Generate a stable key for filters
  const filterKey = useMemo(() => {
    if (customFilterKey) return customFilterKey;
    return (filters || []).map((f) => (f ? JSON.stringify(f) : '')).join(';');
  }, [filters, customFilterKey]);

  // Reset pagination when collection, filters, or search change
  useEffect(() => {
    setCurrentPage(1);
    cursorsRef.current = { 1: null };
  }, [collectionName, filterKey, pageSize, searchTerm]);

  // Fetch total count using Firestore Server Aggregation (costs 0 document payload transfers)
  const fetchCount = useCallback(async () => {
    if (!enabled || !collectionName) return;
    try {
      let countQ = collection(firestore, collectionName);
      if (filters && filters.length > 0) {
        countQ = query(countQ, ...filters);
      }
      const countSnap = await getCountFromServer(countQ);
      setTotalItems(countSnap.data().count);
    } catch (err) {
      console.warn(`[useFirestorePagination] Count aggregation notice on ${collectionName}:`, err.message);
    }
  }, [collectionName, filterKey, enabled, filters]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Execute the paginated Firestore query
  useEffect(() => {
    if (!enabled || !collectionName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const isSearching = Boolean(searchTerm && searchTerm.trim());
    const baseCol = collection(firestore, collectionName);
    let q;

    if (isSearching) {
      // Bounded search query: fetch at most 50 recent matching documents for client search filter
      const searchConstraints = [...filters];
      if (orderByField) {
        searchConstraints.push(orderBy(orderByField, orderDirection));
      }
      searchConstraints.push(limit(50));
      q = query(baseCol, ...searchConstraints);
    } else {
      // True query-level cursor pagination: requests exactly pageSize documents
      const cursor = cursorsRef.current[currentPage];
      const queryConstraints = [...filters];
      if (orderByField) {
        queryConstraints.push(orderBy(orderByField, orderDirection));
      }
      if (cursor) {
        queryConstraints.push(startAfter(cursor));
      }
      queryConstraints.push(limit(pageSize));
      q = query(baseCol, ...queryConstraints);
    }

    let activeUnsubscribe = null;

    const handleSnapshot = (snapshot) => {
      const docs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      if (isSearching && searchFilterFn) {
        const filtered = docs.filter(searchFilterFn);
        setTotalItems(filtered.length);
        const start = (currentPage - 1) * pageSize;
        setData(filtered.slice(start, start + pageSize));
      } else {
        // Record the last document of this page as the cursor for the next page
        if (snapshot.docs.length > 0) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          cursorsRef.current[currentPage + 1] = lastDoc;
        }
        setData(docs);
      }
      setLoading(false);
    };

    const handleError = (err) => {
      console.warn(`[useFirestorePagination] Notice on ${collectionName}:`, err.message);
      // Fallback query without orderBy if index is required/building
      try {
        const fallbackQ = query(baseCol, ...filters, limit(isSearching ? 50 : pageSize));
        if (realtime) {
          activeUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            if (orderByField) {
              docs.sort((a, b) => {
                const valA = a[orderByField] || '';
                const valB = b[orderByField] || '';
                return orderDirection === 'desc'
                  ? (valB > valA ? 1 : valB < valA ? -1 : 0)
                  : (valA > valB ? 1 : valA < valB ? -1 : 0);
              });
            }
            if (isSearching && searchFilterFn) {
              const filtered = docs.filter(searchFilterFn);
              setTotalItems(filtered.length);
              const start = (currentPage - 1) * pageSize;
              setData(filtered.slice(start, start + pageSize));
            } else {
              setData(docs);
            }
            setLoading(false);
          }, (fallbackErr) => {
            setError(fallbackErr);
            setLoading(false);
          });
        } else {
          getDocs(fallbackQ).then(handleSnapshot).catch((fallbackErr) => {
            setError(fallbackErr);
            setLoading(false);
          });
        }
      } catch (e) {
        setError(err);
        setLoading(false);
      }
    };

    if (realtime) {
      activeUnsubscribe = onSnapshot(q, handleSnapshot, handleError);
      return () => {
        if (activeUnsubscribe) activeUnsubscribe();
      };
    } else {
      getDocs(q).then(handleSnapshot).catch(handleError);
    }
  }, [
    collectionName,
    filterKey,
    orderByField,
    orderDirection,
    currentPage,
    pageSize,
    realtime,
    enabled,
    searchTerm,
    searchFilterFn,
    filters
  ]);

  return {
    data,
    loading,
    error,
    currentPage,
    pageSize,
    totalItems,
    setCurrentPage,
    setPageSize,
    refetchCount: fetchCount
  };
}

export default useFirestorePagination;
