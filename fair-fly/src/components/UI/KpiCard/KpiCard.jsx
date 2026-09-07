import React from 'react';
import './kpi-card.css';

/**
 * KpiCard — unified reusable KPI/stat card.
 *
 * Props:
 *  title       {string}        — card heading
 *  value       {string|number} — primary metric
 *  detail      {string}        — secondary descriptor below the value
 *  icon        {string}        — FontAwesome class string
 *  iconColor   {string}        — hex / css color for icon & bubble tint
 *  badge       {string}        — optional small pill text (e.g. "3 Disabled")
 *  badgeType   {'ok'|'warn'|'error'|'info'|'neutral'} — pill variant
 *  trend       {{ label: string, direction: 'up'|'down'|'neutral' }} — optional trend row
 */
export default function KpiCard({
  title,
  value,
  detail,
  icon,
  iconColor = '#374151',
  badge,
  badgeType = 'neutral',
  trend,
  isLoading = false,
  loading = false,
}) {
  const isKpiLoading = isLoading || loading;

  if (isKpiLoading) {
    return (
      <div className="card kpi-card" aria-busy="true">
        <div className="kpi-card-top">
          <div className="skeleton skeleton-text" style={{ width: '50%', height: '0.875rem', margin: 0 }} />
          <div className="skeleton skeleton-circle" style={{ width: '2.25rem', height: '2.25rem' }} />
        </div>
        <div className="skeleton" style={{ width: '45%', height: '2rem', borderRadius: 'var(--radius-sm)', margin: '0.5rem 0' }} />
        <div className="kpi-footer">
          <div className="skeleton skeleton-text" style={{ width: '60%', height: '0.75rem', margin: 0 }} />
        </div>
      </div>
    );
  }

  const trendSymbol =
    trend?.direction === 'up' ? '↑'
    : trend?.direction === 'down' ? '↓'
    : '—';

  const trendClass =
    trend?.direction === 'up' ? 'kpi-trend--up'
    : trend?.direction === 'down' ? 'kpi-trend--down'
    : 'kpi-trend--neutral';

  return (
    <div className="card kpi-card">
      {/* Top row — title + icon bubble */}
      <div className="kpi-card-top">
        <h4 className="kpi-title">{title}</h4>
        {icon && (
          <div
            className="kpi-icon-bubble"
            style={{
              background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${iconColor} 20%, transparent)`,
            }}
          >
            <i className={icon} style={{ color: iconColor }} />
          </div>
        )}
      </div>

      {/* Primary metric */}
      <h2 className="kpi-value">{value}</h2>

      {/* Detail + badge row */}
      <div className="kpi-footer">
        {detail && <p className="kpi-detail">{detail}</p>}
        {badge && (
          <span className={`kpi-badge kpi-badge--${badgeType}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Trend row */}
      {trend && (
        <div className={`kpi-trend ${trendClass}`}>
          <span className="kpi-trend-symbol">{trendSymbol}</span>
          <span className="kpi-trend-label">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
