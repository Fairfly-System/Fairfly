import { useState, useEffect, useMemo } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { createQuotation } from '../../../services/quotationService';
import { fetchServices } from '../../../services/serviceService';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './create-quotation-modal.css';

function getRequirementsText(inquiry) {
  if (Array.isArray(inquiry.requirements)) {
    const filtered = inquiry.requirements.filter((r) => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || r?.label || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });

    if (filtered.length > 0) {
      return filtered
        .map((requirement) => {
          if (typeof requirement === 'string') return requirement.trim();
          if (!requirement || typeof requirement !== 'object') return '';

          const name = [requirement.name, requirement.title, requirement.label]
            .find((value) => typeof value === 'string' && value.trim()) || '';
          const value = typeof requirement.value === 'string' ? requirement.value.trim() : '';
          const fileName = typeof requirement.file?.fileName === 'string'
            ? requirement.file.fileName.trim()
            : '';
          const details = [value, fileName ? `File: ${fileName}` : ''].filter(Boolean).join(' | ');

          if (name && details) return `${name}: ${details}`;
          return name || details;
        })
        .filter(Boolean)
        .join('\n');
    }
  }

  return '';
}

function extractServiceRate(service) {
  if (!service) return 0;
  if (typeof service.price === 'number') return service.price;
  if (typeof service.baseFee === 'number') return service.baseFee;
  const rawStr = String(service.price || service.baseFee || '0');
  const sanitized = rawStr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
}

function getServicePricing(service, taxAmount = 0) {
  const baseRate = extractServiceRate(service);
  const tax = Number(taxAmount) || 0;
  const total = baseRate + tax;
  let rateBreakdown = '';

  if (baseRate > 0) {
    const formattedRate = `Php ${baseRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    rateBreakdown = tax > 0
      ? `${formattedRate} + Php ${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`
      : formattedRate;
  }

  return {
    rate: baseRate > 0 ? String(baseRate) : '',
    totalAmount: total > 0 ? String(total) : '',
    rateBreakdown,
  };
}

export default function CreateQuotationModal({ isOpen, onClose, initialData, onQuotationCreated }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeServices, setActiveServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [formData, setFormData] = useState({
    inquiryId: null,
    clientUid: null,
    clientName: '',
    contactPerson: '',
    clientEmail: '',
    clientPhone: '',
    serviceId: '',
    serviceTitle: '',
    requirements: '',
    tourDates: '',
    inclusions: '- Tourist Bus Transport\n- Driver\'s Fee, fuel, and allowances\n- Standard travel insurance coverage',
    exclusions: '- Toll fees (NLEX / SCTEX / TPLEX)\n- Personal expenses, meals, and incidental items',
    rate: '',
    taxAmount: '',
    rateBreakdown: '',
    totalAmount: '',
    remarks: '- Initial payment of 50% upon confirmation\n- Full payment on or before tour commencement',
    preparedByName: userDetails?.name || userDetails?.fullName || 'Emmanuel Manlapig',
    preparedByTitle: userDetails?.role === 'admin' ? 'Business Head' : 'Branch Operator',
    preparedByContact: userDetails?.phone || userDetails?.phoneNumber || '0997 4763844',
  });

  // Pre-fill with initialData (e.g. from Inquiry) when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const reqsText = getRequirementsText(initialData);
        const serviceName = initialData.serviceType || 
          (Array.isArray(initialData.servicesOffered) ? initialData.servicesOffered.join(', ') : 'Custom Package');

        setFormData((prev) => ({
          ...prev,
          inquiryId: initialData.id || null,
          clientUid: (initialData.clientUid && initialData.clientUid !== user?.uid) ? initialData.clientUid : null,
          clientName: initialData.clientName || initialData.fullName || '',
          contactPerson: initialData.contactPerson || initialData.fullName || '',
          clientEmail: initialData.email || '',
          clientPhone: initialData.cellphone || initialData.phoneNumber || initialData.telNo || '',
          serviceId: initialData.serviceId || '',
          serviceTitle: serviceName,
          requirements: reqsText || '- Valid Government-Issued ID / Passport\n- Completed Application Form',
          remarks: initialData.remarks || prev.remarks
        }));
      }
    }
  }, [isOpen, initialData]);

  // Fetch active catalog services for optional selection
  useEffect(() => {
    if (!isOpen) return;
    setLoadingServices(true);
    const branchUid = userDetails?.role === 'operator' ? user?.uid : null;
    fetchServices(
      branchUid,
      (services) => {
        const activeOnly = Array.isArray(services) ? services.filter(s => s.status === 'Active') : [];
        setActiveServices(activeOnly);
        setFormData((prev) => {
          const selectedService = Array.isArray(services)
            ? services.find((service) => service.id === prev.serviceId)
            : null;
          return selectedService
            ? { ...prev, ...getServicePricing(selectedService, prev.taxAmount) }
            : prev;
        });
        setLoadingServices(false);
      },
      (err) => {
        console.error('Error loading active services for quotation modal:', err);
        setLoadingServices(false);
      }
    );
  }, [isOpen, user?.uid, userDetails?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === 'rate' || name === 'taxAmount') {
        const numRate = Number(name === 'rate' ? value : prev.rate) || 0;
        const numTax = Number(name === 'taxAmount' ? value : prev.taxAmount) || 0;
        const total = numRate + numTax;
        updated.totalAmount = total > 0 ? String(total) : (numRate > 0 ? String(numRate) : '');

        if (numRate > 0) {
          if (numTax > 0) {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} + Php ${numTax.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Tax/Surcharge)`;
          } else {
            updated.rateBreakdown = `Php ${numRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
      return updated;
    });
  };

  const [reqInputs, setReqInputs] = useState({});

  const selectedService = useMemo(() => {
    if (formData.serviceId) {
      const found = activeServices.find(s => s.id === formData.serviceId);
      if (found) return found;
    }
    return null;
  }, [formData.serviceId, activeServices]);

  const serviceRequirements = useMemo(() => {
    let rawList = [];
    if (selectedService?.requirements && Array.isArray(selectedService.requirements) && selectedService.requirements.length > 0) {
      rawList = selectedService.requirements;
    } else if (Array.isArray(initialData?.requirements) && initialData.requirements.length > 0) {
      rawList = initialData.requirements;
    }
    return rawList.filter(r => {
      const name = (typeof r === 'string' ? r : (r?.name || r?.title || '')).trim().toLowerCase();
      return name !== 'specified requirements of client' &&
             name !== 'client specified requirements' &&
             name !== 'specified requirements of the client' &&
             name !== 'specified requirements';
    });
  }, [selectedService, initialData]);

  // Sync requirement inputs when service requirements or initialData change
  useEffect(() => {
    if (!isOpen || serviceRequirements.length === 0) return;
    setReqInputs((prev) => {
      const next = { ...prev };
      serviceRequirements.forEach((req, idx) => {
        const reqName = (typeof req === 'string' ? req : (req.name || req.title || '')).trim().toLowerCase();
        let existing = null;
        if (Array.isArray(initialData?.requirements)) {
          existing = initialData.requirements.find(r => {
            const n = (typeof r === 'string' ? r : (r?.name || r?.title || '')).trim().toLowerCase();
            return n === reqName;
          });
        }
        const existingVal = existing?.value !== undefined && existing?.value !== null
          ? (typeof existing.value === 'object' ? JSON.stringify(existing.value) : String(existing.value))
          : (existing?.textValue || '');
        const existingFile = existing?.file || (existing?.fileUrl ? { url: existing.fileUrl, fileName: existing.fileName || '' } : null);

        if (!next[idx] || (!next[idx].textValue && existingVal)) {
          next[idx] = {
            textValue: next[idx]?.textValue || existingVal,
            file: next[idx]?.file || null,
            existingFile: next[idx]?.existingFile || existingFile
          };
        }
      });
      return next;
    });
  }, [isOpen, serviceRequirements, initialData]);

  const handleReqTextChange = (idx, val) => {
    setReqInputs(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), textValue: val }
    }));
  };

  const handleReqFileChange = (idx, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit', 'warning');
      return;
    }
    setReqInputs(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), file }
    }));
  };

  const handleRemoveReqFile = (idx) => {
    setReqInputs(prev => ({
      ...prev,
      [idx]: { ...(prev[idx] || {}), file: null }
    }));
  };

  const handleServiceSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) {
      return;
    }

    const matched = activeServices.find(s => s.id === selectedId);
    if (matched) {
      setFormData(prev => ({
        ...prev,
        serviceId: matched.id,
        serviceTitle: matched.name,
        ...getServicePricing(matched, prev.taxAmount),
      }));
    }
  };

  const isRequirementsComplete = useMemo(() => {
    if (!serviceRequirements || serviceRequirements.length === 0) return true;
    for (let i = 0; i < serviceRequirements.length; i++) {
      const req = serviceRequirements[i];
      const isReq = typeof req === 'object' ? req.required !== false : true;
      const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
      if (isReq) {
        const state = reqInputs[i] || {};
        const hasFile = Boolean(state.file || state.existingFile?.url);
        const hasText = Boolean(state.textValue && state.textValue.trim());
        if (inputType === 'image' || inputType === 'file') {
          if (!hasFile && !hasText) return false;
        } else {
          if (!hasText && !hasFile) return false;
        }
      }
    }
    return true;
  }, [serviceRequirements, reqInputs]);

  const isFormValid = Boolean(
    formData.clientName.trim() &&
    Boolean(formData.serviceId) &&
    formData.serviceTitle.trim() &&
    formData.requirements.trim() &&
    formData.rate !== '' &&
    Number(formData.rate) >= 0 &&
    formData.totalAmount !== '' &&
    Number(formData.totalAmount) >= 0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName || !formData.serviceTitle) {
      addToast('Client name and service title are required', 'error');
      return;
    }

    if (!formData.serviceId) {
      addToast('A catalog service must be linked to create a quotation. Please select a catalog service.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalSubmittedReqs = [];
      if (serviceRequirements.length > 0) {
        finalSubmittedReqs = await Promise.all(
          serviceRequirements.map(async (req, idx) => {
            const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${idx + 1}`;
            const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
            const isReq = typeof req === 'object' ? req.required !== false : true;
            const state = reqInputs[idx] || {};

            let fileMeta = state.existingFile || null;
            if (state.file) {
              try {
                const targetFolder = `service_requirements/${initialData?.submittedRequirementsId || ('operator_' + Date.now())}`;
                const upRes = await uploadFileToBackend(state.file, targetFolder, userToken);
                if (upRes?.url) {
                  fileMeta = {
                    url: upRes.url,
                    fileName: upRes.fileName || state.file.name,
                    fileSize: upRes.fileSize || state.file.size,
                    storagePath: upRes.storagePath || ''
                  };
                }
              } catch (upErr) {
                console.error(`Error uploading requirement file for ${reqName}:`, upErr);
              }
            }

            return {
              name: reqName,
              inputType,
              required: isReq,
              value: state.textValue ? state.textValue.trim() : '',
              file: fileMeta
            };
          })
        );
      }

      const payload = {
        ...formData,
        submittedRequirements: finalSubmittedReqs.length > 0 ? finalSubmittedReqs : undefined,
        submittedRequirementsId: initialData?.submittedRequirementsId || null,
        rate: Number(formData.rate) || 0,
        taxAmount: Number(formData.taxAmount) || 0,
        totalAmount: Number(formData.totalAmount || formData.rate) || 0,
        branchUid: (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator') 
          ? user?.uid 
          : (initialData?.branchUid || formData.branchUid || null),
        branchName: (userDetails?.role === 'operator' || userDetails?.role === 'branch_operator')
          ? (userDetails?.branchName || userDetails?.name || 'Branch Office')
          : (initialData?.branchName || formData.branchName || 'Branch Office'),
      };

      createQuotation(
        userToken,
        payload,
        (res) => {
          setIsSubmitting(false);
          addToast('Official Quotation (ADF-07-001) created successfully', 'success');
          if (onQuotationCreated) {
            onQuotationCreated(res);
          }
          onClose();
        },
        (error) => {
          setIsSubmitting(false);
          addToast(toFriendlyMessage(error, 'Could not create quotation. Please check your inputs.'), 'error');
        },
        setIsSubmitting
      );
    } catch (err) {
      setIsSubmitting(false);
      console.error('Error in quotation submission:', err);
      addToast(toFriendlyMessage(err, 'Could not process requirements or create quotation.'), 'error');
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="76rem"
      width="96%"
      title="Create Service Quotation (ADF-07-001)"
      subtitle="Generate an official quotation based on client requirements"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit} className="create-quote-form">
        {formData.inquiryId && (
          <div className="quote-inquiry-linked-badge">
            <i className="fa-solid fa-link"></i>
            <span>Linking to Client Inquiry Form: <strong>{initialData?.controlNo || formData.inquiryId}</strong></span>
          </div>
        )}

        {/* Section 1: Client & Contact */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-building"></i> 1. Client Information
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Name of Client / Company *</label>
              <input
                type="text"
                name="clientName"
                placeholder="e.g. COSMETIQUE ASIA CORP."
                value={formData.clientName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                placeholder="e.g. Ms. Marichu Kalalang"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Contact Phone / Mobile</label>
              <input
                type="text"
                name="clientPhone"
                placeholder="e.g. 0917 123 4567"
                value={formData.clientPhone}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Client Email</label>
              <input
                type="email"
                name="clientEmail"
                placeholder="client@company.com"
                value={formData.clientEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
              <small style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem', display: 'block' }}>
                If client has a FairFly account, the quotation will automatically sync to their portal.
              </small>
            </div>
          </div>
        </div>

        {/* Section 2: Service & Requirements */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-layer-group"></i> 2. Service & Specifications
          </h4>

          <div className="form-grid-2">
            <div className="form-column">
              <label className="form-label">Link Catalog Service *</label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleServiceSelect}
                disabled={isSubmitting || loadingServices}
                className="form-input"
                required
              >
                <option value="">-- Associate with Catalog Service (Required) --</option>
                {activeServices.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.price || 'PHP ' + (s.baseFee || '')}
                  </option>
                ))}
              </select>
              {!formData.serviceId && (
                <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  A catalog service must be selected to issue a quotation.
                </small>
              )}
            </div>

            <div className="form-column">
              <label className="form-label">Service / Tour Subject Title *</label>
              <input
                type="text"
                name="serviceTitle"
                placeholder="e.g. 3D/2N Bolinao-Alaminos Tourist Bus Package"
                value={formData.serviceTitle}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>

          {initialData?.specifiedRequirements && (
            <div style={{
              background: 'var(--surface-hover, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '0.5rem',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary, #4338ca)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <i className="fa-solid fa-clipboard-list"></i> Client's Requested Specifications (from SAF-01-002 Intake):
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-main, #1e293b)', whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>
                {initialData.specifiedRequirements}
              </div>
            </div>
          )}

          {/* Interactive Service Requirements Collection (Walk-in or Operator-Assisted) */}
          {serviceRequirements.length > 0 && (
            <div className="operator-req-checklist-box" style={{
              background: 'var(--surface-color, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                paddingBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-dark, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fa-solid fa-list-check" style={{ color: 'var(--brand-primary, #6366f1)' }}></i>
                  Service Requirements (Optional Pre-intake for Walk-ins)
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isRequirementsComplete ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {isRequirementsComplete ? (
                    <><i className="fa-solid fa-circle-check"></i> Complete</>
                  ) : (
                    <><i className="fa-regular fa-clock"></i> Can be attached during quotation review</>
                  )}
                </span>
              </div>



              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {serviceRequirements.map((req, idx) => {
                  const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${idx + 1}`;
                  const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
                  const isReq = typeof req === 'object' ? req.required !== false : true;
                  const state = reqInputs[idx] || {};
                  const hasFile = Boolean(state.file || state.existingFile?.url);
                  const hasText = Boolean(state.textValue && state.textValue.trim());
                  const isFilled = hasFile || hasText;

                  return (
                    <div key={idx} style={{
                      background: '#ffffff',
                      border: `1px solid ${!isFilled && isReq ? '#fcd34d' : 'var(--border-color, #e2e8f0)'}`,
                      borderRadius: '6px',
                      padding: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-dark, #0f172a)' }}>
                          {reqName}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--border-color, #f1f5f9)', color: 'var(--text-mid, #475569)' }}>
                            {inputType.toUpperCase()}
                          </span>
                          {isReq ? (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', fontWeight: '700' }}>
                              Required
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>
                              Optional
                            </span>
                          )}
                        </div>
                      </div>

                      {/* File upload or text/number/date input */}
                      {(inputType === 'image' || inputType === 'file') ? (
                        <div>
                          {state.existingFile?.url && !state.file && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#16a34a' }}>
                              <i className="fa-solid fa-file-circle-check"></i>
                              <span>Submitted file: <strong>{state.existingFile.fileName || 'Document attached'}</strong></span>
                              <a href={state.existingFile.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--brand-primary, #6366f1)', marginLeft: 'auto' }}>View</a>
                            </div>
                          )}

                          {state.file ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                              <i className="fa-solid fa-paperclip" style={{ color: '#16a34a' }}></i>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#166534', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {state.file.name} ({(state.file.size / 1024).toFixed(0)} KB)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveReqFile(idx)}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                                title="Remove file"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          ) : (
                            <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              border: '1px dashed var(--border-color, #cbd5e1)',
                              borderRadius: '6px',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              background: '#fafafa',
                              fontSize: '0.8rem',
                              color: 'var(--brand-primary, #6366f1)',
                              fontWeight: '600'
                            }}>
                              <i className="fa-solid fa-upload"></i>
                              <span>{state.existingFile ? 'Replace Document File' : 'Upload Client Document / Image'}</span>
                              <input
                                type="file"
                                accept={inputType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.jpg,.jpeg,.png'}
                                style={{ display: 'none' }}
                                onChange={(e) => handleReqFileChange(idx, e.target.files[0])}
                                disabled={isSubmitting}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <input
                          type={inputType === 'number' ? 'number' : inputType === 'date' ? 'date' : 'text'}
                          className="form-input"
                          placeholder={`Enter ${reqName}...`}
                          value={state.textValue || ''}
                          onChange={(e) => handleReqTextChange(idx, e.target.value)}
                          disabled={isSubmitting}
                          style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-column">
            <label className="form-label">Document Requirements (Needed by Agency from Client) *</label>
            <textarea
              name="requirements"
              placeholder="• Valid Government-Issued ID / Passport&#10;• 2x2 Photo&#10;• Completed Application Form"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              disabled={isSubmitting}
              className="form-input"
              required
            />
          </div>

          <div className="form-column">
            <label className="form-label">Tour Dates / Itinerary Breakdown</label>
            <textarea
              name="tourDates"
              placeholder="April 29, 2023: Pick up QC to Bolinao&#10;April 30, 2023: Bolinao to Alaminos&#10;May 1, 2023: Alaminos to QC"
              value={formData.tourDates}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 3: Inclusions & Exclusions */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-list-check"></i> 3. Inclusions & Exclusions
          </h4>

          <div className="form-column">
            <label className="form-label">Package Inclusions</label>
            <textarea
              name="inclusions"
              placeholder="- Driver's Fee, food and lodging&#10;- Fuel and vehicle maintenance"
              value={formData.inclusions}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-column">
            <label className="form-label">Package Exclusions</label>
            <textarea
              name="exclusions"
              placeholder="- Toll Fee (NLEX/TPLEX) Estimated amount Php 2,000-Php 2,500&#10;- Personal expenses, meals, and incidental items"
              value={formData.exclusions}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 4: Rates & Pricing */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-coins"></i> 4. Pricing & Rates
          </h4>

          <div className="form-grid-3">
            <div className="form-column">
              <label className="form-label">Base Rate (PHP) *</label>
              <input
                type="number"
                name="rate"
                placeholder="55000"
                value={formData.rate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Tax / Surcharge (PHP)</label>
              <input
                type="number"
                name="taxAmount"
                placeholder="1100"
                value={formData.taxAmount}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Total Amount (PHP) *</label>
              <input
                type="number"
                name="totalAmount"
                placeholder="56100"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="form-input"
                min="0"
                step="any"
              />
            </div>
          </div>

          <div className="form-column">
            <label className="form-label">Rate Breakdown Display</label>
            <input
              type="text"
              name="rateBreakdown"
              placeholder="e.g. Php 55,000.00/bus + Php 1,100.00 / 2% Withholding tax"
              value={formData.rateBreakdown}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>
        </div>

        {/* Section 5: Remarks & Authorizations */}
        <div className="quote-form-section">
          <h4 className="quote-section-title">
            <i className="fa-solid fa-signature"></i> 5. Remarks & Prepared By
          </h4>

          <div className="form-column">
            <label className="form-label">Payment Terms & Remarks</label>
            <textarea
              name="remarks"
              placeholder="- Initial payment upon confirmation&#10;- Full payment on or before service commencement"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              disabled={isSubmitting}
              className="form-input"
            />
          </div>

          <div className="form-grid-3">
            <div className="form-column">
              <label className="form-label">Prepared By Name</label>
              <input
                type="text"
                name="preparedByName"
                value={formData.preparedByName}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Title / Role</label>
              <input
                type="text"
                name="preparedByTitle"
                value={formData.preparedByTitle}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>

            <div className="form-column">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                name="preparedByContact"
                value={formData.preparedByContact}
                onChange={handleChange}
                disabled={isSubmitting}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="quote-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary quote-modal-submit-btn"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Generating...</span>
              </>
            ) : !formData.serviceId ? (
              <>
                <i className="fa-solid fa-link-slash"></i>
                <span>Link Service Required</span>
              </>
            ) : !isRequirementsComplete && serviceRequirements.length > 0 ? (
              <>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Complete Mandatory Requirements</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-invoice-dollar"></i>
                <span>Create Quotation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
