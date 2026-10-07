import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { createInquiry } from '../../../services/inquiryService';
import BranchSelectSearch from '../../UI/BranchSelectSearch/BranchSelectSearch';
import './client-inquiry-modal.css';

const OFFICIAL_SERVICES = [
  'NSO',
  'Passport',
  'VISA Assistance',
  'Package Tour',
  'Ticket',
  'Others'
];

export default function ClientInquiryModal({ isOpen, onClose, onInquirySubmitted }) {
  const { user, userToken, userDetails } = useAuthContext();
  const { addToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchesList, setBranchesList] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Form State corresponding to SAF-01-002
  const [clientType, setClientType] = useState('individual'); // 'individual' | 'company'
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactPersonFirstName, setContactPersonFirstName] = useState('');
  const [contactPersonMiddleInitial, setContactPersonMiddleInitial] = useState('');
  const [contactPersonLastName, setContactPersonLastName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [population, setPopulation] = useState('');
  const [address, setAddress] = useState(userDetails?.address || '');
  const [telNo, setTelNo] = useState(userDetails?.telNo || userDetails?.telephoneNumber || '');
  const [cellphone, setCellphone] = useState(
    userDetails?.phone || userDetails?.phoneNumber || userDetails?.contactNumber || userDetails?.cellphone || user?.phoneNumber || ''
  );
  const [email, setEmail] = useState(userDetails?.email || user?.email || '');
  const [contractNo, setContractNo] = useState('');
  const [isNo, setIsNo] = useState('');
  const [selectedBranchUid, setSelectedBranchUid] = useState('');
  const [selectedServices, setSelectedServices] = useState(['Package Tour']);
  const [specifiedRequirements, setSpecifiedRequirements] = useState('');
  const [remarks, setRemarks] = useState('');

  // Prefill user details when opening or when user details become available
  useEffect(() => {
    if (isOpen && (userDetails || user)) {
      const rawFullName = (userDetails?.fullName || userDetails?.name || userDetails?.displayName || user?.displayName || '').trim();
      const nameParts = rawFullName ? rawFullName.split(/\s+/) : [];
      const initialFirst = userDetails?.firstName || nameParts[0] || '';
      const initialLast = userDetails?.lastName || (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');
      const initialMiddle = userDetails?.middleInitial || (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');

      const resolvedPhone = userDetails?.phone || userDetails?.phoneNumber || userDetails?.contactNumber || userDetails?.cellphone || user?.phoneNumber || '';
      const resolvedEmail = userDetails?.email || user?.email || '';
      const resolvedAddress = userDetails?.address || '';
      const resolvedTel = userDetails?.telNo || userDetails?.telephoneNumber || '';

      if (initialFirst) {
        setFirstName((prev) => prev || initialFirst);
        setContactPersonFirstName((prev) => prev || initialFirst);
      }
      if (initialMiddle) {
        setMiddleInitial((prev) => prev || initialMiddle);
        setContactPersonMiddleInitial((prev) => prev || initialMiddle);
      }
      if (initialLast) {
        setLastName((prev) => prev || initialLast);
        setContactPersonLastName((prev) => prev || initialLast);
      }
      if (rawFullName) setContactPerson((prev) => prev || rawFullName);
      if (resolvedPhone) setCellphone(resolvedPhone);
      if (resolvedEmail) setEmail(resolvedEmail);
      if (resolvedAddress) setAddress(resolvedAddress);
      if (resolvedTel) setTelNo(resolvedTel);
    }
  }, [isOpen, user, userDetails]);

  // Load branches
  useEffect(() => {
    if (!isOpen) return;

    const fetchBranchesFirestore = async () => {
      try {
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        const q = query(collection(db, 'users'), where('role', '==', 'operator'));
        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            uid: doc.id,
            id: doc.id,
            branchName: d.branchName || d.name || 'Branch Operator',
            name: d.branchName || d.name || 'Branch Operator',
            address: d.address || d.location || '',
            location: d.location || d.address || '',
            email: d.email || ''
          };
        });
        if (list.length > 0) {
          setBranchesList(list);
          setSelectedBranchUid((prev) => prev || list[0].uid);
        }
        setLoadingBranches(false);
      } catch (err) {
        console.warn('Firestore fallback branch load failed:', err);
        setLoadingBranches(false);
      }
    };

    setLoadingBranches(true);
    ApiCaller(
      `${API_BASE_URL}/api/operators/branches`,
      'GET',
      null,
      userToken ? { Authorization: `Bearer ${userToken}` } : {},
      (data) => {
        const branches = Array.isArray(data) ? data : [];
        if (branches.length > 0) {
          setBranchesList(branches);
          setSelectedBranchUid((prev) => prev || branches[0].uid || branches[0].id);
          setLoadingBranches(false);
        } else {
          fetchBranchesFirestore();
        }
      },
      (err) => {
        console.warn('Could not load branch operators from API, attempting fallback:', err);
        fetchBranchesFirestore();
      }
    );
  }, [isOpen, userToken]);

  const isFormValid = useMemo(() => {
    const hasValidName = clientType === 'company'
      ? Boolean(companyName.trim() && contactPersonFirstName.trim() && contactPersonLastName.trim())
      : Boolean(firstName.trim() && lastName.trim());

    const hasValidEmail = Boolean(email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

    return Boolean(
      hasValidName &&
      hasValidEmail &&
      cellphone.trim() &&
      selectedServices.length > 0 &&
      specifiedRequirements.trim() &&
      (!branchesList.length || selectedBranchUid)
    );
  }, [clientType, companyName, contactPersonFirstName, contactPersonLastName, firstName, lastName, cellphone, email, selectedServices, specifiedRequirements, branchesList, selectedBranchUid]);

  if (!isOpen) return null;

  const handleToggleService = (srv) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (clientType === 'company') {
      if (!companyName.trim()) {
        addToast('Please enter the company name', 'warning');
        return;
      }
      if (!contactPersonFirstName.trim()) {
        addToast('Please enter the contact person first name', 'warning');
        return;
      }
      if (!contactPersonLastName.trim()) {
        addToast('Please enter the contact person last name', 'warning');
        return;
      }
    } else {
      if (!firstName.trim()) {
        addToast('Please enter your first name', 'warning');
        return;
      }
      if (!lastName.trim()) {
        addToast('Please enter your last name', 'warning');
        return;
      }
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast('Please provide a valid email address (mandatory)', 'warning');
      return;
    }
    if (!cellphone.trim()) {
      addToast('Please provide a cellphone number', 'warning');
      return;
    }
    if (selectedServices.length === 0) {
      addToast('Please select at least one service category', 'warning');
      return;
    }
    if (!specifiedRequirements.trim()) {
      addToast('Please describe what you want in the Specified Requirements section', 'warning');
      return;
    }

    const selectedBranchObj = branchesList.find((b) => (b.uid || b.id) === selectedBranchUid);
    const resolvedClientName = clientType === 'company'
      ? companyName.trim()
      : [firstName.trim(), middleInitial.trim(), lastName.trim()].filter(Boolean).join(' ');

    const resolvedContactPerson = clientType === 'company'
      ? [contactPersonFirstName.trim(), contactPersonMiddleInitial.trim(), contactPersonLastName.trim()].filter(Boolean).join(' ')
      : (contactPerson.trim() || resolvedClientName);

    const payload = {
      clientUid: user?.uid || null,
      clientType,
      companyName: clientType === 'company' ? companyName.trim() : '',
      clientName: resolvedClientName,
      firstName: (clientType === 'company' ? contactPersonFirstName : firstName).trim(),
      middleInitial: (clientType === 'company' ? contactPersonMiddleInitial : middleInitial).trim(),
      lastName: (clientType === 'company' ? contactPersonLastName : lastName).trim(),
      contactPerson: resolvedContactPerson,
      contactPersonFirstName: (clientType === 'company' ? contactPersonFirstName : firstName).trim(),
      contactPersonMiddleInitial: (clientType === 'company' ? contactPersonMiddleInitial : middleInitial).trim(),
      contactPersonLastName: (clientType === 'company' ? contactPersonLastName : lastName).trim(),
      population: population.trim(),
      address: address.trim(),
      telNo: telNo.trim(),
      cellphone: cellphone.trim(),
      email: email.trim(),
      contractNo: contractNo.trim(),
      isNo: isNo.trim(),
      branchUid: selectedBranchUid || null,
      branchName: selectedBranchObj?.branchName || selectedBranchObj?.name || 'Main Branch',
      servicesOffered: selectedServices,
      serviceType: selectedServices.join(', '),
      specifiedRequirements: specifiedRequirements.trim(),
      remarks: remarks.trim(),
      formNo: 'SAF-01-002',
      isWalkIn: false,
      workflow: 'online',
      status: 'submitted'
    };

    setIsSubmitting(true);
    createInquiry(
      userToken,
      payload,
      (res) => {
        setIsSubmitting(false);
        addToast(
          'Inquiry submitted successfully! Our operators will review your specifications and generate a quotation.',
          'success'
        );
        if (onInquirySubmitted) {
          onInquirySubmitted(res);
        }
        onClose();
      },
      (err) => {
        setIsSubmitting(false);
        console.error('Error submitting inquiry:', err);
        addToast(err?.message || 'Failed to submit inquiry. Please try again.', 'danger');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="modal-title-with-badge">
          <i className="fa-solid fa-file-signature modal-title-icon inquiry-modal-title-icon"></i>
          <span>Official Service Inquiry Form</span>
          <span className="form-standard-tag">SAF-01-002</span>
        </div>
      }
      size="large"
      maxWidth="72rem"
      width="95%"
    >
      <form onSubmit={handleSubmit} className="client-inquiry-modal-form">
        <div className="inquiry-intro-callout">
          <i className="fa-solid fa-circle-info"></i>
          <div>
            <strong>Describe What You Want:</strong> Fill out your travel or document specifications below.
            Our branch operators will calculate pricing, assemble tour dates and inclusions, and send an official Quotation (ADF-07-001) for your approval.
          </div>
        </div>

        {/* Section 1: Client Information */}
        <div className="inquiry-section">
          <h3 className="inquiry-section-title">
            <i className="fa-solid fa-user-circle"></i> 1. Client Profile
          </h3>

          <div className="inquiry-fields-grid">
            {/* Client Type Selector */}
            <div className="client-type-selector">
              <span className="client-type-label">
                <i className="fa-solid fa-sliders"></i> Client Type:
              </span>
              <div className="client-type-options">
                <button
                  type="button"
                  className={`client-type-btn ${clientType === 'individual' ? 'active' : ''}`}
                  onClick={() => setClientType('individual')}
                >
                  <i className="fa-solid fa-user"></i>
                  <span>Individual</span>
                </button>
                <button
                  type="button"
                  className={`client-type-btn ${clientType === 'company' ? 'active' : ''}`}
                  onClick={() => setClientType('company')}
                >
                  <i className="fa-solid fa-building"></i>
                  <span>Company / Organization</span>
                </button>
              </div>
            </div>

            {clientType === 'company' ? (
              <>
                {/* Company Name */}
                <div className="inquiry-field-group col-span-2">
                  <label htmlFor="inq-companyName">
                    Company / Organization Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="inq-companyName"
                    type="text"
                    className="input-base"
                    placeholder="e.g. Acme Travel & Tours Corp."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                {/* Contact Person Name (3 fields: First Name, M.I., Last Name) */}
                <div className="inquiry-field-group col-span-2" style={{ marginTop: '0.25rem' }}>
                  <label style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
                    Contact Person Name (Representative) <span className="req-star">*</span>
                  </label>
                </div>

                <div className="inquiry-name-row">
                  <div className="inquiry-field-group">
                    <label htmlFor="inq-cpFirstName">
                      First Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="inq-cpFirstName"
                      type="text"
                      className="input-base"
                      placeholder="Juan"
                      value={contactPersonFirstName}
                      onChange={(e) => setContactPersonFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="inquiry-field-group mi-input">
                    <label htmlFor="inq-cpMiddleInitial">M.I.</label>
                    <input
                      id="inq-cpMiddleInitial"
                      type="text"
                      className="input-base"
                      placeholder="D."
                      maxLength={3}
                      value={contactPersonMiddleInitial}
                      onChange={(e) => setContactPersonMiddleInitial(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="inquiry-field-group">
                    <label htmlFor="inq-cpLastName">
                      Last Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="inq-cpLastName"
                      type="text"
                      className="input-base"
                      placeholder="Dela Cruz"
                      value={contactPersonLastName}
                      onChange={(e) => setContactPersonLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Individual Name Row: First Name - M.I. - Last Name */}
                <div className="inquiry-field-group col-span-2">
                  <label style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
                    Full Name <span className="req-star">*</span>
                  </label>
                </div>
                <div className="inquiry-name-row">
                  <div className="inquiry-field-group">
                    <label htmlFor="inq-firstName">
                      First Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="inq-firstName"
                      type="text"
                      className="input-base"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="inquiry-field-group mi-input">
                    <label htmlFor="inq-middleInitial">M.I.</label>
                    <input
                      id="inq-middleInitial"
                      type="text"
                      className="input-base"
                      placeholder="D."
                      maxLength={3}
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="inquiry-field-group">
                    <label htmlFor="inq-lastName">
                      Last Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="inq-lastName"
                      type="text"
                      className="input-base"
                      placeholder="Dela Cruz"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="inquiry-field-group col-span-2">
              <label htmlFor="population">Population / Pax Count</label>
              <input
                id="population"
                type="text"
                className="input-base"
                placeholder="e.g. 45 pax, 1 family"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
              />
            </div>

            <div className="inquiry-field-group col-span-2">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                className="input-base"
                placeholder="Complete street, city, province"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="inquiry-field-group">
              <label htmlFor="cellphone">
                Cellphone No. <span className="req-star">*</span>
              </label>
              <input
                id="cellphone"
                type="tel"
                className="input-base"
                placeholder="0912 345 6789"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
                required
              />
            </div>

            <div className="inquiry-field-group">
              <label htmlFor="telNo">Telephone No.</label>
              <input
                id="telNo"
                type="tel"
                className="input-base"
                placeholder="(044) 123 4567"
                value={telNo}
                onChange={(e) => setTelNo(e.target.value)}
              />
            </div>

            <div className="inquiry-field-group col-span-2">
              <label htmlFor="email">
                Email Address <span className="req-star">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="inquiry-field-group col-span-2">
              <BranchSelectSearch
                branches={branchesList}
                selectedBranchUid={selectedBranchUid}
                onSelectBranch={(uid) => setSelectedBranchUid(uid)}
                isLoading={loadingBranches}
                label="Preferred Processing Branch"
                placeholder="Search branch by name, address, or location..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Services Offered Checkboxes */}
        <div className="inquiry-section">
          <h3 className="inquiry-section-title">
            <i className="fa-solid fa-list-check"></i> 2. Services Offered (Select All That Apply) <span className="req-star">*</span>
          </h3>

          <div className="services-checkbox-grid">
            {OFFICIAL_SERVICES.map((srv) => {
              const isChecked = selectedServices.includes(srv);
              return (
                <label key={srv} className={`service-check-tile ${isChecked ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleService(srv)}
                  />
                  <span className="checkbox-custom">
                    {isChecked && <i className="fa-solid fa-check"></i>}
                  </span>
                  <span className="service-tile-label">{srv}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 3: Specified Requirements of Client */}
        <div className="inquiry-section">
          <h3 className="inquiry-section-title">
            <i className="fa-solid fa-clipboard-list"></i> 3. Specified Requirements of Client <span className="req-star">*</span>
          </h3>
          <p className="inquiry-field-hint">
            Specify what you need for this service (e.g. destinations, expected dates, number of vehicles, hotel preference, specific document types, custom tour highlights).
          </p>
          <textarea
            className="input-base textarea-requirements"
            rows="5"
            placeholder={'• (1) Unit Tourist Bus (49 Regular seats, audio/video entertainment)\n• 3D/2N Tour: QC - Bolinao - Alaminos - QC\n• Target Travel Dates: April 29 to May 1\n• Need lodging recommendations in Bolinao'}
            value={specifiedRequirements}
            onChange={(e) => setSpecifiedRequirements(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Section 4: Remarks & Notes */}
        <div className="inquiry-section">
          <h3 className="inquiry-section-title">
            <i className="fa-solid fa-comment-dots"></i> 4. Remarks & Special Instructions
          </h3>
          <textarea
            className="input-base"
            rows="3"
            placeholder="Any additional reminders, payment preference, or urgent inquiries..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="inquiry-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary inquiry-modal-submit-btn"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Submit Inquiry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
