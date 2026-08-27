import React, { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import './terms-privacy-modal.css';

export default function TermsPrivacyModal({
  isOpen,
  onClose,
  initialTab = 'terms',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="45rem"
      className="terms-privacy-modal-container"
    >
      <div className="terms-privacy-modal">
        {/* Header */}
        <div className="terms-modal-header">
          <div className="terms-modal-title-wrapper">
            <div className="terms-modal-icon-badge">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h2 className="terms-modal-title">Legal & Privacy Center</h2>
              <p className="terms-modal-subtitle">
                FairFly Travel & Documentation Franchise Services
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="terms-tab-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              className={`terms-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              <i className="fa-solid fa-file-contract"></i>
              <span>Terms of Service</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              className={`terms-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="terms-modal-body">
          {activeTab === 'terms' ? (
            <div className="terms-content-pane">
              <div className="terms-effective-badge">
                <i className="fa-regular fa-clock"></i> Last Updated: January 2026
              </div>

              <section className="terms-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By creating an account, accessing the FairFly platform, or utilizing our documentation,
                  ticketing, and tour reservation services, you agree to be bound by these Terms of Service.
                  If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="terms-section">
                <h3>2. Service Scope & Description</h3>
                <p>
                  FairFly provides streamlined document facilitation and travel booking services, including but not limited to:
                </p>
                <ul>
                  <li><strong>Passport Processing & Renewal Assistance:</strong> DFA appointment scheduling and application review.</li>
                  <li><strong>Civil Registry Documents:</strong> PSA/NSO Birth, Marriage, Death certificates, and CENOMAR processing.</li>
                  <li><strong>Visa Facilitation:</strong> Tourist and business visa consultation, checklist review, and consulate submissions.</li>
                  <li><strong>Airline Ticketing & Tour Packages:</strong> Domestic and international flight bookings and travel arrangements.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>3. User Responsibilities & Requirements</h3>
                <p>
                  When submitting service requests or booking appointments through FairFly, you certify that:
                </p>
                <ul>
                  <li>All information and personal identification documents provided are genuine, accurate, and up-to-date.</li>
                  <li>You are authorized to submit the required identification on behalf of the applicant(s).</li>
                  <li>You maintain the confidentiality of your account login credentials and notify us immediately of any unauthorized access.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>4. Fees, Processing Timelines & Payments</h3>
                <p>
                  All fees quoted include applicable government agency fees and FairFly operational service fees. 
                  Turnaround times are estimates based on standard government agency schedules (DFA, PSA, Embassies). 
                  FairFly is not liable for delays caused by government system maintenance, public holidays, or unforeseen agency backlogs.
                </p>
              </section>

              <section className="terms-section">
                <h3>5. Cancellations & Refund Policy</h3>
                <p>
                  Service fees are non-refundable once document processing or government appointment booking has commenced. 
                  In the event of cancellation before processing begins, requests will be reviewed in accordance with franchise branch guidelines.
                </p>
              </section>

              <section className="terms-section">
                <h3>6. Limitation of Liability</h3>
                <p>
                  Approval of visas, passport issuances, and civil registry releases remains at the sole discretion of the respective government authorities and foreign embassies. FairFly does not guarantee approval outcomes.
                </p>
              </section>
            </div>
          ) : (
            <div className="terms-content-pane">
              <div className="terms-effective-badge">
                <i className="fa-regular fa-clock"></i> Data Privacy Act of 2012 (RA 10173) Compliant
              </div>

              <section className="terms-section">
                <h3>1. Commitment to Data Privacy</h3>
                <p>
                  FairFly respects your privacy and is dedicated to protecting your personal information in strict compliance with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 of the Philippines.
                </p>
              </section>

              <section className="terms-section">
                <h3>2. Information We Collect</h3>
                <p>
                  To fulfill documentation and travel requests, we may collect:
                </p>
                <ul>
                  <li><strong>Personal Identifiers:</strong> Full legal name, date of birth, place of birth, nationality, and marital status.</li>
                  <li><strong>Contact Details:</strong> Email address, mobile/telephone number, and delivery address.</li>
                  <li><strong>Government ID & Supporting Documents:</strong> Scanned copies of valid IDs, PSA certificates, old passports, and visa application attachments.</li>
                  <li><strong>Transactional Details:</strong> Appointment dates, payment receipts, and tracking status updates.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>3. Purpose & Use of Data</h3>
                <p>
                  Your personal data is collected and processed solely for:
                </p>
                <ul>
                  <li>Processing passport, PSA document, visa, and flight booking applications.</li>
                  <li>Facilitating secure communication between you and your designated franchise operator.</li>
                  <li>Sending real-time notifications regarding status updates and document pick-up/delivery schedules.</li>
                  <li>Fulfilling legal obligations and maintaining operational audit logs.</li>
                </ul>
              </section>

              <section className="terms-section">
                <h3>4. Data Security & Storage</h3>
                <p>
                  We implement robust technical, physical, and organizational security measures to protect your data. All uploaded documents are stored in secure cloud storage with time-limited download tokens and role-based access restrictions. Only authorized franchise operators and administrators assigned to your request can view submitted documents.
                </p>
              </section>

              <section className="terms-section">
                <h3>5. Third-Party Sharing Disclosures</h3>
                <p>
                  We share your data strictly with authorized government entities (such as the DFA, PSA, and foreign embassies) and logistics partners for the sole purpose of executing your requested services. We never sell, rent, or trade your personal data to third-party marketers.
                </p>
              </section>

              <section className="terms-section">
                <h3>6. Your Rights as a Data Subject</h3>
                <p>
                  Under RA 10173, you have the right to access, correct, object to processing, or request the deletion of your personal data held in our systems, subject to statutory record-retention requirements.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="terms-modal-footer">
          <div className="terms-footer-notice">
            <i className="fa-solid fa-lock"></i> Secured with enterprise-grade encryption
          </div>
          <button
            type="button"
            className="btn-primary terms-close-action-btn"
            onClick={onClose}
          >
            I Understand
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
