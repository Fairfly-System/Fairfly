import './admin-operators.css';

const OPERATORS = [
  { branch: 'Manila Branch', username: 'manila_operator', status: 'Active', services: 45 },
  { branch: 'Cebu Branch', username: 'cebu_operator', status: 'Active', services: 32 },
  { branch: 'Davao Branch', username: 'davao_operator', status: 'Active', services: 28 },
];

export default function AdminOperators() {
  return (
    <div className="card operators-page">
      <div className="operators-header">
        <div>
          <h2>Operator Management</h2>
          <p>Create and manage franchise operator accounts</p>
        </div>

        <button className="operator-btn">
          <i className="fa-solid fa-user-plus"></i>
          Create Operator
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Branch Name</th>
            <th>Username</th>
            <th>Status</th>
            <th>Services Handled</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>

        <tbody>
          {OPERATORS.map((op) => (
            <tr key={op.username}>
              <td>{op.branch}</td>
              <td>{op.username}</td>
              <td><span className="operator-badge">{op.status}</span></td>
              <td>{op.services} services</td>
              <td className="actions-col">
                <button className="icon-btn ban" title="Disable operator">
                  <i className="fa-solid fa-ban"></i>
                </button>
                <button className="icon-btn delete" title="Delete operator">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}