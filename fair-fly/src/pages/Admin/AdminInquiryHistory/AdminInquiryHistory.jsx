import { Outlet } from 'react-router';
import './admin-inquiry-history.css';
import AdminProvider from '../../../context/AdminContext';

export default function AdminInquiryHistory() {
  return (
    <AdminProvider targetCollection="inquiries">
      <Outlet />
    </AdminProvider>
  );
}
