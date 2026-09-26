import { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { fetchServices } from '../../../services/serviceService';
import { createInquiry } from '../../../services/inquiryService';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './create-inquiry-form-modal.css';

const todayIso = new Date().toISOString().split('T')[0];

const OFFICIAL_SERVICES = [
  'NSO',
  'Passport',
  'VISA Assistance',
  'Package Tour',
  'Ticket',
  'Others'
];

export default function CreateInquiryFormModal({ onClose }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    formNo: 'SAF-01-002',
    controlNo: `23-${Math.floor(100 + Math.random() * 900)}`,
    clientName: '',
    contactPerson: '',
    cellphone: '',
    email: '',
    address: '',
    telNo: '',
    population: '',
    contractNo: '',
    isNo: '',
    dateInquired: todayIso,
    servicesOffered: ['Package Tour'],
    serviceId: '',
    serviceType: 'Package Tour',
    servicePrice: '',
    specifiedRequirements: '',
    remarks: '',
    agentName: userDetails?.name || userDetails?.fullName || 'Operator',
    agentSignature: '',
    acknowledgedBy: '',
    acknowledgedSignature: '',
    customFields: {}
  });

  useEffect(() => {
    setLoadingServices(true);
    const branchUid = userDetails?.role === 'operator' ? user?.uid : null;

    fetchServices(
      branchUid,
      (services) => {
        const activeOnly = Array.isArray(services) ? services.filter(s => s.status === 'Active') : [];
        setActiveServices(activeOnly);
        setLoadingServices(false);
      },
      (err) => {
        console.error('Error loading active services for inquiry modal:', err);
        setLoadingServices(false);
      }
    );
  }, [user?.uid, userDetails?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleService = (srv) => {
    setForm((prev) => {
      const current = prev.servicesOffered || [];
      const updated = current.includes(srv)
        ? current.filter((s) => s !== srv)
        : [...current, srv];
      return {
        ...prev,
        servicesOffered: updated,
        serviceType: updated.join(', ')
      };
    });
  };

  const handleCatalogServiceSelect = (e) => {
    const selectedServiceId = e.target.value;
    if (!selectedServiceId) {
      return;
    }

    const matched = activeServices.find((s) => s.id === selectedServiceId);
    if (matched) {
      setForm((prev) => {
        const current = prev.servicesOffered || [];
        const updated = current.includes(matched.name) ? current : [...current, matched.name];
        return {
          ...prev,
          serviceId: matched.id,
          servicePrice: matched.price || (matched.baseFee ? `PHP ${matched.baseFee}` : ''),
          servicesOffered: updated,
          serviceType: updated.join(', ')
        };
      });
    }
  };

  const isFormValid = Boolean(
    form.clientName.trim() &&
    (form.cellphone.trim() || form.email.trim()) &&
    ((form.servicesOffered || []).length > 0 || form.serviceType.trim()) &&
    form.specifiedRequirements.trim()
  );

  const handleSubmit = () => {
    if (!form.clientName.trim()) {
      addToast('Client or Company name is required', 'error');
      return;
    }
    if (!form.cellphone.trim() && !form.email.trim()) {
      addToast('Please provide at least a cellphone number or email', 'error');
      return;
    }
    if ((form.servicesOffered || []).length === 0) {
      addToast('Please select at least one service offered checkbox', 'error');
      return;
    }
    if (!form.specifiedRequirements.trim()) {
      addToast('Please enter the Specified Requirements of Client', 'error');
      return;
    }

    const payload = {
      ...form,
      formNo: 'SAF-01-002',
      branchUid: (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator') ? user?.uid : null,
      branchName: userDetails?.branchName || userDetails?.name || 'Branch Office',
      status: 'submitted',
      notes: form.remarks
    };

    setIsSubmitting(true);
    createInquiry(
      userToken,
      payload,
      () => {
        setIsSubmitting(false);
        addToast('Official Inquiry Form (SAF-01-002) recorded successfully', 'success');
        onClose();
      },
      (error) => {
        setIsSubmitting(false);
        addToast(toFriendlyMessage(error, 'Failed to create inquiry form'), 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="58rem"
      title="Official Service Inquiry Intake Form (SAF-01-002)"
      subtitle="Intake client specifications and requirements for custom travel or document services"
      isLoading={isSubmitting}
    >
      <div className="cif-body-content">
        <div className="cif-row2">
          <div className="cif-field">
            <label>Form No. <span>*</span></label>
            <input name="formNo" value={form.formNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Control No. <span>*</span></label>
            <input name="controlNo" placeholder="e.g., 23-001" value={form.controlNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <h3 className="cif-section-title">
          <i className="fa-solid fa-user"></i> 1. Client Information
        </h3>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Name of Client / Company <span>*</span></label>
            <input name="clientName" placeholder="Client or company name" value={form.clientName} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Contact Person</label>
            <input name="contactPerson" placeholder="Contact person name" value={form.contactPerson} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Cellphone No. <span>*</span></label>
            <input name="cellphone" placeholder="+63 912 345 6789" value={form.cellphone} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>E-mail Address</label>
            <input name="email" type="email" placeholder="client@example.com" value={form.email} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Complete Address <span>*</span></label>
            <input name="address" placeholder="Unit / Street / City" value={form.address} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Telephone No.</label>
            <input name="telNo" placeholder="Landline telephone" value={form.telNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-row3">
          <div className="cif-field">
            <label>Population / Pax Count</label>
            <input name="population" placeholder="e.g. 45 persons" value={form.population} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Contract No.</label>
            <input name="contractNo" placeholder="Contract number" value={form.contractNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>I.S. No.</label>
            <input name="isNo" placeholder="I.S. number" value={form.isNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-field cif-field-half">
          <label>Date Inquired <span>*</span></label>
          <input name="dateInquired" type="date" value={form.dateInquired} onChange={handleChange} disabled={isSubmitting} />
        </div>

        <h3 className="cif-section-title">
          <i className="fa-solid fa-list-check"></i> 2. Services Offered (SAF-01-002)
        </h3>

        <div className="cif-services-grid">
          {OFFICIAL_SERVICES.map((srv) => {
            const isChecked = (form.servicesOffered || []).includes(srv);
            return (
              <label key={srv} className={`cif-service-check-card ${isChecked ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleService(srv)}
                />
                <span>{srv}</span>
              </label>
            );
          })}
        </div>

        {activeServices.length > 0 && (
          <div className="cif-field cif-field-mb">
            <label>Link Active Catalog Service (Optional)</label>
            <select
              value={form.serviceId}
              onChange={handleCatalogServiceSelect}
              disabled={isSubmitting || loadingServices}
            >
              <option value="">-- Associate with an active catalog service --</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.price || (s.baseFee ? 'PHP ' + s.baseFee : 'Standard')}
                </option>
              ))}
            </select>
          </div>
        )}

        <h3 className="cif-section-title">
          <i className="fa-solid fa-clipboard-list"></i> 3. Specified Requirements of Client <span>*</span>
        </h3>
        <p className="cif-help-text">
          What does the client want? Describe vehicles, passenger count, itinerary, destinations, target tour dates, lodging preferences, and specific requests.
        </p>
        <div className="cif-field">
          <textarea
            name="specifiedRequirements"
            placeholder={`• (1) Unit Tourist Bus (49 Regular seats, audio/video entertainment)\n• 3D/2N Tour: QC - Bolinao - Alaminos - QC\n• Target Tour Dates: April 29 to May 1`}
            value={form.specifiedRequirements}
            onChange={handleChange}
            rows={5}
            className="cif-textarea-light"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="cif-field cif-field-mt">
          <label>Remarks & Notes</label>
          <textarea
            name="remarks"
            placeholder="Payment terms, special considerations, or branch notes..."
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="cif-textarea-light"
            disabled={isSubmitting}
          />
        </div>

        <h3 className="cif-section-title">
          <i className="fa-solid fa-signature"></i> 4. Signatures & Authorizations
        </h3>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Agent / Operator Name <span>*</span></label>
            <input name="agentName" placeholder="Agent name" value={form.agentName} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Agent Signature</label>
            <input name="agentSignature" placeholder="Digital signature or initials" value={form.agentSignature} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Acknowledged By</label>
            <input name="acknowledgedBy" placeholder="Supervisor / Manager name" value={form.acknowledgedBy} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Supervisor Signature</label>
            <input name="acknowledgedSignature" placeholder="Digital signature or initials" value={form.acknowledgedSignature} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-actions">
          <button className="cif-btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="cif-btn-submit" onClick={handleSubmit} disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Recording Inquiry...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pen"></i>
                <span>Record Official Inquiry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
