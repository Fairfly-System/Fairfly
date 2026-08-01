import './alert-bar.css';

export default function AlertBar({ message, type = 'info' }) {
  return (
    <div className={`alert-bar ${type}`}>
      <i className={`fa-solid fa-${type === 'info' ? 'info-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}`}></i>
      <span className="alert-message">{message}</span>
    </div>
  );
}