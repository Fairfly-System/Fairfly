import './admin-services.css';

export default function AdminServices() {
  return (
    <div className="card services-page">
      <div className="services-header">
        <div>
          <h2>Service Management</h2>
          <p>Create, update, or delete services</p>
        </div>

        <button className="service-btn">
          Add Service
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Price</th>
            <th>Processing Time</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>PSA Birth Certificate</td>
            <td>₱365</td>
            <td>7-10 days</td>
            <td><span className="admin-badge">Active</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}