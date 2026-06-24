import './admin-layout.css';
import { Outlet } from 'react-router';
import AdminNavbar from '../../../components/AdminComponents/AdminNavbar/AdminNavbar';
import AdminSidebar from '../../../components/AdminComponents/AdminSidebar/AdminSidebar';

export default function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      

      <div className="admin-layout-container">
        <AdminSidebar />

        <main className="admin-layout-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}