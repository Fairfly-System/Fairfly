import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import './client-service-request-modal.css';

export default function ClientServiceRequestModal({
  isOpen,
  onClose,
  onRequestSuccess,
  initialServiceId,
  lockedBranchUid,
  lockedBranchName
}) {
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const [servicesList, setServicesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || '');
  const [selectedBranchUid, setSelectedBranchUid] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Requirement Inputs State: { [index]: { textValue: '', file: File|null, previewUrl: '' } }
  const [requirementInputs, setRequirementInputs] = useState({});

  // When initialServiceId or isOpen changes, sync selectedServiceId
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
      setRequirementInputs({});
    }
  }, [initialServiceId, isOpen]);

  // Prefill client information if user is logged in
  useEffect(() => {
    if (userDetails || user) {
      setClientName(userDetails?.name || userDetails?.displayName || user?.displayName || '');
      setClientEmail(userDetails?.email || user?.email || '');
      setClientPhone(userDetails?.phone || userDetails?.contactNumber || '');
    }
  }, [user, userDetails]);

  // Fetch services and branch options for form dropdowns
  useEffect(() => {
    if (!isOpen) return;

    setLoadingOptions(true);

    const loadOptions = async () => {
      try {
        // 1. Fetch Services options for dropdown
        ApiCaller(
          `${API_BASE_URL}/api/services`,
          'GET',
          null,
          userToken ? { Authorization: `Bearer ${userToken}` } : {},
          (data) => {
            const list = Array.isArray(data) ? data : [];
            const activeOnly = list.filter((s) => s.status !== 'Inactive' && s.status !== 'Disabled');
            if (activeOnly.length > 0) {
              setServicesList(activeOnly);
              const defaultSel = initialServiceId && activeOnly.some((s) => s.id === initialServiceId)
                ? initialServiceId
                : activeOnly[0].id;
              setSelectedServiceId(defaultSel);
            } else {
              fetchServicesFromFirestore();
            }
          },
          () => fetchServicesFromFirestore()
        );

        // 2. Fetch Active Branch Operators for dropdown
        ApiCaller(
          `${API_BASE_URL}/api/operators/branches`,
          'GET',
          null,
          userToken ? { Authorization: `Bearer ${userToken}` } : {},
          (data) => {
            const branches = Array.isArray(data) ? data : [];
            if (branches.length > 0) {
              setBranchesList(branches);
              setSelectedBranchUid(branches[0].uid);
            } else {
              fetchBranchesFromFirestore();
            }
          },
          () => fetchBranchesFromFirestore(),
          setLoadingOptions
        );
      } catch (err) {
        console.error('Error loading modal options:', err);
        setLoadingOptions(false);
      }
    };

    const fetchServicesFromFirestore = async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        const snap = await getDocs(collection(db, 'services'));
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((s) => s.status !== 'Inactive' && s.status !== 'Disabled');
        if (list.length > 0) {
          setServicesList(list);
          const defaultSel = initialServiceId && list.some((s) => s.id === initialServiceId)
            ? initialServiceId
            : list[0].id;
          setSelectedServiceId(defaultSel);
        }
      } catch (err) {
        console.error('Firestore services fallback error:', err);
      }
    };

    const fetchBranchesFromFirestore = async () => {
      try {
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        const q = query(collection(db, 'users'), where('role', '==', 'operator'));
        const snap = await getDocs(q);
        const list = snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              uid: doc.id,
              branchName: data.branchName || data.name || 'Branch Operator',
              address: data.address || '',
              status: data.status || 'Active'
            };
          })
          .filter((b) => b.status !== 'Inactive');
        if (list.length > 0) {
          setBranchesList(list);
          setSelectedBranchUid(list[0].uid);
        }
      } catch (err) {
        console.error('Firestore branches fallback error:', err);
      }
    };

    loadOptions();
  }, [isOpen, userToken, initialServiceId]);

  // Selected Service object
  const selectedService = servicesList.find((s) => s.id === selectedServiceId);
  const serviceRequirements = selectedService?.requirements || selectedService?.actions || [];

  const isBranchExclusive = Boolean(selectedService?.isBranchExclusive && selectedService?.branchUid);
  const effectiveLockedBranchUid = isBranchExclusive ? selectedService.branchUid : lockedBranchUid;
  const effectiveLockedBranchName = isBranchExclusive ? (selectedService.branchName || 'Assigned Branch') : lockedBranchName;

  // Auto-lock branch UID if service is branch exclusive or prop provided
  useEffect(() => {
    if (effectiveLockedBranchUid) {
      setSelectedBranchUid(effectiveLockedBranchUid);
    }
  }, [effectiveLockedBranchUid]);

  // Handle Requirement Text/Value change
  const handleReqTextChange = (index, value) => {
    setRequirementInputs((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        textValue: value
      }
    }));
  };

  // Handle Requirement File/Image Selection
  const handleReqFileChange = (index, file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds 10MB limit', 'warning');
      return;
    }

    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

    setRequirementInputs((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        file,
        previewUrl
      }
    }));
  };

  const isFormValid = useMemo(() => {
    if (!selectedServiceId || !selectedBranchUid || !clientName.trim()) {
      return false;
    }

    for (let i = 0; i < serviceRequirements.length; i++) {
      const req = serviceRequirements[i];
      const isReq = typeof req === 'object' ? req.required !== false : true;
      const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';

      if (isReq) {
        const state = requirementInputs[i] || {};
        if (inputType === 'image' || inputType === 'file') {
          if (!state.file) return false;
        } else {
          if (!state.textValue || !state.textValue.trim()) return false;
        }
      }
    }

    return true;
  }, [selectedServiceId, selectedBranchUid, clientName, serviceRequirements, requirementInputs]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedServiceId) {
      addToast('Please select a service', 'warning');
      return;
    }
    if (!selectedBranchUid) {
      addToast('Please select a branch operator', 'warning');
      return;
    }
    if (!clientName.trim()) {
      addToast('Please enter your full name', 'warning');
      return;
    }

    // Validate required service fields
    for (let i = 0; i < serviceRequirements.length; i++) {
      const req = serviceRequirements[i];
      const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${i + 1}`;
      const isReq = typeof req === 'object' ? req.required !== false : true;
      const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';

      if (isReq) {
        const state = requirementInputs[i] || {};
        if (inputType === 'image' || inputType === 'file') {
          if (!state.file) {
            addToast(`Please upload required document: "${reqName}"`, 'warning');
            return;
          }
        } else {
          if (!state.textValue || !state.textValue.trim()) {
            addToast(`Please enter required detail: "${reqName}"`, 'warning');
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Process File Uploads to Firebase Storage
      const submittedRequirements = await Promise.all(
        serviceRequirements.map(async (req, i) => {
          const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${i + 1}`;
          const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
          const isReq = typeof req === 'object' ? req.required !== false : true;
          const userState = requirementInputs[i] || {};

          let uploadedFileMeta = null;

          if (userState.file) {
            try {
              const formData = new FormData();
              formData.append('file', userState.file);
              formData.append('folder', 'client-requirements');

              const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
                body: formData
              });

              if (uploadRes.ok) {
                const uploadJson = await uploadRes.json();
                if (uploadJson.success && uploadJson.url) {
                  uploadedFileMeta = {
                    url: uploadJson.url,
                    fileName: uploadJson.fileName || userState.file.name,
                    fileSize: uploadJson.fileSize || userState.file.size,
                    storagePath: uploadJson.storagePath || ''
                  };
                }
              }
            } catch (uploadErr) {
              console.error(`Failed to upload file for requirement ${reqName}:`, uploadErr);
            }
          }

          return {
            name: reqName,
            inputType,
            required: isReq,
            value: userState.textValue ? userState.textValue.trim() : '',
            file: uploadedFileMeta
          };
        })
      );

      const matchedBranch = branchesList.find((b) => b.uid === selectedBranchUid);

      const payload = {
        serviceId: selectedServiceId,
        serviceType: selectedService ? selectedService.name : 'Requested Service',
        operatorId: selectedBranchUid,
        branchUid: selectedBranchUid,
        branchName: matchedBranch ? matchedBranch.branchName : 'Branch Operator',
        clientUid: user?.uid || null,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        additionalNotes: additionalNotes.trim(),
        submittedRequirements,
        status: 'Pending'
      };

      ApiCaller(
        `${API_BASE_URL}/api/services/active`,
        'POST',
        payload,
        userToken ? { Authorization: `Bearer ${userToken}` } : {},
        (res) => {
          addToast(`🎉 Service request for "${payload.serviceType}" submitted to ${payload.branchName}!`, 'success');
          if (onRequestSuccess) onRequestSuccess(res);
          setIsSubmitting(false);
          onClose();
        },
        (error) => {
          addToast(toFriendlyMessage(error, 'Unable to submit your service request. Please try again.'), 'error');
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error submitting requirement uploads:', err);
      addToast(toFriendlyMessage(err, 'An error occurred while uploading your requirements. Please try again.'), 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="56rem"
      title="Request a Travel & Processing Service"
      subtitle="Select your service, upload requirements, and assign it to your preferred branch"
      isLoading={isSubmitting}
    >
      {loadingOptions ? (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-light)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
          <p>Loading available services and branches...</p>
        </div>
      ) : (
        <form className="client-request-form form-column" onSubmit={handleSubmit} style={{ gap: '1.25rem' }}>
          <div className="form-grid-2">
            {/* Select Service */}
            <div className="form-column">
              <label htmlFor="serviceSelect" className="form-label">
                <i className="fa-solid fa-concierge-bell" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Requested Service <span className="req-star">*</span>
              </label>
              <select
                id="serviceSelect"
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setRequirementInputs({});
                }}
                required
                className="form-select"
              >
                {servicesList.length === 0 ? (
                  <option value="">No active services available</option>
                ) : (
                  servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price || 'Standard Fee'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Select Branch Operator */}
            <div className="form-column">
              <label htmlFor="branchSelect" className="form-label">
                <i className="fa-solid fa-building" style={{ color: 'var(--purple)', marginRight: '0.35rem' }}></i>
                Select Processing Branch <span className="req-star">*</span>
              </label>
              <select
                id="branchSelect"
                value={selectedBranchUid}
                onChange={(e) => setSelectedBranchUid(e.target.value)}
                required
                disabled={Boolean(effectiveLockedBranchUid)}
                className="form-select"
                style={effectiveLockedBranchUid ? { backgroundColor: 'var(--bg-muted, #f1f5f9)', cursor: 'not-allowed' } : {}}
              >
                {branchesList.length === 0 ? (
                  <option value="">No active branches available</option>
                ) : (
                  branchesList.map((b) => (
                    <option key={b.uid} value={b.uid}>
                      {b.branchName} {b.address ? `(${b.address})` : ''}
                    </option>
                  ))
                )}
              </select>
              {effectiveLockedBranchUid && (
                <span style={{ fontSize: '0.75rem', color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  <i className="fa-solid fa-lock"></i> Exclusively serviced by {effectiveLockedBranchName}
                </span>
              )}
            </div>
          </div>

          {/* Selected Service Preview Summary Card */}
          {selectedService && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.875rem 1.125rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              {selectedService.coverImage || selectedService.coverPhoto ? (
                <img
                  src={selectedService.coverImage || selectedService.coverPhoto}
                  alt={selectedService.name}
                  style={{
                    width: '4.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '4.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--purple-light-2)',
                    color: 'var(--purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-passport"></i>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--text-dark)' }}>{selectedService.name}</strong>
                  <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--purple)' }}>
                    {selectedService.price ? (selectedService.price.startsWith('₱') || selectedService.price.startsWith('PHP') ? selectedService.price : `₱${Number(selectedService.price).toLocaleString('en-US')}`) : 'Standard Fee'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--purple)' }}>
                    {selectedService.category || 'General Services'}
                  </span>
                  {Array.isArray(selectedService.tags) && selectedService.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.0625rem 0.375rem',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-mid)',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

            {/* Dynamic Service Requirements Inputs Section */}
            {serviceRequirements.length > 0 && (
              <div className="client-req-section">
                <h3 className="client-req-title">
                  <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--purple)' }}></i>
                  Service Requirements ({serviceRequirements.length})
                </h3>

                <div className="client-req-list">
                  {serviceRequirements.map((req, idx) => {
                    const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${idx + 1}`;
                    const inputType = typeof req === 'object' ? req.inputType || 'text' : 'text';
                    const isReq = typeof req === 'object' ? req.required !== false : true;
                    const userState = requirementInputs[idx] || {};

                    return (
                      <div key={idx} className="client-req-card">
                        <div className="client-req-card-header">
                          <span className="client-req-name">
                            {reqName} {isReq && <span className="req-star">*</span>}
                          </span>
                          <span className="client-req-type-tag">
                            {inputType === 'image' && <><i className="fa-regular fa-image" style={{ marginRight: '0.25rem' }}></i> Image Upload</>}
                            {inputType === 'file' && <><i className="fa-regular fa-file-lines" style={{ marginRight: '0.25rem' }}></i> Document File</>}
                            {inputType === 'text' && <><i className="fa-solid fa-pen-to-square" style={{ marginRight: '0.25rem' }}></i> Text Input</>}
                            {inputType === 'date' && <><i className="fa-regular fa-calendar" style={{ marginRight: '0.25rem' }}></i> Date Input</>}
                            {inputType === 'number' && <><i className="fa-solid fa-hashtag" style={{ marginRight: '0.25rem' }}></i> Number Input</>}
                          </span>
                        </div>

                        {/* Image / File Upload Input */}
                        {(inputType === 'image' || inputType === 'file') && (
                          <div className="client-upload-box">
                            <input
                              type="file"
                              id={`req-file-${idx}`}
                              accept={inputType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx'}
                              style={{ display: 'none' }}
                              onChange={(e) => handleReqFileChange(idx, e.target.files[0])}
                            />

                            {!userState.file ? (
                              <label htmlFor={`req-file-${idx}`} className="client-upload-label">
                                <i className={inputType === 'image' ? 'fa-solid fa-camera' : 'fa-solid fa-cloud-arrow-up'}></i>
                                <span>Click to select {inputType === 'image' ? 'Image photo' : 'Document file'}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                  {inputType === 'image' ? 'PNG, JPG, JPEG (Max 10MB)' : 'PDF, DOCX, XLSX, PNG (Max 10MB)'}
                                </span>
                              </label>
                            ) : (
                              <div className="client-upload-preview">
                                {userState.previewUrl ? (
                                  <img src={userState.previewUrl} alt="Preview" className="client-img-thumbnail" />
                                ) : (
                                  <i className="fa-solid fa-file-lines" style={{ fontSize: '1.5rem', color: '#4f46e5' }}></i>
                                )}
                                <div className="client-file-details">
                                  <span className="client-file-name">{userState.file.name}</span>
                                  <span className="client-file-size">({(userState.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button
                                  type="button"
                                  className="client-remove-file-btn"
                                  onClick={() => setRequirementInputs((prev) => ({ ...prev, [idx]: { ...prev[idx], file: null, previewUrl: '' } }))}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text Input */}
                        {inputType === 'text' && (
                          <input
                            type="text"
                            className="client-req-input form-input"
                            placeholder={`Enter ${reqName}...`}
                            value={userState.textValue || ''}
                            onChange={(e) => handleReqTextChange(idx, e.target.value)}
                            required={isReq}
                          />
                        )}

                        {/* Date Input */}
                        {inputType === 'date' && (
                          <input
                            type="date"
                            className="client-req-input form-input"
                            value={userState.textValue || ''}
                            onChange={(e) => handleReqTextChange(idx, e.target.value)}
                            required={isReq}
                          />
                        )}

                        {/* Number Input */}
                        {inputType === 'number' && (
                          <input
                            type="number"
                            className="client-req-input form-input"
                            placeholder={`Enter ${reqName} number...`}
                            value={userState.textValue || ''}
                            onChange={(e) => handleReqTextChange(idx, e.target.value)}
                            required={isReq}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-grid-2">
              {/* Client Name */}
              <div className="form-column">
                <label htmlFor="clientNameInput" className="form-label">Full Name <span className="req-star">*</span></label>
                <input
                  id="clientNameInput"
                  type="text"
                  placeholder="e.g. Juan dela Cruz"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Email Address */}
              <div className="form-column">
                <label htmlFor="clientEmailInput" className="form-label">Email Address</label>
                <input
                  id="clientEmailInput"
                  type="email"
                  placeholder="example@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              {/* Phone Number */}
              <div className="form-column">
                <label htmlFor="clientPhoneInput" className="form-label">Contact Phone Number</label>
                <input
                  id="clientPhoneInput"
                  type="text"
                  placeholder="0917-000-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-column">
              <label htmlFor="additionalNotesInput" className="form-label">Additional Instructions / Notes</label>
              <textarea
                id="additionalNotesInput"
                rows="3"
                placeholder="Specify any special requests or notes for the branch operator..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="client-request-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting || servicesList.length === 0 || !isFormValid}>
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting & Uploading...
                  </>
                ) : (
                  <>
                    <i className="fa-regular fa-paper-plane"></i> Submit Service Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
    </BaseModal>
  );
}
