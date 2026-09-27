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

const EMPTY_FILTERS = [];

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
 * 7. Guaranteed stability: zero infinite re-renders or unneeded re-subscriptions.
 */
export function useFirestorePagination({
  collectionName,
  filters = EMPTY_FILTERS,
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
  const [unfilteredTotal, setUnfilteredTotal] = useState(0);

  // Stack of document snapshots to support backward/forward cursor pagination
  const cursorsRef = useRef({ 1: null });

  // Store latest filters & searchFilterFn in refs to avoid unstable closure dependencies
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const searchFilterFnRef = useRef(searchFilterFn);
  searchFilterFnRef.current = searchFilterFn;

  const unfilteredTotalRef = useRef(0);

  // Generate a stable primitive string key for filters
  const filterKey = useMemo(() => {
    if (customFilterKey) return customFilterKey;
    if (!filters || filters.length === 0) return '__empty__';
    try {
      return filters.map((f) => (f ? JSON.stringify(f) : '')).join(';');
    } catch {
      return String(filters.length);
    }
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
      const activeFilters = filtersRef.current || [];
      if (activeFilters.length > 0) {
        countQ = query(countQ, ...activeFilters);
      }
      const countSnap = await getCountFromServer(countQ);
      const count = countSnap.data().count;
      unfilteredTotalRef.current = count;
      setUnfilteredTotal(count);
      setTotalItems(count);
    } catch (err) {
      console.warn(`[useFirestorePagination] Count aggregation notice on ${collectionName}:`, err.message);
    }
  }, [collectionName, filterKey, enabled]);

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
    const activeFilters = filtersRef.current || [];
    let q;

    if (isSearching) {
      // Bounded search query: fetch at most 50 recent matching documents for client search filter
      const searchConstraints = [...activeFilters];
      if (orderByField) {
        searchConstraints.push(orderBy(orderByField, orderDirection));
      }
      searchConstraints.push(limit(50));
      q = query(baseCol, ...searchConstraints);
    } else {
      // True query-level cursor pagination: requests exactly pageSize documents
      const cursor = cursorsRef.current[currentPage];
      const queryConstraints = [...activeFilters];
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

      const activeSearchFn = searchFilterFnRef.current;
      if (isSearching && activeSearchFn) {
        const filtered = docs.filter(activeSearchFn);
        setTotalItems(filtered.length);
        const start = (currentPage - 1) * pageSize;
        setData(filtered.slice(start, start + pageSize));
      } else {
        if (unfilteredTotalRef.current > 0) {
          setTotalItems(unfilteredTotalRef.current);
        }
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
        const fallbackConstraints = [...(filtersRef.current || [])];
        fallbackConstraints.push(limit(isSearching ? 50 : pageSize));
        const fallbackQ = query(baseCol, ...fallbackConstraints);

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
            const activeSearchFn = searchFilterFnRef.current;
            if (isSearching && activeSearchFn) {
              const filtered = docs.filter(activeSearchFn);
              setTotalItems(filtered.length);
              const start = (currentPage - 1) * pageSize;
              setData(filtered.slice(start, start + pageSize));
            } else {
              if (unfilteredTotalRef.current > 0) {
                setTotalItems(unfilteredTotalRef.current);
              }
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
    searchTerm
  ]);

  return {
    data,
    loading,
    error,
    currentPage,
    pageSize,
    totalItems,
    unfilteredTotal,
    setCurrentPage,
    setPageSize,
    goToPage: setCurrentPage,
    changePageSize: setPageSize,
    refetchCount: fetchCount
  };
}

export default useFirestorePagination;
