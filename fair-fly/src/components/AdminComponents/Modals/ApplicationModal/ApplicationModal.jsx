import './application-modal.css';
import {useState, useImperativeHandle} from 'react';
import { Briefcase, CircleX, UserRound, Phone, Mail, MapPin, Building, Calendar, MessageSquare } from 'lucide-react';

export default function ApplicationModal({ ref, handleApprove, handleReject, isLoading, showButtons = true }) {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    useImperativeHandle(ref, () => ({
        openModal: (application) => {
            setSelectedApplication(application);
            setIsModalOpen(true);
        },
        closeModal: () => {
            setIsModalOpen(false);
        }  
    }));

    return (
        <>
            {isModalOpen && (
                <>
                    <div className="modal-overlay"/>
                        <div className={`modal-content ` + selectedApplication?.status?.toLowerCase()}>
                            <div className="modal-header">
                                <div className="modal-title">
                                    <span><Briefcase color={selectedApplication?.status === 'pending' ? 'var(--orange)' : selectedApplication?.status === 'approved' ? 'var(--complete-green)' : 'var(--error-red)'} /></span>
                                    <h2>Application Details</h2>
                                </div>
                                <span className="modal-close" onClick={() => setIsModalOpen(false)}>
                                    <span className="close-icon"><CircleX /></span>
                                </span>
                            </div>
                            <div className='modal-subheader'>
                                <h3>Review the complete Application Information</h3>
                            </div>
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
                                            <div className='section-header'>
                                                Full Name:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.fullName || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Phone Number:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.phoneNumber || 'N/A'}
                                            </div>
                                        </div> 
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Email Address:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.email || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Preferred Branch Location:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.preferredBranchLocation || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Business Information Section */}
                                    <div className="modal-section">
                                        <div className="modal-section-header">
                                            <Building />
                                            <h3>Business Information</h3>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Business Experience:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.businessExperience || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Investment Capacity:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.investmentCapacity || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preferred Meeting Date Section */}
                                    <div className="modal-section">
                                        <div className="modal-section-header">
                                            <span><Calendar /></span>
                                            <h3>Preferred Meeting Date</h3>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Preferred Meeting Date:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.preferredMeetingDate ? new Date(selectedApplication.preferredMeetingDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="modal-section-content">
                                            <div className='section-header'>
                                                Preferred Meeting Time:
                                            </div>
                                            <div className='section-content'>
                                                {selectedApplication?.preferredMeetingTime || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Message Section */}
                                    <div className="modal-section">
                                        <div className="modal-section-header">
                                            <span><MessageSquare /></span>
                                            <h3>Additional Message</h3>
                                        </div>
                                        <div className="additional-message-content">
                                            <p>
                                                {selectedApplication?.additionalMessage || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {showButtons && (
                                        <div className="button-group">
                                            <button className="approve-button" onClick={() => handleApprove(selectedApplication.id, true)} disabled={isLoading}>
                                                ✓ Approve
                                            </button>
                                            <button className="reject-button" onClick={() => handleReject(selectedApplication.id, false)} disabled={isLoading}>
                                                ✗ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                </>
            )}

        </>

    )

}