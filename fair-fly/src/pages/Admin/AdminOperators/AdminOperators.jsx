import React, { useState } from 'react'; // Added useState
import './admin-operators.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import OperatorForm from '../../../components/AdminComponents/Modals/OperatorForm';

const OPERATORS = [
  { branch: 'Baliuag Branch', username: 'baliuag_operator', status: 'Active', services: 45 },
];

export default function AdminOperators() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateOperatorSubmit = (newOperatorData) => {
    console.log('New Operator Account Data:', newOperatorData);
    // Handle API processing here
    setIsModalOpen(false);
  };

  return (
    <div className="card operators-page">
      <div className="operators-header">
        <div>
          <h2>Page Management</h2>
          <p>Create and manage franchise operator accounts</p>
        </div>

        {/* Trigger button */}
        <button className="operator-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fa-solid fa-user-plus"></i>
          Add Operator
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
                <button className="icon-btn ban" title="Disable">
                  <i className="fa-solid fa-ban"></i>
                </button>
                <button className="icon-btn delete" title="Delete">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Render the Operator Modal */}
      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Operator Account"
        subtitle="Add a new franchise operator account"
      >
        <OperatorForm onSubmit={handleCreateOperatorSubmit} />
      </ModalWrapper>
    </div>
  );
}