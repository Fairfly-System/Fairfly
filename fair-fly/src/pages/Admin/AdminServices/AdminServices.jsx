import React, { useState } from 'react'; // 1. Added useState
import './admin-services.css';
import ModalWrapper from '../../../components/AdminComponents/Modals/ModalWrapper'; // 2. Import the wrapper
import ServiceForm from '../../../components/AdminComponents/Modals/ServiceForm';

const SERVICES = [
  { name: 'PSA Birth Certificate', price: '₱365', time: '7-10 days', status: 'Active' },
  { name: 'Passport Processing', price: '₱1,200', time: '12-15 days', status: 'Active' },
  { name: 'VISA Assistance', price: '₱5,000', time: '15-30 days', status: 'Active' },
  { name: 'Package Tour - Boracay', price: '₱12,000', time: 'Varies', status: 'Active' },
  { name: 'Airline Tickets', price: 'Varies', time: 'Instant', status: 'Active' },
];

export default function AdminServices() {

  // 3. Define state to handle modal opening and closing
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 4. Handle form submission logic
  const handleAddServiceSubmit = (newServiceData) => {
    console.log('New Service Data:', newServiceData);
    // You can handle your API calls here or update your state array
    
    setIsModalOpen(false); // Close modal on successful submission
  };

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
          {SERVICES.map((service) => (
            <tr key={service.name}>
              <td>{service.name}</td>
              <td>{service.price}</td>
              <td>{service.time}</td>
              <td><span className="service-badge">{service.status}</span></td>
              <td className="actions-col">
                <button className="icon-btn edit" title="Edit">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button className="icon-btn delete" title="Delete">
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