import { useState, useEffect, useRef } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { fetchServices } from '../../../services/serviceService';
import { createInquiry, fetchInquirySchema } from '../../../services/inquiryService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './create-inquiry-form-modal.css';

const todayIso = new Date().toISOString().split('T')[0];

export default function CreateInquiryFormModal({ onClose }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [formSchema, setFormSchema] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingReqId, setUploadingReqId] = useState(null);

  const [form, setForm] = useState({
    formNo: `SAF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    controlNo: `CTRL-${Math.floor(1000 + Math.random() * 9000)}`,
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
    serviceId: '',
    serviceType: '',
    servicePrice: '',
    requirements: [],
    remarks: '',
    agentName: userDetails?.name || userDetails?.fullName || 'Operator',
    agentSignature: '',
    acknowledgedBy: '',
    acknowledgedSignature: '',
    customFields: {}
  });

  // Fetch active services (including branch exclusives) and dynamic schema
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

    fetchInquirySchema(
      (schema) => {
        if (schema) setFormSchema(schema);
      },
      (err) => {
        console.error('Error loading inquiry schema:', err);
      }
    );
  }, [user?.uid, userDetails?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setForm((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

  const handleServiceSelect = (e) => {
    const selectedServiceId = e.target.value;
    if (!selectedServiceId) {
      setForm((prev) => ({
        ...prev,
        serviceId: '',
        serviceType: '',
        servicePrice: '',
        requirements: []
      }));
      return;
    }

    const matched = activeServices.find((s) => s.id === selectedServiceId);
    if (matched) {
      // Map service requirements into dynamic requirement items with file upload placeholders
      const reqItems = Array.isArray(matched.requirements) && matched.requirements.length > 0
        ? matched.requirements.map((r, idx) => {
            const name = typeof r === 'string' ? r : (r.name || r.title || `Requirement ${idx + 1}`);
            return {
              id: `req_${idx}_${Date.now()}`,
              name,
              required: typeof r === 'object' ? (r.required !== false) : true,
              inputType: typeof r === 'object' && r.inputType ? r.inputType : 'file',
              file: null,
              value: '',
              isUploaded: false
            };
          })
        : [
            {
              id: `req_default_${Date.now()}`,
              name: 'Valid ID / Client Documents',
              required: true,
              inputType: 'file',
              file: null,
              value: '',
              isUploaded: false
            }
          ];

      setForm((prev) => ({
        ...prev,
        serviceId: matched.id,
        serviceType: matched.name,
        servicePrice: matched.price || (matched.baseFee ? `PHP ${matched.baseFee}` : ''),
        requirements: reqItems
      }));
    }
  };

  const handleRequirementFileUpload = async (reqId, file) => {
    if (!file) return;
    setUploadingReqId(reqId);

    try {
      const uploadResult = await uploadFileToBackend(file, 'inquiry_requirements', userToken);
      setForm((prev) => ({
        ...prev,
        requirements: prev.requirements.map((r) => {
          if (r.id === reqId) {
            return {
              ...r,
              file: {
                url: uploadResult.url,
                fileName: uploadResult.fileName,
                fileSize: uploadResult.fileSize,
                storagePath: uploadResult.storagePath
              },
              isUploaded: true
            };
          }
          return r;
        })
      }));
      addToast(`Uploaded "${file.name}" for requirement`, 'success');
    } catch (err) {
      console.error('Error uploading requirement file:', err);
      addToast(toFriendlyMessage(err, 'Failed to upload document file'), 'error');
    } finally {
      setUploadingReqId(null);
    }
  };

  const handleRequirementTextChange = (reqId, val) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => {
        if (r.id === reqId) {
          return { ...r, value: val, isUploaded: Boolean(val.trim()) };
        }
        return r;
      })
    }));
  };

  const handleSubmit = () => {
    if (!form.clientName || !form.cellphone) {
      addToast('Client name and cellphone number are required', 'error');
      return;
    }

    if (!form.serviceId && !form.serviceType) {
      addToast('Please select a service for this inquiry', 'error');
      return;
    }

    const payload = {
      ...form,
      branchUid: userDetails?.role === 'operator' ? user?.uid : null,
      branchName: userDetails?.branchName || userDetails?.name || 'Branch Office',
      notes: form.remarks
    };

    createInquiry(
      userToken,
      payload,
      () => {
        addToast('Inquiry form created successfully', 'success');
        onClose();
      },
      (error) => {
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
      title="Create Service Inquiry Intake Form"
      subtitle="Select active service, attach required client documents, and record client details"
      isLoading={isSubmitting}
    >
      <div className="cif-body-content">
        {/* Form No / Control No */}
        <div className="cif-row2">
          <div className="cif-field">
            <label>Form No. <span>*</span></label>
            <input name="formNo" placeholder="e.g., SAF-01-001" value={form.formNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Control No. <span>*</span></label>
            <input name="controlNo" placeholder="e.g., 26-059" value={form.controlNo} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        {/* ── Client Information ── */}
        <h3 className="cif-section-title">
          <i className="fa-solid fa-user"></i> Client Information
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

        {/* ── Dynamic Services and Requirements ── */}
        <h3 className="cif-section-title">
          <i className="fa-solid fa-layer-group"></i> Dynamic Service & Client Requirements
        </h3>

        <div className="cif-row2">
          <div className="cif-field">
            <label>Select Active Service Offered <span>*</span></label>
            <select
              name="serviceId"
              value={form.serviceId}
              onChange={handleServiceSelect}
              disabled={isSubmitting || loadingServices}
            >
              <option value="">-- Choose from Active Services --</option>
              {activeServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isBranchExclusive ? `(Branch Exclusive: ${s.branchName || 'Exclusive'})` : ''} - {s.price || 'PHP ' + (s.baseFee || '')}
                </option>
              ))}
            </select>
          </div>

          <div className="cif-field">
            <label>Package Fee / Price</label>
            <input
              name="servicePrice"
              placeholder="e.g. PHP 55,000.00"
              value={form.servicePrice}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Requirements Uploads Section */}
        {form.requirements.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              Service Requirements Checklist (Upload client documents on their behalf)
            </label>
            <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.75rem', color: '#64748b' }}>
              Upload valid copies (PDF, JPG, PNG) of the required documents for the client. All mandatory requirements must be uploaded before the inquiry can be confirmed.
            </p>

            <div className="cif-reqs-container">
              {form.requirements.map((req) => (
                <div key={req.id} className={`cif-req-card ${req.file?.url || req.value ? 'is-fulfilled' : ''}`}>
                  <div className="cif-req-header">
                    <span className="cif-req-name">
                      {req.name} {req.required && <span style={{ color: 'var(--red)' }}>*</span>}
                    </span>
                    <span className={`cif-req-badge ${req.file?.url || req.value ? 'uploaded' : 'pending'}`}>
                      {req.file?.url ? '✓ Uploaded' : req.value ? '✓ Completed' : 'Pending Document'}
                    </span>
                  </div>

                  <div className="cif-upload-box">
                    {req.inputType === 'text' ? (
                      <input
                        type="text"
                        placeholder={`Enter ${req.name}...`}
                        value={req.value || ''}
                        onChange={(e) => handleRequirementTextChange(req.id, e.target.value)}
                        disabled={isSubmitting}
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                      />
                    ) : (
                      <>
                        {req.file?.url ? (
                          <div className="cif-file-chosen">
                            <i className="fa-solid fa-file-check"></i>
                            <span>{req.file.fileName}</span>
                            <a
                              href={req.file.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--purple)', marginLeft: '0.5rem', fontSize: '0.75rem', textDecoration: 'underline' }}
                            >
                              Preview
                            </a>
                          </div>
                        ) : null}

                        <label className="cif-file-btn">
                          <i className={uploadingReqId === req.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'}></i>
                          <span>{uploadingReqId === req.id ? 'Uploading...' : req.file?.url ? 'Change File' : 'Upload File / Photo'}</span>
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            disabled={isSubmitting || uploadingReqId === req.id}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleRequirementFileUpload(req.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields from Admin Form Builder (if configured) */}
        {formSchema?.sections && formSchema.sections.filter(s => s.id !== 'client_info' && s.id !== 'signatures').map(section => (
          <div key={section.id} style={{ marginTop: '1rem' }}>
            <h3 className="cif-section-title">
              <i className="fa-solid fa-sliders"></i> {section.title}
            </h3>
            <div className="cif-row2">
              {section.fields?.map(field => (
                <div key={field.id} className="cif-field">
                  <label>
                    {field.label} {field.required && <span>*</span>}
                  </label>
                  <input
                    type={field.type || 'text'}
                    placeholder={field.placeholder || ''}
                    value={form.customFields[field.id] || ''}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Remarks */}
        <div className="cif-field" style={{ marginTop: '0.875rem' }}>
          <label>Remarks & Additional Notes</label>
          <textarea
            name="remarks"
            placeholder="Additional instructions or notes regarding this inquiry..."
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="cif-textarea-light"
            disabled={isSubmitting}
          />
        </div>

        {/* ── Signatures ── */}
        <h3 className="cif-section-title">
          <i className="fa-solid fa-signature"></i> Signatures & Authorizations
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
            <input name="acknowledgedBy" placeholder="Supervisor/Manager name" value={form.acknowledgedBy} onChange={handleChange} disabled={isSubmitting} />
          </div>
          <div className="cif-field">
            <label>Supervisor Signature</label>
            <input name="acknowledgedSignature" placeholder="Digital signature or initials" value={form.acknowledgedSignature} onChange={handleChange} disabled={isSubmitting} />
          </div>
        </div>

        {/* Actions */}
        <div className="cif-actions">
          <button className="cif-btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="cif-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Creating Inquiry...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pen"></i>
                <span>Create Inquiry Form</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
