import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import BaseModal from '../../UI/ModalBase/BaseModal';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import { createInquiry } from '../../../services/inquiryService';
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
  const [clientName, setClientName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [population, setPopulation] = useState('');
  const [address, setAddress] = useState('');
  const [telNo, setTelNo] = useState('');
  const [cellphone, setCellphone] = useState('');
  const [email, setEmail] = useState('');
  const [contractNo, setContractNo] = useState('');
  const [isNo, setIsNo] = useState('');
  const [selectedBranchUid, setSelectedBranchUid] = useState('');
  const [selectedServices, setSelectedServices] = useState(['Package Tour']);
  const [specifiedRequirements, setSpecifiedRequirements] = useState('');
  const [remarks, setRemarks] = useState('');

  // Prefill user details when opening
  useEffect(() => {
    if (isOpen) {
      if (userDetails || user) {
        setClientName(userDetails?.name || userDetails?.displayName || user?.displayName || '');
        setContactPerson(userDetails?.name || userDetails?.displayName || user?.displayName || '');
        setEmail(userDetails?.email || user?.email || '');
        setCellphone(userDetails?.phone || userDetails?.contactNumber || '');
        setAddress(userDetails?.address || '');
      }
    }
  }, [isOpen, user, userDetails]);

  // Load branches
  useEffect(() => {
    if (!isOpen) return;

    setLoadingBranches(true);
    ApiCaller(
      `${API_BASE_URL}/api/operators/branches`,
      'GET',
      null,
      userToken ? { Authorization: `Bearer ${userToken}` } : {},
      (data) => {
        const branches = Array.isArray(data) ? data : [];
        setBranchesList(branches);
        if (branches.length > 0 && !selectedBranchUid) {
          setSelectedBranchUid(branches[0].uid);
        }
        setLoadingBranches(false);
      },
      (err) => {
        console.warn('Could not load branch operators from API:', err);
        setLoadingBranches(false);
      }
    );
  }, [isOpen, userToken]);

  if (!isOpen) return null;

  const handleToggleService = (srv) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const isFormValid = useMemo(() => {
    return Boolean(
      clientName.trim() &&
      (cellphone.trim() || email.trim()) &&
      selectedServices.length > 0 &&
      specifiedRequirements.trim() &&
      (!branchesList.length || selectedBranchUid)
    );
  }, [clientName, cellphone, email, selectedServices, specifiedRequirements, branchesList, selectedBranchUid]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!clientName.trim()) {
      addToast('Please enter your full name or company name', 'warning');
      return;
    }
    if (!cellphone.trim() && !email.trim()) {
      addToast('Please provide at least a phone number or email address', 'warning');
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

    const selectedBranchObj = branchesList.find((b) => b.uid === selectedBranchUid);

    const payload = {
      clientUid: user?.uid || null,
      clientName: clientName.trim(),
      contactPerson: contactPerson.trim() || clientName.trim(),
      population: population.trim(),
      address: address.trim(),
      telNo: telNo.trim(),
      cellphone: cellphone.trim(),
      email: email.trim(),
      contractNo: contractNo.trim(),
      isNo: isNo.trim(),
      branchUid: selectedBranchUid || null,
      branchName: selectedBranchObj?.name || 'Main Branch',
      servicesOffered: selectedServices,
      serviceType: selectedServices.join(', '),
      specifiedRequirements: specifiedRequirements.trim(),
      remarks: remarks.trim(),
      formNo: 'SAF-01-002',
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
            <div className="inquiry-field-group col-span-2">
              <label htmlFor="clientName">
                Name of Client / Company <span className="req-star">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                className="input-base"
                placeholder="e.g. John Doe / Acme Travel Group"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="inquiry-field-group">
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

            <div className="inquiry-field-group">
              <label htmlFor="contactPerson">Contact Person</label>
              <input
                id="contactPerson"
                type="text"
                className="input-base"
                placeholder="Name of focal representative"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
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
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {branchesList.length > 0 && (
              <div className="inquiry-field-group col-span-2">
                <label htmlFor="preferredBranch">Preferred Processing Branch</label>
                <select
                  id="preferredBranch"
                  className="input-base"
                  value={selectedBranchUid}
                  onChange={(e) => setSelectedBranchUid(e.target.value)}
                >
                  {branchesList.map((branch) => (
                    <option key={branch.uid} value={branch.uid}>
                      {branch.name} {branch.location ? `— ${branch.location}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
            placeholder={`• (1) Unit Tourist Bus (49 Regular seats, audio/video entertainment)&#10;• 3D/2N Tour: QC - Bolinao - Alaminos - QC&#10;• Target Travel Dates: April 29 to May 1&#10;• Need lodging recommendations in Bolinao`}
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
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary inquiry-modal-submit-btn"
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
