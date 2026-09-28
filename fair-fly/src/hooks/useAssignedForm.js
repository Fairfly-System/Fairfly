import { useEffect, useState } from 'react';
import { resolveForm } from '../services/formService';

export default function useAssignedForm(actionKey, enabled = true) {
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    if (!enabled || !actionKey) return undefined;
    let cancelled = false;
    resolveForm(actionKey)
      .then((form) => {
        if (!cancelled) setSchema(form);
      })
      .catch(() => {
        if (!cancelled) setSchema(null);
      });
    return () => { cancelled = true; };
  }, [actionKey, enabled]);

  return schema;
}