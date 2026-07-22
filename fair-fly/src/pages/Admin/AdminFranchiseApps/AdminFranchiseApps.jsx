import './admin-franchise-apps.css';
import FranchiseCard from '../../../components/AdminComponents/FranchiseeApplication/FranchiseeCard';
import { useState, useEffect, useRef } from 'react';
import {onSnapshot, collection} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import Loader from '../../../components/AdminComponents/Loader/Loader';
import ApplicationModal from '../../../components/AdminComponents/Modals/ApplicationModal/application-modal';

export default function AdminFranchiseApps() {

  //Get the franchise applications from the firestore listener and display them in the dashboard
  const [franchiseApplications, setFranchiseApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    // Subscribe to the franchise applications collection in Firestore
    const unsubscribe = onSnapshot(collection(firestore, 'franchiseApplications'), (snapshot) => {
      const applications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setFranchiseApplications(applications);
      setLoading(false);
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

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
          {loading ? (
            <Loader text="Loading franchise applications..." />
          ) : franchiseApplications.length === 0 ? (
            <p>No franchise applications found.</p>
          ) : (
            <>
              {franchiseApplications.map((application) => (
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
      <ApplicationModal ref={modalRef} />
    </>
    
  );
}
