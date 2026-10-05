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
    clientType: 'individual',
    companyName: '',
    firstName: '',
    middleInitial: '',
    lastName: '',
    contactPersonFirstName: '',
    contactPersonMiddleInitial: '',
    contactPersonLastName: '',
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
        const activeOnly = Array.isArray(services)
          ? services.filter(s => s.status === 'Active' && Array.isArray(s.workflowIds) && s.workflowIds.length > 0)
          : [];
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
    (form.clientType === 'company'
      ? (form.companyName.trim() && form.contactPersonFirstName.trim() && form.contactPersonLastName.trim())
      : (form.firstName.trim() && form.lastName.trim())) &&
    (form.cellphone.trim() || form.email.trim()) &&
    ((form.servicesOffered || []).length > 0 || form.serviceType.trim()) &&
    form.specifiedRequirements.trim()
  );

  const handleSubmit = () => {
    if (form.clientType === 'company') {
      if (!form.companyName.trim()) {
        addToast('Company name is required', 'error');
        return;
      }
      if (!form.contactPersonFirstName.trim()) {
        addToast('Contact person first name is required', 'error');
        return;
      }
      if (!form.contactPersonLastName.trim()) {
        addToast('Contact person last name is required', 'error');
        return;
      }
    } else {
      if (!form.firstName.trim()) {
        addToast('First name is required', 'error');
        return;
      }
      if (!form.lastName.trim()) {
        addToast('Last name is required', 'error');
        return;
      }
    }

    if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      addToast('A valid E-mail Address is mandatory for all inquiries', 'error');
      return;
    }
    if (!form.cellphone?.trim()) {
      addToast('Please provide a cellphone number', 'error');
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

    const canonicalClientName = form.clientType === 'company'
      ? form.companyName.trim()
      : [form.firstName.trim(), form.middleInitial.trim(), form.lastName.trim()].filter(Boolean).join(' ');

    const canonicalContactPerson = form.clientType === 'company'
      ? [form.contactPersonFirstName.trim(), form.contactPersonMiddleInitial.trim(), form.contactPersonLastName.trim()].filter(Boolean).join(' ')
      : (form.contactPerson.trim() || canonicalClientName);

    const payload = {
      ...form,
      clientType: form.clientType,
      companyName: form.clientType === 'company' ? form.companyName.trim() : '',
      clientName: canonicalClientName,
      firstName: (form.clientType === 'company' ? form.contactPersonFirstName : form.firstName).trim(),
      middleInitial: (form.clientType === 'company' ? form.contactPersonMiddleInitial : form.middleInitial).trim(),
      lastName: (form.clientType === 'company' ? form.contactPersonLastName : form.lastName).trim(),
      contactPerson: canonicalContactPerson,
      contactPersonFirstName: (form.clientType === 'company' ? form.contactPersonFirstName : form.firstName).trim(),
      contactPersonMiddleInitial: (form.clientType === 'company' ? form.contactPersonMiddleInitial : form.middleInitial).trim(),
      contactPersonLastName: (form.clientType === 'company' ? form.contactPersonLastName : form.lastName).trim(),
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
      maxWidth="72rem"
      width="95%"
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

        {/* Client Type Selector */}
        <div className="cif-type-selector">
          <span className="cif-type-label">
            <i className="fa-solid fa-sliders"></i> Client Type:
          </span>
          <div className="cif-type-options">
            <button
              type="button"
              className={`cif-type-btn ${form.clientType === 'individual' ? 'active' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, clientType: 'individual' }))}
            >
              <i className="fa-solid fa-user"></i>
              <span>Individual</span>
            </button>
            <button
              type="button"
              className={`cif-type-btn ${form.clientType === 'company' ? 'active' : ''}`}
              onClick={() => setForm((prev) => ({ ...prev, clientType: 'company' }))}
            >
              <i className="fa-solid fa-building"></i>
              <span>Company / Organization</span>
            </button>
          </div>
        </div>

        {form.clientType === 'company' ? (
          <>
            {/* Company Name */}
            <div className="cif-field" style={{ marginBottom: '0.875rem' }}>
              <label>Company / Organization Name <span>*</span></label>
              <input
                name="companyName"
                placeholder="e.g. Acme Travel & Tours Corp."
                value={form.companyName}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Contact Person Name Label */}
            <div style={{ marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-dark, #334155)' }}>
                Contact Person Name (Representative) <span style={{ color: 'var(--red, #ef4444)' }}>*</span>
              </label>
            </div>

            {/* Contact Person 3 Name Fields */}
            <div className="cif-row-name">
              <div className="cif-field">
                <label>First Name <span>*</span></label>
                <input
                  name="contactPersonFirstName"
                  placeholder="Juan"
                  value={form.contactPersonFirstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="cif-field mi-input">
                <label>M.I.</label>
                <input
                  name="contactPersonMiddleInitial"
                  placeholder="D."
                  maxLength={3}
                  value={form.contactPersonMiddleInitial}
                  onChange={(e) => setForm((prev) => ({ ...prev, contactPersonMiddleInitial: e.target.value.toUpperCase() }))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="cif-field">
                <label>Last Name <span>*</span></label>
                <input
                  name="contactPersonLastName"
                  placeholder="Dela Cruz"
                  value={form.contactPersonLastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Individual Name Row: First Name - M.I. - Last Name (matching Franchise Application Form) */}
            <div style={{ marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-dark, #334155)' }}>
                Full Name <span>*</span>
              </label>
            </div>
            <div className="cif-row-name">
              <div className="cif-field">
                <label>First Name <span>*</span></label>
                <input
                  name="firstName"
                  placeholder="Juan"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="cif-field mi-input">
                <label>M.I.</label>
                <input
                  name="middleInitial"
                  placeholder="D."
                  maxLength={3}
                  value={form.middleInitial}
                  onChange={(e) => setForm((prev) => ({ ...prev, middleInitial: e.target.value.toUpperCase() }))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="cif-field">
                <label>Last Name <span>*</span></label>
                <input
                  name="lastName"
                  placeholder="Dela Cruz"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </>
        )}

        <div className="cif-row2">
          <div className="cif-field">
            <label>Cellphone No. <span>*</span></label>
            <input name="cellphone" placeholder="+63 912 345 6789" value={form.cellphone} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Telephone No.</label>
            <input name="telNo" placeholder="Landline telephone" value={form.telNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        <div className="cif-row2">
          <div className="cif-field">
            <label>E-mail Address <span>*</span></label>
            <input name="email" type="email" placeholder="client@example.com" value={form.email} onChange={handleChange} disabled={isSubmitting} required />
            <small style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem', display: 'block' }}>
              If client has a FairFly account, this inquiry will automatically link to their portal.
            </small>
          </div>
          <div className="cif-field">
            <label>Complete Address <span>*</span></label>
            <input name="address" placeholder="Unit / Street / City" value={form.address} onChange={handleChange} disabled={isSubmitting} />
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
