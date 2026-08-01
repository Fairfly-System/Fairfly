import './stat-cards.css';

export default function StatCards({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#374151',
  subtitleColor
}) {
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <h4>{title}</h4>
        {icon && (
          <i className={icon} style={{ color: iconColor }}></i>
        )}
      </div>

      <h2>{value}</h2>

      <p style={subtitleColor ? { color: subtitleColor } : undefined}>{subtitle}</p>
    </div>
  );
}