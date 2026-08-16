import { Outlet } from 'react-router';
import './admin-inquiry-history.css';
import '../AdminFranchiseApps/admin-franchise-apps.css';
import AdminProvider from '../../../context/AdminContext';

export default function AdminInquiryHistory() {
  return (
    <AdminProvider targetCollection="franchiseApplications">
      <Outlet />
    </AdminProvider>
  );
}
