import { useState } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './create-inquiry-form-modal.css';

const SERVICES_OFFERED = ['PSA', 'Passport', 'VISA Assistance', 'Package Tour', 'Ticket', 'Others'];

const todayIso = new Date().toISOString().split('T')[0];

export default function CreateInquiryFormModal({ onClose }) {
  const [form, setForm] = useState({
    formNo: '',
    controlNo: '',
    clientName: '',
    population: '',
    address: '',
    telNo: '',
    contactPerson: '',
    cellphone: '',
    email: '',
    contractNo: '',
    isNo: '',
    dateInquired: todayIso,
    servicesOffered: [],
    requirements: '',
    remarks: '',
    agentName: '',
    agentSignature: '',
    acknowledgedBy: '',
    acknowledgedSignature: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (service) => {
    setForm((prev) => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter((s) => s !== service)
        : [...prev.servicesOffered, service],
    }));
  };

  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!form.clientName || !form.cellphone) {
      addToast('Client name and cellphone number are required', 'error');
      return;
    }

    const payload = {
      fullName: form.clientName,
      phoneNumber: form.cellphone,
      email: form.email,
      serviceType: form.servicesOffered.join(', ') || 'General Inquiry',
      notes: form.requirements + (form.remarks ? ` | Remarks: ${form.remarks}` : ''),
      formNo: form.formNo,
      controlNo: form.controlNo,
      address: form.address,
      contactPerson: form.contactPerson,
      agentName: form.agentName,
      acknowledgedBy: form.acknowledgedBy
    };

    ApiCaller(
      `${API_BASE_URL}/api/inquiries`,
      'POST',
      payload,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Inquiry form created successfully', 'success');
        onClose();
      },
      (error) => {
        addToast(`Failed to create inquiry: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="56rem"
      title="Create New Inquiry Form"
      subtitle="Fill out the form details for client inquiry documentation"
    >
      <div className="cif-body-content">
        {/* Form No / Control No */}
        <div className="cif-row2">
          <div className="cif-field">
            <label>Form No. <span>*</span></label>
            <input name="formNo" placeholder="e.g., SAF-01-001" value={form.formNo} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Control No. <span>*</span></label>
            <input name="controlNo" placeholder="e.g., 26-059" value={form.controlNo} onChange={handleChange} />
          </div>
        </div>

        {/* ── Client Information ── */}
        <h3 className="cif-section-title">Client Information</h3>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Name of Client/Company <span>*</span></label>
            <input name="clientName" placeholder="Client or company name" value={form.clientName} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Population</label>
            <input name="population" placeholder="Population information" value={form.population} onChange={handleChange} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Address <span>*</span></label>
            <input name="address" placeholder="Complete address" value={form.address} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Tel No.</label>
            <input name="telNo" placeholder="Telephone number" value={form.telNo} onChange={handleChange} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Contact Person <span>*</span></label>
            <input name="contactPerson" placeholder="Contact person name" value={form.contactPerson} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Cellphone No. <span>*</span></label>
            <input name="cellphone" placeholder="+63 912 345 6789" value={form.cellphone} onChange={handleChange} />
          </div>
        </div>

        <div className="cif-row3">
          <div className="cif-field">
            <label>E-mail Address <span>*</span></label>
            <input name="email" type="email" placeholder="email@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Contract No.</label>
            <input name="contractNo" placeholder="Contract number" value={form.contractNo} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>I.S. No.</label>
            <input name="isNo" placeholder="I.S. number" value={form.isNo} onChange={handleChange} />
          </div>
        </div>

        <div className="cif-field cif-field-half">
          <label>Date Inquired <span>*</span></label>
          <input name="dateInquired" type="date" value={form.dateInquired} onChange={handleChange} />
        </div>

        {/* ── Services and Requirements ── */}
        <h3 className="cif-section-title">Services and Requirements</h3>

        <div className="cif-field">
          <label>Services Offered <span>*</span></label>
          <div className="cif-checkboxes">
            {SERVICES_OFFERED.map((s) => (
              <label key={s} className="cif-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.servicesOffered.includes(s)}
                  onChange={() => handleCheckbox(s)}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div className="cif-field">
          <label>Specified Requirements of Client <span>*</span></label>
          <textarea
            name="requirements"
            placeholder="Enter specific requirements and details..."
            value={form.requirements}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="cif-field">
          <label>Remarks</label>
          <textarea
            name="remarks"
            placeholder="Additional remarks or notes..."
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="cif-textarea-light"
          />
        </div>

        {/* ── Signatures ── */}
        <h3 className="cif-section-title">Signatures</h3>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Agent Name <span>*</span></label>
            <input name="agentName" placeholder="Agent name" value={form.agentName} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Agent Signature</label>
            <input name="agentSignature" placeholder="Digital signature or initials" value={form.agentSignature} onChange={handleChange} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Acknowledged By <span>*</span></label>
            <input name="acknowledgedBy" placeholder="Supervisor/Manager name" value={form.acknowledgedBy} onChange={handleChange} />
          </div>
          <div className="cif-field">
            <label>Signature</label>
            <input name="acknowledgedSignature" placeholder="Digital signature or initials" value={form.acknowledgedSignature} onChange={handleChange} />
          </div>
        </div>

        {/* Actions */}
        <div className="cif-actions">
          <button className="cif-btn-submit" onClick={handleSubmit}>
            <i className="fa-solid fa-file-pen"></i>
            Create Inquiry Form
          </button>
          <button className="cif-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </BaseModal>
  );
}
