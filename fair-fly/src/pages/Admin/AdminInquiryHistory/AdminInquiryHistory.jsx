import './admin-inquiry-history.css';
import '../AdminFranchiseApps/admin-franchise-apps.css';
import { useState, useEffect, useRef } from 'react';
import { useAdminContext } from '../../../context/AdminContext';
import ApplicationModal from '../../../components/AdminComponents/Modals/ApplicationModal/application-modal';
import FranchiseCard from '../../../components/AdminComponents/FranchiseeApplication/FranchiseeCard';
import AdminProvider from '../../../context/AdminContext';
import HistoryContent from './HistoryContent';

export default function AdminInquiryHistory() {

  return (
    <AdminProvider targetCollection="franchiseApplications">
      <HistoryContent />
    </AdminProvider>
  );
  
}
