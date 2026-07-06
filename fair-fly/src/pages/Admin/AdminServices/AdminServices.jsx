import React, { useState, useEffect } from 'react';
import './admin-services.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper';
import ServiceForm from '../../../components/AdminComponents/Modals/ServiceForm';
import { createService, getServices, deleteService } from '../../../services/franchiseService';

export default function AdminServices() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // Track which service is being deleted

  // Load services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const svcs = await getServices();
      setServices(svcs);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission logic
  const handleAddServiceSubmit = async (newServiceData) => {
    try {
      await createService(newServiceData);
      // Refresh services list
      await loadServices();
      setIsModalOpen(false); // Close modal on successful submission
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service: ' + error.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        setDeleting(serviceId);
        await deleteService(serviceId);
        await loadServices(); // Refresh list
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service: ' + error.message);
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
                <td>{service.price}</td>
                <td>{service.time}</td>
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
        <ServiceForm onSubmit={handleAddServiceSubmit} />
      </ModalWrapper>
    </div>
  );
}