import React from 'react';
import { Outlet } from 'react-router';
import AppNavbar from '../../../components/UI/AppNavbar/AppNavbar';
import './client-layout.css';

export default function ClientLayout() {
  return (
    <div className="client-portal-layout page-fade-in">
      <AppNavbar
        portalName="Client"
        portalSubtitle="Travel Services & Bookings"
        showSidebarOffset={false}
      />
      <main className="client-portal-main">
        <Outlet />
      </main>
    </div>
  );
}
