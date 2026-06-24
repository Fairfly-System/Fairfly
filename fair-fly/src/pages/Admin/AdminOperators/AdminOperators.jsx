import './admin-operators.css';

export default function AdminOperators() {
  return (
    <div className="card operators-page">
      <div className="operators-header">
        <div>
          <h2>Operator Management</h2>
          <p>Create and manage operators</p>
        </div>

        <button className="operator-btn">
          Create Operator
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Branch</th>
            <th>Username</th>
            <th>Status</th>
            <th>Services</th>
          </tr>
        </thead>
      </table>
    </div>
  );
}