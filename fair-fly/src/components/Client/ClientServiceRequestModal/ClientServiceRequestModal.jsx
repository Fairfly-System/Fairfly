import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import toFriendlyMessage from '../../../utils/friendlyErrors';
import { createInquiry } from '../../../services/inquiryService';
import BranchSelectSearch from '../../UI/BranchSelectSearch/BranchSelectSearch';
import '../ClientInquiryModal/client-inquiry-modal.css';
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

  // Form State corresponding to SAF-01-002 (matching ClientInquiryModal)
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
  const [address, setAddress] = useState('');
  const [telNo, setTelNo] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [email, setEmail] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [isNo, setIsNo] = useState('');
  const [selectedBranchUid, setSelectedBranchUid] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || '');
  const [specifiedRequirements, setSpecifiedRequirements] = useState('');
  const [remarks, setRemarks] = useState('');

  // When initialServiceId changes, sync selectedServiceId
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    }
  }, [initialServiceId, isOpen]);

  // Prefill client information if user is logged in
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
  }, [user, userDetails, isOpen]);

  // Fetch services (filtered to only services with workflows) and branch options
  useEffect(() => {
    if (!isOpen) return;

    setLoadingOptions(true);

    const loadOptions = async () => {
      try {
        // 1. Fetch Services options for dropdown (only active with workflows)
        ApiCaller(
          `${API_BASE_URL}/api/services`,
          'GET',
          null,
          userToken ? { Authorization: `Bearer ${userToken}` } : {},
          (data) => {
            const list = Array.isArray(data) ? data : [];
            const activeOnly = list.filter(
              (s) => s.status !== 'Inactive' && s.status !== 'Disabled' && Array.isArray(s.workflowIds) && s.workflowIds.length > 0
            );
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
              if (!selectedBranchUid && !lockedBranchUid) {
                setSelectedBranchUid(branches[0].uid || branches[0].id);
              }
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
          .filter(
            (s) => s.status !== 'Inactive' && s.status !== 'Disabled' && Array.isArray(s.workflowIds) && s.workflowIds.length > 0
          );
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
              id: doc.id,
              branchName: data.branchName || data.name || 'Branch Operator',
              name: data.branchName || data.name || 'Branch Operator',
              address: data.address || data.location || '',
              location: data.location || data.address || '',
              email: data.email || '',
              status: data.status || 'Active'
            };
          })
          .filter((b) => b.status !== 'Inactive');
        if (list.length > 0) {
          setBranchesList(list);
          if (!selectedBranchUid && !lockedBranchUid) {
            setSelectedBranchUid(list[0].uid);
          }
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

  // Form validity check (requires valid name, mandatory email, cellphone, requirements, and selected branch/service)
  const isFormValid = useMemo(() => {
    const hasValidName = clientType === 'company'
      ? Boolean(companyName.trim() && contactPersonFirstName.trim() && contactPersonLastName.trim())
      : Boolean(firstName.trim() && lastName.trim());

    const hasValidEmail = Boolean(email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

    return Boolean(
      selectedServiceId &&
      selectedBranchUid &&
      hasValidName &&
      hasValidEmail &&
      cellphone.trim() &&
      specifiedRequirements.trim()
    );
  }, [
    selectedServiceId,
    selectedBranchUid,
    clientType,
    companyName,
    contactPersonFirstName,
    contactPersonLastName,
    firstName,
    lastName,
    email,
    cellphone,
    specifiedRequirements
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedServiceId) {
      addToast('Please select a service', 'warning');
      return;
    }
    if (!selectedBranchUid) {
      addToast('Please select a preferred processing branch', 'warning');
      return;
    }

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
      addToast('A valid Email Address is mandatory for all inquiries', 'warning');
      return;
    }

    if (!cellphone.trim()) {
      addToast('Please provide a cellphone number', 'warning');
      return;
    }

    if (!specifiedRequirements.trim()) {
      addToast('Please enter your specified requirements or service details', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const matchedBranch = branchesList.find((b) => (b.uid || b.id) === selectedBranchUid);

      const resolvedClientName = clientType === 'company'
        ? companyName.trim()
        : [firstName.trim(), middleInitial.trim(), lastName.trim()].filter(Boolean).join(' ');

      const resolvedContactPerson = clientType === 'company'
        ? [contactPersonFirstName.trim(), contactPersonMiddleInitial.trim(), contactPersonLastName.trim()].filter(Boolean).join(' ')
        : (contactPerson.trim() || resolvedClientName);

      const payload = {
        formNo: 'SAF-01-002',
        controlNo: `23-${Math.floor(100 + Math.random() * 900)}`,
        clientType,
        companyName: clientType === 'company' ? companyName.trim() : '',
        clientName: resolvedClientName,
        firstName: (clientType === 'company' ? contactPersonFirstName : firstName).trim(),
        middleInitial: (clientType === 'company' ? contactPersonMiddleInitial : middleInitial).trim(),
        lastName: (clientType === 'company' ? contactPersonLastName : lastName).trim(),
        contactPerson: resolvedContactPerson,
        population: population.trim(),
        address: address.trim(),
        cellphone: cellphone.trim(),
        phoneNumber: cellphone.trim(),
        telNo: telNo.trim(),
        email: email.trim().toLowerCase(),
        contractNo: contractNo.trim(),
        isNo: isNo.trim(),
        serviceId: selectedServiceId,
        serviceType: selectedService?.name || 'Requested Service',
        servicesOffered: [selectedService?.name || 'Requested Service'],
        servicePrice: selectedService?.price || '',
        specifiedRequirements: specifiedRequirements.trim(),
        notes: remarks.trim(),
        remarks: remarks.trim(),
        branchUid: selectedBranchUid,
        branchName: matchedBranch ? (matchedBranch.branchName || matchedBranch.name) : 'Branch Operator',
        clientUid: user?.uid || null,
        isWalkIn: false,
        workflow: 'online',
        status: 'submitted'
      };

      createInquiry(
        userToken,
        payload,
        (res) => {
          addToast(
            `Inquiry for "${payload.serviceType}" submitted to ${payload.branchName}. The branch operator will review and prepare your quotation.`,
            'success'
          );
          if (onRequestSuccess) onRequestSuccess(res);
          setIsSubmitting(false);
          onClose();
        },
        (error) => {
          addToast(toFriendlyMessage(error, 'Unable to submit your service inquiry. Please try again.'), 'error');
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      addToast(toFriendlyMessage(err, 'An error occurred while submitting your inquiry. Please try again.'), 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="72rem"
      width="95%"
      title="Submit Service Inquiry (SAF-01-002)"
      subtitle="Intake client specifications and requirements for your selected service"
      isLoading={isSubmitting}
    >
      {loadingOptions ? (
        <div className="client-request-form form-column client-req-form-spaced" aria-busy="true" style={{ gap: '1.25rem' }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '1.2rem', marginBottom: '0.5rem' }} />
          <div className="skeleton skeleton-input" style={{ width: '100%', height: '3rem', borderRadius: '0px' }} />
          <div className="skeleton skeleton-input" style={{ width: '100%', height: '12rem', borderRadius: '0px' }} />
        </div>
      ) : (
        <form className="client-inquiry-modal-form" onSubmit={handleSubmit}>
          {/* Header Callout Banner */}
          <div className="inquiry-intro-callout">
            <i className="fa-solid fa-circle-info"></i>
            <div>
              <strong>FairFly Service Inquiry Intake:</strong> Fill out your specifications below. Once submitted, your preferred branch operator will review your requirements and provide an official commercial quotation.
            </div>
          </div>

          {/* Section 1: Client Information */}
          <div className="inquiry-section">
            <h3 className="inquiry-section-title">
              <i className="fa-solid fa-user"></i> 1. Client Information
            </h3>

            <div className="inquiry-form-grid">
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
                    <label htmlFor="req-companyName">
                      Company / Organization Name <span className="req-star">*</span>
                    </label>
                    <input
                      id="req-companyName"
                      type="text"
                      className="input-base"
                      placeholder="e.g. Acme Travel & Tours Corp."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Contact Person Name */}
                  <div className="inquiry-field-group col-span-2" style={{ marginTop: '0.25rem' }}>
                    <label style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
                      Contact Person Name (Representative) <span className="req-star">*</span>
                    </label>
                  </div>

                  <div className="inquiry-name-row">
                    <div className="inquiry-field-group">
                      <label htmlFor="req-cpFirstName">
                        First Name <span className="req-star">*</span>
                      </label>
                      <input
                        id="req-cpFirstName"
                        type="text"
                        className="input-base"
                        placeholder="Juan"
                        value={contactPersonFirstName}
                        onChange={(e) => setContactPersonFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="inquiry-field-group mi-input">
                      <label htmlFor="req-cpMiddleInitial">M.I.</label>
                      <input
                        id="req-cpMiddleInitial"
                        type="text"
                        className="input-base"
                        placeholder="D."
                        maxLength={3}
                        value={contactPersonMiddleInitial}
                        onChange={(e) => setContactPersonMiddleInitial(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="inquiry-field-group">
                      <label htmlFor="req-cpLastName">
                        Last Name <span className="req-star">*</span>
                      </label>
                      <input
                        id="req-cpLastName"
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
                  {/* Individual Name Row */}
                  <div className="inquiry-field-group col-span-2">
                    <label style={{ fontWeight: 700, color: 'var(--text-dark, #0f172a)' }}>
                      Full Name <span className="req-star">*</span>
                    </label>
                  </div>
                  <div className="inquiry-name-row">
                    <div className="inquiry-field-group">
                      <label htmlFor="req-firstName">
                        First Name <span className="req-star">*</span>
                      </label>
                      <input
                        id="req-firstName"
                        type="text"
                        className="input-base"
                        placeholder="Juan"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="inquiry-field-group mi-input">
                      <label htmlFor="req-middleInitial">M.I.</label>
                      <input
                        id="req-middleInitial"
                        type="text"
                        className="input-base"
                        placeholder="D."
                        maxLength={3}
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="inquiry-field-group">
                      <label htmlFor="req-lastName">
                        Last Name <span className="req-star">*</span>
                      </label>
                      <input
                        id="req-lastName"
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
                <label htmlFor="req-population">Population / Pax Count</label>
                <input
                  id="req-population"
                  type="text"
                  className="input-base"
                  placeholder="e.g. 45 pax, 1 family, 2 adults"
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                />
              </div>

              <div className="inquiry-field-group col-span-2">
                <label htmlFor="req-address">Complete Address</label>
                <input
                  id="req-address"
                  type="text"
                  className="input-base"
                  placeholder="Complete street, city, province"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="inquiry-field-group">
                <label htmlFor="req-cellphone">
                  Cellphone No. <span className="req-star">*</span>
                </label>
                <input
                  id="req-cellphone"
                  type="tel"
                  className="input-base"
                  placeholder="0912 345 6789"
                  value={cellphone}
                  onChange={(e) => setCellphone(e.target.value)}
                  required
                />
              </div>

              <div className="inquiry-field-group">
                <label htmlFor="req-telNo">Telephone No.</label>
                <input
                  id="req-telNo"
                  type="tel"
                  className="input-base"
                  placeholder="(044) 123 4567"
                  value={telNo}
                  onChange={(e) => setTelNo(e.target.value)}
                />
              </div>

              <div className="inquiry-field-group col-span-2">
                <label htmlFor="req-email">
                  Email Address <span className="req-star">*</span>
                </label>
                <input
                  id="req-email"
                  type="email"
                  className="input-base"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="inquiry-field-group">
                <label htmlFor="req-contractNo">Contract No.</label>
                <input
                  id="req-contractNo"
                  type="text"
                  className="input-base"
                  placeholder="Contract number if applicable"
                  value={contractNo}
                  onChange={(e) => setContractNo(e.target.value)}
                />
              </div>

              <div className="inquiry-field-group">
                <label htmlFor="req-isNo">IS No.</label>
                <input
                  id="req-isNo"
                  type="text"
                  className="input-base"
                  placeholder="IS number if applicable"
                  value={isNo}
                  onChange={(e) => setIsNo(e.target.value)}
                />
              </div>

              {/* Debounced Franchise Search */}
              <div className="inquiry-field-group col-span-2">
                <BranchSelectSearch
                  branches={branchesList}
                  selectedBranchUid={selectedBranchUid}
                  onSelectBranch={(uid) => setSelectedBranchUid(uid)}
                  isLoading={loadingOptions}
                  label="Preferred Processing Branch *"
                  placeholder="Search branch by name, city or location..."
                  disabled={Boolean(effectiveLockedBranchUid)}
                  required
                />
                {effectiveLockedBranchUid && (
                  <span className="client-req-branch-hint" style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--purple-dark, #4338ca)' }}>
                    <i className="fa-solid fa-lock"></i> Exclusively serviced by {effectiveLockedBranchName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Selected Service Details */}
          <div className="inquiry-section">
            <h3 className="inquiry-section-title">
              <i className="fa-solid fa-concierge-bell"></i> 2. Selected Service
            </h3>

            {/* If there are multiple active services and none pre-locked, allow dropdown selection */}
            {servicesList.length > 1 && !initialServiceId && (
              <div className="inquiry-field-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="req-serviceSelect" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Change Service:
                </label>
                <select
                  id="req-serviceSelect"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="input-base"
                >
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price || 'Standard Fee'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Service Card Preview */}
            {selectedService ? (
              <div className="client-req-service-details-box" style={{ borderRadius: '0px', marginTop: '0.25rem' }}>
                {selectedService.coverImage || selectedService.coverPhoto ? (
                  <img
                    src={selectedService.coverImage || selectedService.coverPhoto}
                    alt={selectedService.name}
                    className="client-req-service-details-img"
                  />
                ) : (
                  <div className="client-req-service-details-placeholder">
                    <i className="fa-solid fa-passport"></i>
                  </div>
                )}

                <div className="client-req-service-meta-col">
                  <div className="client-req-service-header-row">
                    <strong className="client-req-service-name">{selectedService.name}</strong>
                    <span className="client-req-service-price">
                      {selectedService.price
                        ? (selectedService.price.startsWith('₱') || selectedService.price.startsWith('PHP')
                            ? selectedService.price
                            : `₱${Number(selectedService.price).toLocaleString('en-US')}`)
                        : 'Standard Fee'}
                    </span>
                  </div>

                  <div className="client-req-tags-row">
                    <span className="client-req-category-tag">
                      {selectedService.category || 'General Services'}
                    </span>
                    {Array.isArray(selectedService.tags) && selectedService.tags.map((t, idx) => (
                      <span key={idx} className="client-req-type-pill">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {selectedService.description && (
                    <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-mid, #475569)', lineHeight: 1.45 }}>
                      {selectedService.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                No active service selected.
              </div>
            )}

            {/* Informational Service Requirements Notice */}
            {serviceRequirements.length > 0 && (
              <div
                className="client-req-notice-box"
                style={{
                  background: 'var(--color-bg-secondary, #f8fafc)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '0px',
                  padding: '1rem 1.15rem',
                  marginTop: '0.75rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.35rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--color-text, #0f172a)'
                  }}
                >
                  <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--purple, #5558E3)' }}></i>
                  <span>Documents & Requirements for this Service ({serviceRequirements.length})</span>
                </div>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-muted, #64748b)',
                    margin: '0 0 0.65rem 0',
                    lineHeight: 1.45
                  }}
                >
                  No document uploads are required at this stage. Once the branch operator reviews your inquiry and sends your official commercial quotation, you will be invited to attach and verify these requirements prior to accepting the quotation.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {serviceRequirements.map((req, idx) => {
                    const reqName = typeof req === 'string' ? req : req.name || req.title || `Requirement ${idx + 1}`;
                    const isReq = typeof req === 'object' ? req.required !== false : true;
                    return (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.25rem 0.55rem',
                          background: 'var(--color-surface, #ffffff)',
                          border: '1px solid var(--color-border, #e2e8f0)',
                          borderRadius: '0px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--color-text, #334155)'
                        }}
                      >
                        <i className="fa-regular fa-file" style={{ fontSize: '0.75rem', opacity: 0.7 }}></i>
                        <span>{reqName}</span>
                        {isReq && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Specified Requirements of Client */}
          <div className="inquiry-section">
            <h3 className="inquiry-section-title">
              <i className="fa-solid fa-clipboard-list"></i> 3. Specified Requirements of Client <span className="req-star">*</span>
            </h3>
            <p className="inquiry-field-hint" style={{ fontSize: '0.8125rem', color: 'var(--text-light, #64748b)', margin: 0 }}>
              Specify your itinerary, target travel dates, destinations, number of passengers, passport expediting specifics, or special requests.
            </p>
            <textarea
              className="input-base textarea-requirements"
              rows="4"
              placeholder={`• Target dates or departure month\n• Special accommodation or vehicle preference\n• Specific document assistance needed`}
              value={specifiedRequirements}
              onChange={(e) => setSpecifiedRequirements(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Section 4: Remarks & Special Instructions */}
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
              disabled={isSubmitting || !isFormValid || servicesList.length === 0}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Submitting Inquiry...</span>
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
      )}
    </BaseModal>
  );
}
