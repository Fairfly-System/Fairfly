import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import './admin-operators.css';
import {firestore, storage} from '../../../firebase';
import { onSnapshot, collection} from 'firebase/firestore';
import { useToast } from '../../../components/toast/ToastProvider';
import {useAuthContext} from '../../../context/AuthContext';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import OperatorForm from '../../../components/AdminComponents/Modals/OperatorForm';
import { createOperator, getOperators, deleteOperator } from '../../../services/franchiseService';

export default function AdminOperators() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state

  //subscribe to the operators collection in Firestore and update the state when changes occur
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {

        // Filter only operators from the users collection
        const operators = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.role === 'operator');
        setOperators(operators);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCreateOperatorSubmit = async (newOperatorData) => {
    try {
      setIsSubmitting(true); // Set submission state to true
      // Post the new operator data to the backend
      const response = await fetch("http://localhost:5001/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}` // Include the token in the Authorization header
        },
        body: JSON.stringify(newOperatorData),
      });
      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(errorText.statusMessage || 'Failed to create operator');
      }
      addToast('Operator created successfully!', 'success');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating operator:', error);
      addToast('Failed to create operator: ' + error.message, 'error');
      setIsModalOpen(false); // Close modal on error
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  const handleDeleteOperator = async (operatorId) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      try {
        // Send a DELETE request to the backend to delete the operator
        const response = await fetch(`http://localhost:5001/api/operators/${operatorId}`, {
          method: 'DELETE',
          headers: {
            "Authorization": `Bearer ${userToken}` // Include the token in the Authorization header
          },
        });
        if (!response.ok) {
          throw new Error('Failed to delete operator: ' + response.error);
        }
        addToast('Operator deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting operator:', error);
        addToast('Failed to delete operator: ' + error.message, 'error');
        setIsModalOpen(false); // Close modal on error
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
            <th>Email</th>
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
                <td>{op.email || 'N/A'}</td>
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
        <OperatorForm onSubmit={handleCreateOperatorSubmit} isLoading={isSubmitting} />
      </ModalWrapper>
    </div>
  );
}