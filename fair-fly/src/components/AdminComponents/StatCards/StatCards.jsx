import './stats-cards.css';

export default function StatCards({
  title,
  value,
  subtitle,
  icon
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <h4>{title}</h4>

        {icon && (
          <div className="stat-card-icon">
            {icon}
          </div>
        )}
      </div>

      <h2>{value}</h2>

      <p>{subtitle}</p>
    </div>
  );
}