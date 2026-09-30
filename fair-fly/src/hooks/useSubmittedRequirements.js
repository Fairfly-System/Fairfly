import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';

/**
 * Custom hook to subscribe/fetch only the specified submitted_requirements document.
 * Minimizes Firestore read costs with targeted single-document fetch/listener and supports fallback.
 * 
 * @param {string|null} submittedRequirementsId - Foreign key reference ID (e.g. "REQ-...")
 * @param {Array|null} fallbackRequirements - Legacy embedded requirements array fallback
 * @returns {{ requirements: Array, rawRecord: Object|null, loading: boolean }}
 */
export function useSubmittedRequirements(submittedRequirementsId, fallbackRequirements = null) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(Boolean(submittedRequirementsId));

  useEffect(() => {
    if (!submittedRequirementsId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(firestore, 'submitted_requirements', submittedRequirementsId);
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRecord({ id: docSnap.id, ...docSnap.data() });
        } else {
          setRecord(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useSubmittedRequirements] Single-doc listener error:', err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [submittedRequirementsId]);

  const resolvedList = (record && Array.isArray(record.requirements) && record.requirements.length > 0)
    ? record.requirements
    : (Array.isArray(fallbackRequirements) ? fallbackRequirements : []);

  return {
    requirements: resolvedList,
    rawRecord: record,
    loading
  };
}

export default useSubmittedRequirements;
