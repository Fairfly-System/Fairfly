import './admin-quick-links.css';

export default function AdminQuickLinks() {
  return (
    <div className="card quicklinks-page">
      <div className="quicklinks-header">
        <div className="quicklinks-heading">
          <i className="fa-solid fa-link"></i>
          <div>
            <h2>Quick Links for Operators</h2>
            <p>Manage website links that operators can access</p>
          </div>
        </div>

        <button className="quicklinks-btn">
          <i className="fa-solid fa-plus"></i>
          Add Link
        </button>
      </div>

    </div>
  );
}
