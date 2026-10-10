import './franchise-application-form.css';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { fetchFranchiseApplicationSchema } from '../../../services/franchiseService';
import { generateFranchiseId } from '../../../utils/idGenerator';
import { uploadFileToBackend } from '../../../utils/fileUploadApi';

// PSGC Cloud API — fetches Philippine standard geographic data
const PSGC_BASE = 'https://psgc.cloud/api';
const NCR_REGION = { name: 'Metro Manila (NCR)', code: '1300000000', isRegion: true };

async function fetchPsgc(path) {
  const res = await fetch(`${PSGC_BASE}${path}`);
  if (!res.ok) throw new Error(`PSGC API error: ${res.status}`);
  return res.json();
}

const BUSINESS_EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select your experience level', disabled: true },
  { value: 'No prior business experience', label: 'No prior business experience' },
  { value: '0-2 years experience', label: '0-2 years experience' },
  { value: '3-5 years experience', label: '3-5 years experience' },
  { value: 'Over 5 years experience', label: 'Over 5 years experience' },
];

const INVESTMENT_CAPACITY_OPTIONS = [
  { value: '', label: 'Select investment range', disabled: true },
  { value: 'Less than ₱50,000', label: 'Less than ₱50,000' },
  { value: '₱50,000 - ₱100,000', label: '₱50,000 - ₱100,000' },
  { value: '₱100,000 - ₱200,000', label: '₱100,000 - ₱200,000' },
  { value: '₱200,000 - ₱500,000', label: '₱200,000 - ₱500,000' },
  { value: '₱500,000+', label: '₱500,000+' },
];

const MEETING_TIME_OPTIONS = [
  { value: '', label: 'Select time slot', disabled: true },
  { value: 'morning', label: 'Morning (9:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (1:00 PM - 5:00 PM)' },
];

const EMPTY_FORM = {
  firstName: '',
  middleInitial: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  provinceCode: '',
  province: '',
  municipalityCode: '',
  municipality: '',
  barangay: '',
  building: '',
  businessExperience: '',
  investmentCapacity: '',
  preferredMeetingDate: '',
  preferredMeetingTime: '',
  preferredMeetingStartTime: '09:00',
  preferredMeetingEndTime: '10:00',
  noPreferenceSchedule: false,
  proofOfCapability: [],
  additionalMessage: '',
  customFields: {},
};

export default function FranchiseApplicationForm({ isOpen, onClose }) {
  const { user, userDetails, userToken } = useAuthContext();
  const { addToast } = useToast();

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  const [franchiseAppId, setFranchiseAppId] = useState(() => generateFranchiseId());
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // Files are held locally until submit — not uploaded until the form is submitted
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);
  const [customFieldsSchema, setCustomFieldsSchema] = useState([]);

  // Location data states
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  const provincesLoadedRef = useRef(false);

  // Sync isOpen prop with internal animation states
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Prefill details for authenticated client
  useEffect(() => {
    if (isOpen && (userDetails || user)) {
      const nameParts = (userDetails?.fullName || userDetails?.name || userDetails?.displayName || user?.displayName || '').trim().split(/\s+/);
      const initialFirst = nameParts[0] || '';
      const initialLast = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const initialEmail = userDetails?.email || user?.email || '';
      const initialPhone = userDetails?.phone || userDetails?.phoneNumber || userDetails?.contactNumber || userDetails?.cellphone || user?.phoneNumber || '';

      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName.trim() ? prev.firstName : initialFirst,
        lastName: prev.lastName.trim() ? prev.lastName : initialLast,
        email: prev.email.trim() ? prev.email : initialEmail,
        phoneNumber: prev.phoneNumber.trim() ? prev.phoneNumber : initialPhone,
      }));
    }
  }, [isOpen, user, userDetails]);

  // Load provinces and form schema once when form opens
  useEffect(() => {
    if (!isOpen) return;

    fetchFranchiseApplicationSchema(
      null,
      (data) => {
        const sections = data?.sections || [];
        const custom = sections
          .flatMap((s) => s.fields || [])
          .filter((f) => f.isCustom === true);
        setCustomFieldsSchema(custom);
      },
      (err) => console.warn('Could not load custom fields schema:', err)
    );

    if (provincesLoadedRef.current) return;
    setLoadingProvinces(true);
    fetchPsgc('/provinces')
      .then((data) => {
        const sorted = [NCR_REGION, ...[...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''))];
        setProvinces(sorted);
        provincesLoadedRef.current = true;
      })
      .catch((err) => {
        console.warn('Failed to load provinces:', err.message);
        addToast('Could not load province list. Please check your connection.', 'error');
      })
      .finally(() => setLoadingProvinces(false));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load municipalities when province changes
  useEffect(() => {
    if (!formData.provinceCode) {
      setMunicipalities([]);
      setBarangays([]);
      return;
    }
    setLoadingMunicipalities(true);
    setMunicipalities([]);
    setBarangays([]);
    setFormData((prev) => ({ ...prev, municipality: '', municipalityCode: '', barangay: '' }));

    const endpoint = formData.provinceCode === '1300000000'
      ? `/regions/${formData.provinceCode}/cities-municipalities`
      : `/provinces/${formData.provinceCode}/cities-municipalities`;

    fetchPsgc(endpoint)
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setMunicipalities(sorted);
      })
      .catch((err) => {
        console.warn('Failed to load municipalities:', err.message);
        addToast('Could not load municipality list.', 'error');
      })
      .finally(() => setLoadingMunicipalities(false));
  }, [formData.provinceCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load barangays when municipality changes
  useEffect(() => {
    if (!formData.municipalityCode) {
      setBarangays([]);
      return;
    }
    setLoadingBarangays(true);
    setBarangays([]);
    setFormData((prev) => ({ ...prev, barangay: '' }));
    fetchPsgc(`/cities-municipalities/${formData.municipalityCode}/barangays`)
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setBarangays(sorted);
      })
      .catch((err) => {
        console.warn('Failed to load barangays:', err.message);
        addToast('Could not load barangay list.', 'error');
      })
      .finally(() => setLoadingBarangays(false));
  }, [formData.municipalityCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const setError = (field, msg) =>
    setErrors((prev) => ({ ...prev, [field]: msg }));
  const clearError = (field) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const validateField = (field, value) => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) setError(field, 'This field is required');
        else if (value.trim().length < 2) setError(field, 'Must be at least 2 characters');
        else clearError(field);
        break;
      case 'email': {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) setError(field, 'Invalid email address');
        else clearError(field);
        break;
      }
      case 'phoneNumber': {
        const phoneRe = /^[0-9+\s\-]{8,15}$/;
        if (!phoneRe.test(value)) setError(field, 'Invalid phone number');
        else clearError(field);
        break;
      }
      case 'preferredMeetingDate': {
        const today = new Date().toISOString().split('T')[0];
        if (value < today) setError(field, 'Date must not be in the past');
        else clearError(field);
        break;
      }
      default:
        break;
    }
  };

  const handleChange = (field, value) => {
    set(field, value);
    validateField(field, value);
  };

  const handleProvinceChange = (e) => {
    const selected = provinces.find((p) => p.code === e.target.value);
    setFormData((prev) => ({
      ...prev,
      provinceCode: selected?.code || '',
      province: selected?.name || '',
      municipalityCode: '',
      municipality: '',
      barangay: '',
    }));
  };

  const handleMunicipalityChange = (e) => {
    const selected = municipalities.find((m) => m.code === e.target.value);
    setFormData((prev) => ({
      ...prev,
      municipalityCode: selected?.code || '',
      municipality: selected?.name || '',
      barangay: '',
    }));
  };

  const handleCustomFieldChange = (fieldId, val) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [fieldId]: val
      }
    }));
  };

  const areCustomFieldsValid = customFieldsSchema.every((field) => {
    if (!field.required) return true;
    const val = formData.customFields?.[field.id];
    return typeof val === 'string' && val.trim().length > 0;
  });

  const isMeetingValid = formData.noPreferenceSchedule || Boolean(
    formData.preferredMeetingDate &&
    formData.preferredMeetingStartTime &&
    formData.preferredMeetingEndTime &&
    formData.preferredMeetingStartTime < formData.preferredMeetingEndTime
  );

  const isFormValid = Boolean(
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phoneNumber.trim() &&
    formData.province &&
    formData.municipality &&
    formData.barangay &&
    formData.businessExperience &&
    formData.investmentCapacity &&
    isMeetingValid &&
    areCustomFieldsValid &&
    !isLoading &&
    !isUploadingFiles &&
    Object.keys(errors).length === 0
  );

  const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp', '.gif'];

  /**
   * Validates and stages selected files locally.
   * No upload happens here — files are held as File objects until form submit.
   */
  const handleSelectFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const valid = [];

    for (const file of fileList) {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        addToast(`"${file.name}" has an unsupported format. Allowed: PDF, Office docs, Images.`, 'error');
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        addToast(`"${file.name}" exceeds the 25MB limit.`, 'error');
        continue;
      }
      // Deduplicate by name+size
      const isDuplicate = pendingFiles.some(
        (existing) => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        addToast(`"${file.name}" is already attached.`, 'warn');
        continue;
      }
      valid.push(file);
    }

    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveProof = (indexToRemove) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Step 1: Upload any staged files to Storage before submitting the form
    let uploadedProofs = [];
    if (pendingFiles.length > 0) {
      setIsUploadingFiles(true);
      setUploadProgress({ current: 0, total: pendingFiles.length });
      const uploadFolder = `franchise_applications/${franchiseAppId}/proofs`;

      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        try {
          const res = await uploadFileToBackend(file, uploadFolder, userToken);
          uploadedProofs.push({
            name: file.name,
            fileName: res.fileName || file.name,
            storagePath: res.storagePath,
            url: res.url,
            size: res.fileSize || file.size,
            type: res.contentType || file.type || 'application/octet-stream'
          });
        } catch (err) {
          addToast(`Failed to upload "${file.name}": ${err.message}`, 'error');
        }
        setUploadProgress({ current: i + 1, total: pendingFiles.length });
      }

      setIsUploadingFiles(false);
      setUploadProgress({ current: 0, total: 0 });
    }

    // Step 2: Build the final lean payload
    const addressParts = [formData.barangay, formData.municipality, formData.province];
    if (formData.building.trim()) addressParts.unshift(formData.building.trim());
    const preferredBranchLocation = addressParts.filter(Boolean).join(', ');

    // eslint-disable-next-line no-unused-vars
    const { provinceCode, municipalityCode, preferredMeetingTime, ...rest } = formData;

    const payload = {
      ...rest,
      id: franchiseAppId,
      preferredBranchLocation,
      preferredMeetingDate: formData.noPreferenceSchedule ? '' : formData.preferredMeetingDate,
      preferredMeetingStartTime: formData.noPreferenceSchedule ? '' : formData.preferredMeetingStartTime,
      preferredMeetingEndTime: formData.noPreferenceSchedule ? '' : formData.preferredMeetingEndTime,
      noPreferenceSchedule: Boolean(formData.noPreferenceSchedule),
      proofOfCapability: uploadedProofs
    };

    // Step 3: Submit the application
    ApiCaller(
      `${API_BASE_URL}/api/franchise/applications`,
      'POST',
      payload,
      {},
      () => {
        onClose();
        setFormData(EMPTY_FORM);
        setPendingFiles([]);
        setErrors({});
        setFranchiseAppId(generateFranchiseId());
        addToast('Application submitted successfully!', 'success');
      },
      (error) => {
        addToast('Error submitting application: ' + error.message, 'error');
        console.error('Application submission error:', error);
      },
      setIsLoading
    );
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setFormData(EMPTY_FORM);
      setPendingFiles([]);
      setErrors({});
      setFranchiseAppId(generateFranchiseId());
      setIsRendered(false);
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading && !isUploadingFiles) {
      handleClose();
    }
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isRendered && !isClosing && !isLoading && !isUploadingFiles) {
        handleClose();
      }
    };
    if (isRendered) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRendered, isClosing, isLoading, isUploadingFiles]);

  if (!isRendered) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  return createPortal(
    <div
      className={`modalOverlay ${isClosing ? 'modalOverlay--closing' : 'modalOverlay--entering'}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Franchise Application Form"
    >
      <div className={`modal ${isClosing ? 'modal--closing' : 'modal--entering'}`}>
        <button className="closeBtn" onClick={handleClose} aria-label="Close modal">
          <i className="fa-solid fa-circle-xmark" />
        </button>

        <div className="modalHeader">
          <i className="fa-solid fa-briefcase" style={{ color: '#ff843d', fontSize: '24px' }} />
          <h2>Apply for Fairfly Franchise</h2>
        </div>

        <p className="modalDescription">
          Join our growing family of successful franchisees. Fill out this form to
          schedule a meeting with our franchise development team. We&apos;ll contact
          you within 2-3 business days.
        </p>

        <form className="franchiseApplicationForm" onSubmit={handleSubmit} noValidate>

          {/* Row 1: First Name — Middle Initial — Last Name */}
          <div className="formRow formRow--name">
            <div className="formGroup">
              <label htmlFor="faf-firstName">First Name *</label>
              <input
                id="faf-firstName"
                type="text"
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
              {errors.firstName && <p className="error">{errors.firstName}</p>}
            </div>

            <div className="formGroup formGroup--mi">
              <label htmlFor="faf-middleInitial">M.I.</label>
              <input
                id="faf-middleInitial"
                type="text"
                placeholder="D."
                maxLength={3}
                value={formData.middleInitial}
                onChange={(e) => set('middleInitial', e.target.value)}
              />
            </div>

            <div className="formGroup">
              <label htmlFor="faf-lastName">Last Name *</label>
              <input
                id="faf-lastName"
                type="text"
                placeholder="Dela Cruz"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
              {errors.lastName && <p className="error">{errors.lastName}</p>}
            </div>
          </div>

          {/* Row 2: Email — Phone */}
          <div className="formRow">
            <div className="formGroup">
              <label htmlFor="faf-email">Email Address *</label>
              <input
                id="faf-email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
              {errors.email && <p className="error">{errors.email}</p>}
            </div>

            <div className="formGroup">
              <label htmlFor="faf-phone">Phone Number *</label>
              <input
                id="faf-phone"
                type="tel"
                placeholder="+63 912 345 6789"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                required
              />
              {errors.phoneNumber && <p className="error">{errors.phoneNumber}</p>}
            </div>
          </div>

          {/* Address Section */}
          <div className="formSection">
            <p className="formSectionLabel">
              <i className="fa-solid fa-location-dot" /> Preferred Branch Location *
            </p>

            {/* Province — Municipality */}
            <div className="formRow">
              <div className="formGroup">
                <label htmlFor="faf-province">Province</label>
                <select
                  id="faf-province"
                  value={formData.provinceCode}
                  onChange={handleProvinceChange}
                  disabled={loadingProvinces}
                  required
                >
                  <option value="">
                    {loadingProvinces ? 'Loading provinces...' : 'Select province'}
                  </option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="faf-municipality">City / Municipality</label>
                <select
                  id="faf-municipality"
                  value={formData.municipalityCode}
                  onChange={handleMunicipalityChange}
                  disabled={!formData.provinceCode || loadingMunicipalities}
                  required
                >
                  <option value="">
                    {loadingMunicipalities ? 'Loading...' : (!formData.provinceCode ? 'Select province first' : 'Select city/municipality')}
                  </option>
                  {municipalities.map((m) => (
                    <option key={m.code} value={m.code}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barangay — Building */}
            <div className="formRow">
              <div className="formGroup">
                <label htmlFor="faf-barangay">Barangay</label>
                <select
                  id="faf-barangay"
                  value={formData.barangay}
                  onChange={(e) => set('barangay', e.target.value)}
                  disabled={!formData.municipalityCode || loadingBarangays}
                  required
                >
                  <option value="">
                    {loadingBarangays ? 'Loading...' : (!formData.municipalityCode ? 'Select city first' : 'Select barangay')}
                  </option>
                  {barangays.map((b) => (
                    <option key={b.code} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="formGroup">
                <label htmlFor="faf-building">Building / Unit <span className="optional">(Optional)</span></label>
                <input
                  id="faf-building"
                  type="text"
                  placeholder="e.g., Unit 3A, Main Street"
                  value={formData.building}
                  onChange={(e) => set('building', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Business Experience */}
          <div className="formGroup">
            <label htmlFor="faf-experience">Business Experience *</label>
            <select
              id="faf-experience"
              value={formData.businessExperience}
              onChange={(e) => set('businessExperience', e.target.value)}
              required
            >
              {BUSINESS_EXPERIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Investment Capacity */}
          <div className="formGroup">
            <label htmlFor="faf-investment">Investment Capacity *</label>
            <select
              id="faf-investment"
              value={formData.investmentCapacity}
              onChange={(e) => set('investmentCapacity', e.target.value)}
              required
            >
              {INVESTMENT_CAPACITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Preferred Meeting Schedule Section */}
          <div className="formSection">
            <div className="formSectionLabel">
              <i className="fa-regular fa-calendar-check" /> Consultation Schedule Preference
            </div>

            <div className="faf-checkbox-group">
              <label className="faf-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.noPreferenceSchedule}
                  onChange={(e) => set('noPreferenceSchedule', e.target.checked)}
                />
                <span>No preference / Let Fairfly Admin schedule my consultation</span>
              </label>
            </div>

            {!formData.noPreferenceSchedule && (
              <>
                <div className="formRow">
                  <div className="formGroup">
                    <label htmlFor="faf-date">Preferred Meeting Date *</label>
                    <input
                      id="faf-date"
                      type="date"
                      min={todayStr}
                      value={formData.preferredMeetingDate}
                      onChange={(e) => handleChange('preferredMeetingDate', e.target.value)}
                      required={!formData.noPreferenceSchedule}
                    />
                    {errors.preferredMeetingDate && (
                      <p className="error">{errors.preferredMeetingDate}</p>
                    )}
                  </div>

                  <div className="formRow" style={{ gap: '8px' }}>
                    <div className="formGroup">
                      <label htmlFor="faf-start-time">Start Time *</label>
                      <input
                        id="faf-start-time"
                        type="time"
                        value={formData.preferredMeetingStartTime}
                        onChange={(e) => set('preferredMeetingStartTime', e.target.value)}
                        required={!formData.noPreferenceSchedule}
                      />
                    </div>
                    <div className="formGroup">
                      <label htmlFor="faf-end-time">End Time *</label>
                      <input
                        id="faf-end-time"
                        type="time"
                        value={formData.preferredMeetingEndTime}
                        onChange={(e) => set('preferredMeetingEndTime', e.target.value)}
                        required={!formData.noPreferenceSchedule}
                      />
                    </div>
                  </div>
                </div>

                {formData.preferredMeetingStartTime && formData.preferredMeetingEndTime &&
                 formData.preferredMeetingStartTime >= formData.preferredMeetingEndTime && (
                  <p className="error" style={{ marginTop: '-8px' }}>
                    Start time must be earlier than end time.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Proof of Capability Upload Section */}
          <div className="formSection">
            <div className="formSectionLabel">
              <i className="fa-solid fa-file-shield" /> Proof of Capability & Documents
            </div>
            <p className="faf-section-desc">
              Attach supporting documents (Financial capacity, DTI / SEC permit, Government IDs, or Bank Statements). Supported formats: PDF, Word, Excel, Images (Max 25MB).
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif"
              style={{ display: 'none' }}
              onChange={(e) => handleSelectFiles(e.target.files)}
            />

            {/* Dropzone - files are staged locally and uploaded when the form is submitted */}
            <div
              className="faf-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  handleSelectFiles(e.dataTransfer.files);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Attach capability documents"
            >
              <div className="faf-dropzone-idle">
                <i className="fa-solid fa-cloud-arrow-up faf-upload-icon" />
                <p className="faf-dropzone-text">
                  <strong>Click to attach</strong> or drag &amp; drop documents here
                </p>
                <span className="faf-dropzone-sub">
                  PDF, DOCX, XLSX, PNG, JPG up to 25MB each - uploaded when you submit
                </span>
              </div>
            </div>

            {/* Staged File Chips — files are held locally and uploaded on submit */}
            {pendingFiles.length > 0 && (
              <div className="faf-proofs-list">
                <span className="faf-proofs-count">
                  {pendingFiles.length} {pendingFiles.length === 1 ? 'file' : 'files'} ready to upload:
                </span>
                <div className="faf-proofs-chips">
                  {pendingFiles.map((file, idx) => {
                    const ext = (file.name || '').split('.').pop().toLowerCase();
                    const iconClass = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
                      ? 'fa-solid fa-file-image'
                      : ext === 'pdf'
                      ? 'fa-solid fa-file-pdf'
                      : ['doc', 'docx'].includes(ext)
                      ? 'fa-solid fa-file-word'
                      : ['xls', 'xlsx'].includes(ext)
                      ? 'fa-solid fa-file-excel'
                      : 'fa-solid fa-file-lines';

                    const sizeLabel = file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : '';

                    return (
                      <div key={`${file.name}-${file.size}-${idx}`} className="faf-file-chip">
                        <i className={`${iconClass} faf-chip-icon`} />
                        <span className="faf-chip-name" title={file.name}>
                          {file.name}
                        </span>
                        {sizeLabel && <span className="faf-chip-size">({sizeLabel})</span>}
                        <button
                          type="button"
                          className="faf-chip-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveProof(idx);
                          }}
                          aria-label={`Remove ${file.name}`}
                          title="Remove file"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Dynamic Fields (if configured by admin) */}
          {customFieldsSchema.length > 0 && (
            <div className="formSection">
              <div className="formSectionLabel">
                <i className="fa-solid fa-list-check" /> Additional Requirements
              </div>
              {customFieldsSchema.map((field) => (
                <div className="formGroup" key={field.id}>
                  <label htmlFor={`cf-${field.id}`}>
                    {field.label} {field.required ? '*' : <span className="optional">(Optional)</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      id={`cf-${field.id}`}
                      placeholder={field.placeholder || ''}
                      value={formData.customFields?.[field.id] || ''}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      disabled={isLoading}
                      rows={3}
                      required={field.required}
                    />
                  ) : (
                    <input
                      id={`cf-${field.id}`}
                      type={field.type || 'text'}
                      placeholder={field.placeholder || ''}
                      value={formData.customFields?.[field.id] || ''}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      disabled={isLoading}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Additional Information */}
          <div className="formGroup">
            <label htmlFor="faf-additional">
              Additional Information <span className="optional">(Optional)</span>
            </label>
            <textarea
              id="faf-additional"
              rows={3}
              placeholder="Tell us about your business goals, questions, or anything else..."
              value={formData.additionalMessage}
              onChange={(e) => set('additionalMessage', e.target.value)}
            />
          </div>

          <div className="formActions">
            <button type="submit" className="submitBtn" disabled={!isFormValid || isLoading || isUploadingFiles}>
              {isUploadingFiles ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Uploading {uploadProgress.current}/{uploadProgress.total}...
                </>
              ) : isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
            <button type="button" className="cancelBtn" onClick={handleClose} disabled={isLoading || isUploadingFiles}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
