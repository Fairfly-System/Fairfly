import React, { useState, useEffect } from 'react';
import AppSidebar from '../AppSidebar/AppSidebar';
import AppNavbar from '../AppNavbar/AppNavbar';
import './app-layout.css';

/**
 * AppLayout — unified shell layout for Admin and Operator portals.
 *
 * Props:
 *  portalName      {string}          — "Admin" / "Operator"
 *  portalSubtitle  {string}          — Brand subtitle under title
 *  navLinks        {Array}           — Navigation link configs for sidebar
 *  statCards       {React.ReactNode} — Grid of KPI/Stat cards to display at top of layout
 *  children        {React.ReactNode} — Main page contents (usually Outlet)
 */
export default function AppLayout({
  portalName,
  portalSubtitle,
  navLinks,
  statCards,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /** Close sidebar when window resizes past mobile breakpoint */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  return (
    <div className="app-layout-container">
      <AppSidebar
        portalName={portalName}
        portalSubtitle={portalSubtitle}
        navLinks={navLinks}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <AppNavbar
        portalName={portalName}
        portalSubtitle={portalSubtitle}
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        showSidebarOffset={true}
      />

      <div className="app-layout-main">
        {statCards && <div className="app-layout-stats">{statCards}</div>}
        <main className="app-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
