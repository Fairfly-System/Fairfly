import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import './admin-operators.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import OperatorForm from '../../../components/AdminComponents/Modals/OperatorForm';
import { createOperator, getOperators, deleteOperator } from '../../../services/franchiseService';

export default function AdminOperators() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load operators on component mount
  useEffect(() => {
    loadOperators();
  }, []);

  const loadOperators = async () => {
    try {
      setLoading(true);
      const ops = await getOperators();
      setOperators(ops);
    } catch (error) {
      console.error('Error loading operators:', error);
      // Keep empty array if error occurs
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperatorSubmit = async (newOperatorData) => {
    try {
      await createOperator(newOperatorData);
      // Refresh operators list
      await loadOperators();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating operator:', error);
      alert('Failed to create operator: ' + error.message);
    }
  };

  const handleDeleteOperator = async (operatorId) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      try {
        await deleteOperator(operatorId);
        await loadOperators(); // Refresh list
      } catch (error) {
        console.error('Error deleting operator:', error);
        alert('Failed to delete operator: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="card operators-page">
        <div className="operators-header">
          <div>
            <h2>Page Management</h2>
            <p>Loading operator accounts...</p>
          </div>
        </div>
      </div>
    );
  }

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
          {operators.length === 0 ? (
            <tr>
              <td colSpan="5">No operators found</td>
            </tr>
          ) : (
            operators.map((op) => (
              <tr key={op.id}>
                <td>{op.branchName || 'N/A'}</td>
                <td>{op.username}</td>
                <td><span className="operator-badge">{op.status}</span></td>
                <td>{op.servicesHandled || 0} services</td>
                <td className="actions-col">
                  <button className="icon-btn ban" title="Disable">
                    <i className="fa-solid fa-ban"></i>
                  </button>
                  <button className="icon-btn delete" title="Delete" onClick={() => handleDeleteOperator(op.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
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