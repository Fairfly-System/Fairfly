import './admin-franchise-apps.css';
import FranchiseCard from '../../../components/AdminComponents/FranchiseeApplication/FranchiseeCard';
import { useState, useEffect, useRef } from 'react';
import {onSnapshot, collection} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import Loader from '../../../components/AdminComponents/Loader/Loader';
import ApplicationModal from '../../../components/AdminComponents/Modals/ApplicationModal/application-modal';
import { useAdminContext } from '../../../context/AdminContext';
import ApiCaller from '../../../utils/ApiCaller'; 
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../../components/toast/ToastProvider';
import AdminProvider from '../../../context/AdminContext';

export default function FranchiseContent() {
    //Get the franchise applications from the firestore listener and display them in the dashboard
  const { data: franchiseApplications, loading: franchiseLoading } = useAdminContext();
  const {isLoading, setIsLoading} = useState(false); //State to indicate if the API call is loading

  const modalRef = useRef(null); //Modal reference to open the modal when the view button is clicked
  const { userToken } = useAuthContext();
  const { addToast } = useToast();

  //Approve or reject the franchise application and update the status in the firestore
  async function handleApplicationStatusChange(applicationId, isApproved) {
    ApiCaller('http://localhost:5001/api/franchise/applications/' + applicationId + '/status', 
    'PATCH', 
    { status: isApproved ? 'approved' : 'rejected' },
    { 'Authorization': `Bearer ${userToken}` },
    (data) => {
        //Success callback: Update the local state to reflect the change
        addToast(`Application ${isApproved ? 'approved' : 'rejected'} successfully`, 'success');
        console.log('Application status updated successfully:');
    }, 
    (error) => {
        //Error callback: Show an error toast
        addToast(`Failed to update application status: ${error.message}`, `error`);
        console.error('Error updating application status:', error);
    },
    setIsLoading
    )
  }

  return (
    <>
      <div className="card franchise-page">
        <div className="franchise-header">
          <i className="fa-solid fa-briefcase"></i>
          <div>
            <h2>Franchise Applications</h2>
            <p>Review and manage franchise applications</p>
          </div>
        </div>

        <div className="franchise-cards-container">
          {franchiseLoading ? (
            <Loader text="Loading franchise applications..." />
          ) : franchiseApplications.filter((app) => app.status === 'pending').length === 0 ? (
            <p>No franchise applications found.</p>
          ) : (
            <>
              {franchiseApplications.filter((app) => app.status === 'pending').map((application) => (
                <FranchiseCard key={application.id} 
                  avatar={`https://placehold.co/400x400/000000/FFFFFF?text=` + application.fullName.substring(0, 1).toUpperCase()} 
                  name={application.fullName}
                  email={application.email}
                  status={application.status.toUpperCase()}
                  contactNumber={application.phoneNumber}
                  address={application.preferredBranchLocation}
                  experience={application.businessExperience + " year(s)"}  
                  investmentCapacity={"PHP " + application.investmentCapacity}
                  preferredMeetingDate={new Date(application.preferredMeetingDate).toLocaleDateString()}
                  additionalMessage={application.additionalMessage}
                  onView={() => modalRef.current.openModal(application)}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <ApplicationModal ref={modalRef} isLoading={isLoading} handleApprove={handleApplicationStatusChange} handleReject={handleApplicationStatusChange} />
      </>
  );
}