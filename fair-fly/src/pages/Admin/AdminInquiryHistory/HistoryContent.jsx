import { useAdminContext } from "../../../context/AdminContext";
import { useState, useRef } from "react";
import ApplicationModal from "../../../components/AdminComponents/Modals/ApplicationModal/application-modal";
import FranchiseCard from "../../../components/AdminComponents/FranchiseeApplication/FranchiseeCard";

export default function HistoryContent() {

const { data: franchiseApplications, loading: franchiseLoading } = useAdminContext();
  const modalRef = useRef(null); //Modal reference to open the modal when the view button is clicked
  const [isLoading, setIsLoading] = useState(false); //State to indicate if the API call is loading

  return (
    <div className="card inquiry-page">
      <div className="inquiry-header">
        <i className="fa-solid fa-clipboard-list"></i>
        <div>
          <h2>Franchising Inquiry History</h2>
          <p>Complete history of all franchise inquiries and applications</p>
        </div>
      </div>

      {/* TODO: Search Bar and Filters */}

      <div className="franchise-cards-container">
          {franchiseApplications.filter((app) => app.status !== 'pending').map((application) => (
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
        </div>
      <ApplicationModal ref={modalRef} isLoading={isLoading} showButtons={false}/>
    </div>
  );

}