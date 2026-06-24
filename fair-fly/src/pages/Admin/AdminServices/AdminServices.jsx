import './admin-services.css';

const SERVICES = [
  { name: 'PSA Birth Certificate', price: '₱365', time: '7-10 days', status: 'Active' },
  { name: 'Passport Processing', price: '₱1,200', time: '12-15 days', status: 'Active' },
  { name: 'VISA Assistance', price: '₱5,000', time: '15-30 days', status: 'Active' },
  { name: 'Package Tour - Boracay', price: '₱12,000', time: 'Varies', status: 'Active' },
  { name: 'Airline Tickets', price: 'Varies', time: 'Instant', status: 'Active' },
];

export default function AdminServices() {
  return (
    <div className="card services-page">
      <div className="services-header">
        <div>
          <h2>Service Management</h2>
          <p>Create, update, or delete services</p>
        </div>

        <button className="service-btn">
          <i className="fa-solid fa-plus"></i>
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
            <th className="actions-col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {SERVICES.map((service) => (
            <tr key={service.name}>
              <td>{service.name}</td>
              <td>{service.price}</td>
              <td>{service.time}</td>
              <td><span className="service-badge">{service.status}</span></td>
              <td className="actions-col">
                <button className="icon-btn edit" title="Edit service">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button className="icon-btn delete" title="Delete service">
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button className="icon-btn clipboard" title="View details">
                  <i className="fa-solid fa-clipboard-list"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}