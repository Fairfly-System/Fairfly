import { useState } from 'react';
import CreateInquiryFormModal from '../../../components/OperatorComponents/CreateInquiryFormModal/CreateInquiryFormModal';
import './operator-inquiry-forms.css';

export default function OperatorInquiryForms() {

  const [showModal, setShowModal] = useState(false);

  return (
    <div className="card op-inquiry">
      <div className="op-inquiry-header">
        <div className="op-inquiry-title">
          <i className="fa-solid fa-file-pen" style={{ color: '#5b63ff' }}></i>
          <div>
            <h2>Inquiry Forms</h2>
            <p>Create and manage client inquiry forms</p>
          </div>
        </div>
        <button className="op-inquiry-btn" onClick={() => setShowModal(true)} >
          <i className="fa-solid fa-plus"></i>
          Create Inquiry Form
        </button>
      </div>

      {showModal && <CreateInquiryFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
