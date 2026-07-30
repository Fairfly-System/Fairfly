import './admin-inquiry-history.css';
import '../AdminFranchiseApps/admin-franchise-apps.css';
import AdminProvider from '../../../context/AdminContext';
import HistoryContent from './HistoryContent';

export default function AdminInquiryHistory() {

  return (
    <AdminProvider targetCollection="franchiseApplications">
      <HistoryContent />
    </AdminProvider>
  );
  
}
