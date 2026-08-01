import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import BaseModal from '../../../UI/ModalBase/BaseModal';
import './application-modal.css';
import { Briefcase, UserRound, Building, Calendar, MessageSquare } from 'lucide-react';

const ApplicationModal = forwardRef(({ handleApprove, handleReject, isLoading, showButtons = true }, ref) => {
    const [selectedApplication, setSelectedApplication] = useState(null);
    const baseModalRef = useRef(null);

    useImperativeHandle(ref, () => ({
        openModal: (application) => {
            setSelectedApplication(application);
            baseModalRef.current?.openModal(application);
        },
        closeModal: () => {
            baseModalRef.current?.closeModal();
        }  
    }));

    return (
        <BaseModal
            ref={baseModalRef}
            maxWidth="600px"
            title={
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span>
                        <Briefcase color={selectedApplication?.status === 'pending' ? 'var(--orange)' : selectedApplication?.status === 'approved' ? 'var(--complete-green)' : 'var(--error-red)'} />
                    </span>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Application Details</h2>
                </div>
            }
            subtitle="Review the complete Application Information"
            onClose={() => setSelectedApplication(null)}
        >
            <div className="modal-app-status">
                <div className="app-status">
                    <h3>Application Status: </h3>
                    <p className={selectedApplication?.status?.toLowerCase()}>{selectedApplication?.status?.toUpperCase()}</p>
                </div>
                <h3 className="app-submitted-date">
                    Submitted: {selectedApplication?.preferredMeetingDate ? new Date(selectedApplication.preferredMeetingDate).toLocaleDateString() : 'N/A'}
                </h3>
            </div>

            <div className="modal-body-scrollable">
                {/* Applicant Information Section */}
                <div className="modal-section">
                    <div className="modal-section-header">
                        <span><UserRound /></span>
                        <h3>Applicant Information</h3>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Full Name:</div>
                        <div className='section-content'>{selectedApplication?.fullName || 'N/A'}</div>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Phone Number:</div>
                        <div className='section-content'>{selectedApplication?.phoneNumber || 'N/A'}</div>
                    </div> 
                    <div className="modal-section-content">
                        <div className='section-header'>Email Address:</div>
                        <div className='section-content'>{selectedApplication?.email || 'N/A'}</div>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Preferred Branch Location:</div>
                        <div className='section-content'>{selectedApplication?.preferredBranchLocation || 'N/A'}</div>
                    </div>
                </div>
                
                {/* Business Information Section */}
                <div className="modal-section">
                    <div className="modal-section-header">
                        <Building />
                        <h3>Business Information</h3>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Business Experience:</div>
                        <div className='section-content'>{selectedApplication?.businessExperience || 'N/A'}</div>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Investment Capacity:</div>
                        <div className='section-content'>{selectedApplication?.investmentCapacity || 'N/A'}</div>
                    </div>
                </div>

                {/* Preferred Meeting Date Section */}
                <div className="modal-section">
                    <div className="modal-section-header">
                        <span><Calendar /></span>
                        <h3>Preferred Meeting Date</h3>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Preferred Meeting Date:</div>
                        <div className='section-content'>
                            {selectedApplication?.preferredMeetingDate ? new Date(selectedApplication.preferredMeetingDate).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                    <div className="modal-section-content">
                        <div className='section-header'>Preferred Meeting Time:</div>
                        <div className='section-content'>{selectedApplication?.preferredMeetingTime || 'N/A'}</div>
                    </div>
                </div>

                {/* Additional Message Section */}
                <div className="modal-section">
                    <div className="modal-section-header">
                        <span><MessageSquare /></span>
                        <h3>Additional Message</h3>
                    </div>
                    <div className="additional-message-content">
                        <p>{selectedApplication?.additionalMessage || 'N/A'}</p>
                    </div>
                </div>
                {showButtons && (
                    <div className="button-group">
                        <button className="approve-button" onClick={() => handleApprove(selectedApplication?.id, true)} disabled={isLoading}>
                            ✓ Approve
                        </button>
                        <button className="reject-button" onClick={() => handleReject(selectedApplication?.id, false)} disabled={isLoading}>
                            ✗ Reject
                        </button>
                    </div>
                )}
            </div>
        </BaseModal>
    );
});

ApplicationModal.displayName = 'ApplicationModal';

export default ApplicationModal;