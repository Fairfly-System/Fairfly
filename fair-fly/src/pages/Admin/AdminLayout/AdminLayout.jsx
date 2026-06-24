import './admin-layout.css';
import { Outlet } from 'react-router';
import AdminNavbar from '../../../components/AdminComponents/AdminNavbar/AdminNavbar';
import AdminSidebar from '../../../components/AdminComponents/AdminSidebar/AdminSidebar';

export default function MainLayout() {
  return (
    <>
      <AdminNavbar />

      <div className="layout-container">
        <AdminSidebar />

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}