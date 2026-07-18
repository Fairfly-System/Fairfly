import React, { useState, useEffect } from 'react';
import './admin-services.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import ServiceForm from '../../../components/AdminComponents/Modals/ServiceForm';
import { createService, getServices, deleteService } from '../../../services/franchiseService';
import {firestore, storage} from '../../../firebase';
import { onSnapshot, collection} from 'firebase/firestore';
import {useAuthContext} from '../../../context/AuthContext';
import { useToast } from '../../../components/toast/ToastProvider';

export default function AdminServices() {
  const { userToken } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Track form submission state
  const [deleting, setDeleting] = useState(null); // Track which service is being deleted
  const { addToast } = useToast();
  //Subscribe to the services collection in Firestore and update the state when changes occur
  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(firestore, "services"),
    (snapshot) => {
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setServices(services);
      setLoading(false);
    },
    (error) => {
      console.error(error);
      setLoading(false);
    }
  );
    return () => unsubscribe();
  }, []);

  // Handle form submission logic
  const handleAddServiceSubmit = async (newServiceData) => {
    setIsSubmitting(true); // Set submission state to true
    try {
      //Post the new service data to the backend
      const response = await fetch("http://localhost:5001/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}` // Include the token in the Authorization header
        },
        body: JSON.stringify(newServiceData),
      });
      if (!response.ok) {
        let errorText = await response.json();
        throw new Error(errorText.statusText || 'Failed to add service');
      }
      console.log(response);
      addToast('Service added successfully!', 'success');
      setIsModalOpen(false); // Close modal on successful submission
    } catch (error) {
      addToast('Failed to add service: ' + error, 'error');
      console.error('Error adding service:', error);
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        //Call the deleteService function and pass the serviceId to it
        const response = await fetch(`http://localhost:5001/api/services/${serviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}` // Include the token in the Authorization header
          }
        });
        if (!response.ok) {
          let errorText = await response.json();
          throw new Error(errorText.statusText || 'Failed to delete service');
        }
        console.log(response);
        addToast('Service deleted successfully!', 'success');
        setServices(prevServices => prevServices.filter(service => service.id !== serviceId));
        setDeleting(null); // Reset deleting state after deletion
      } catch (error) {
        console.error('Error deleting service:', error);
        addToast('Failed to delete service: ' + error.message, 'error');
      } finally {
        setDeleting(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="card services-page">
        <div className="services-header">
          <div>
            <h2>Service Management</h2>
            <p>Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card services-page">
      <div className="services-header">
        <div>
          <h2>Service Management</h2>
          <p>Create, update, or delete services</p>
        </div>

        <button className="service-btn" onClick={() => setIsModalOpen(true)}>
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
          {services.length === 0 ? (
            <tr>
              <td colSpan="5">No services found</td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>PHP {service.price}</td>
                <td>{service.processingTime} days</td>
                <td><span className="service-badge">{service.status}</span></td>
                <td className="actions-col">
                  <button className="icon-btn edit" title="Edit">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button
                    className="icon-btn delete"
                    title="Delete"
                    onClick={() => handleDeleteService(service.id)}
                    disabled={deleting === service.id}
                  >
                    {deleting === service.id ? 'Deleting...' : <i className="fa-solid fa-trash"></i>}
                  </button>
                  <button className="icon-btn clipboard" title="View details">
                    <i className="fa-solid fa-clipboard-list"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <ModalWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Service"
        subtitle="Create a new service offering"
      >
        <ServiceForm onSubmit={handleAddServiceSubmit} isLoading={isSubmitting} />
      </ModalWrapper>
    </div>
  );
}