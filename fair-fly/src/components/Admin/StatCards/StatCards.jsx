import React from 'react';
import KpiCard from '../../UI/KpiCard/KpiCard';

/**
 * StatCards — legacy wrapper for backward compatibility, delegating to unified KpiCard.
 */
export default function StatCards(props) {
  return <KpiCard {...props} />;
}