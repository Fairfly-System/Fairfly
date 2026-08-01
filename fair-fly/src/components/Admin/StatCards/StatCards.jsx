import './stat-cards.css';

/**
 * StatCards — enriched KPI card.
 *
 * Props:
 *  title       {string}  — card heading
 *  value       {string|number} — primary metric
 *  detail      {string}  — secondary descriptor below the value
 *  icon        {string}  — FontAwesome class string
 *  iconColor   {string}  — hex / css color for icon & bubble tint
 *  badge       {string}  — optional small pill text (e.g. "3 Disabled")
 *  badgeType   {'ok'|'warn'|'error'|'info'|'neutral'} — pill variant
 *  trend       {{ label: string, direction: 'up'|'down'|'neutral' }} — optional trend row
 */
export default function StatCards({
  title,
  value,
  detail,
  icon,
  iconColor = '#374151',
  badge,
  badgeType = 'neutral',
  trend,
}) {
  const trendSymbol =
    trend?.direction === 'up' ? '↑'
    : trend?.direction === 'down' ? '↓'
    : '—';

  const trendClass =
    trend?.direction === 'up' ? 'stat-trend--up'
    : trend?.direction === 'down' ? 'stat-trend--down'
    : 'stat-trend--neutral';

  return (
    <div className="card stat-card">
      {/* Top row — title + icon bubble */}
      <div className="stat-card-top">
        <h4 className="stat-title">{title}</h4>
        {icon && (
          <div
            className="stat-icon-bubble"
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
      <h2 className="stat-value">{value}</h2>

      {/* Detail + badge row */}
      <div className="stat-footer">
        {detail && <p className="stat-detail">{detail}</p>}
        {badge && (
          <span className={`stat-badge stat-badge--${badgeType}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Trend row */}
      {trend && (
        <div className={`stat-trend ${trendClass}`}>
          <span className="stat-trend-symbol">{trendSymbol}</span>
          <span className="stat-trend-label">{trend.label}</span>
        </div>
      )}
    </div>
  );
}