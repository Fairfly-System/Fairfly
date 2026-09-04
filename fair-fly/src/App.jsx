import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDocs } from 'firebase/firestore';
import Chatbot from './components/Shared/Chatbot/Chatbot'
import Footer from './components/Shared/Footer/Footer'
import Navbar from './components/Shared/Navbar/Navbar'
import About from './pages/Index/About/About';
import Landing from './pages/Index/Landing/Landing'
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router";
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import Login from './pages/Index/Login/login';
import Register from './pages/Index/Register/Register';
import ResetPassword from './pages/Index/ResetPassword/ResetPassword';
import ScrollToTop from './components/UI/ScrollToTop/ScrollToTop';
import Loading from './components/UI/Loading/Loading';
import Index from './pages/Index/Index';
import ClientLayout from './pages/ClientSide/ClientLayout/ClientLayout';
import ClientDashboard from './pages/ClientSide/ClientDashboard/ClientDashboard';
import ClientTrackingPage from './pages/ClientSide/ClientTracking/ClientTrackingPage';
import ClientAppointmentsPage from './pages/ClientSide/ClientAppointments/ClientAppointmentsPage';
import ServiceItemPage from './pages/ClientSide/ClientServiceItem/ServiceItemPage';
import AdminLayout from './pages/Admin/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminServices from './pages/Admin/AdminServices/AdminServices';
import AdminOperators from './pages/Admin/AdminOperators/AdminOperators';
import AdminFranchiseApps from './pages/Admin/AdminFranchiseApps/AdminFranchiseApps';
import AdminTickets from './pages/Admin/AdminTickets/AdminTickets';
import AdminInquiryHistory from './pages/Admin/AdminInquiryHistory/AdminInquiryHistory';
import AdminQuickLinks from './pages/Admin/AdminQuickLinks/AdminQuickLinks';
import AdminWorkflowTemplates from './pages/Admin/AdminWorkflowTemplates/index';
import OperatorLayout from './pages/Operator/OperatorLayout/OperatorLayout';
import OperatorDashboard from './pages/Operator/OperatorDashboard/OperatorDashboard';
import OperatorAppointments from './pages/Operator/OperatorAppointments/OperatorAppointments';
import OperatorWorkflows from './pages/Operator/OperatorWorkflows/OperatorWorkflows';
import OperatorHistory from './pages/Operator/OperatorHistory/OperatorHistory';
import OperatorQuickLinks from './pages/Operator/OperatorQuickLinks/OperatorQuickLinks';
import OperatorInquiryForms from './pages/Operator/OperatorInquiryForms/OperatorInquiryForms';
import OperatorTickets from './pages/Operator/OperatorTickets/OperatorTickets';
import OperatorQuotations from './pages/Operator/OperatorQuotations/OperatorQuotations';
import OperatorServiceProcedure from './pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure';
import { useAuthContext } from './context/AuthContext';

// Detail views & content components
import OperatorsContent from './pages/Admin/AdminOperators/OperatorsContent';
import OperatorDetailPage from './pages/Admin/AdminOperators/OperatorDetailPage';
import ServiceContent from './pages/Admin/AdminServices/ServiceContent';
import ServiceDetailPage from './pages/Admin/AdminServices/ServiceDetailPage';
import FranchiseContent from './pages/Admin/AdminFranchiseApps/FranchiseContent';
import FranchiseAppDetailPage from './pages/Admin/AdminFranchiseApps/FranchiseAppDetailPage';
import TicketsContent from './pages/Admin/AdminTickets/TicketsContent';
import TicketDetailPage from './pages/Admin/AdminTickets/TicketDetailPage';
import HistoryContent from './pages/Admin/AdminInquiryHistory/HistoryContent';
import AdminInquiryDetailPage from './pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage';

import { AppointmentContent } from './pages/Operator/OperatorAppointments/OperatorAppointments';
import AppointmentDetailPage from './pages/Operator/OperatorAppointments/AppointmentDetailPage';
import OperatorTicketsContent from './pages/Operator/OperatorTickets/OperatorTicketsContent';
import OperatorTicketDetailPage from './pages/Operator/OperatorTickets/OperatorTicketDetailPage';
import { QuotationsContent } from './pages/Operator/OperatorQuotations/OperatorQuotations';
import QuotationDetailPage from './pages/Operator/OperatorQuotations/QuotationDetailPage';
import { InquiryContent } from './pages/Operator/OperatorInquiryForms/OperatorInquiryForms';
import InquiryFormDetailPage from './pages/Operator/OperatorInquiryForms/InquiryFormDetailPage';
import OperatorServices from './pages/Operator/OperatorServices/OperatorServices';
import OperatorServicesContent from './pages/Operator/OperatorServices/OperatorServicesContent';
import OperatorServiceDetailPage from './pages/Operator/OperatorServices/OperatorServiceDetailPage';

import AdminQualifications from './pages/Admin/AdminQualifications/AdminQualifications';
import QualificationsContent from './pages/Admin/AdminQualifications/QualificationsContent';
import AdminAdmins from './pages/Admin/AdminAdmins/AdminAdmins';
import AdminsContent from './pages/Admin/AdminAdmins/AdminsContent';
import AdminDetailPage from './pages/Admin/AdminAdmins/AdminDetailPage';
import AdminClients from './pages/Admin/AdminClients/AdminClients';
import ClientsContent from './pages/Admin/AdminClients/ClientsContent';
import ClientDetailPage from './pages/Admin/AdminClients/ClientDetailPage';
import AdminResources from './pages/Admin/AdminResources/AdminResources';
import OperatorResources from './pages/Operator/OperatorResources/OperatorResources';
import MessagesPage from './pages/Shared/MessagesPage/MessagesPage';

function App() {

  const { user, userDetails, userLoading } = useAuthContext();

  const roleRoutes = {
    client: (
      <>
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="services" element={<ClientDashboard />} />
          <Route path="services/:serviceId" element={<ServiceItemPage />} />
          <Route path="tracking" element={<ClientTrackingPage />} />
          <Route path="appointments" element={<ClientAppointmentsPage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>
      </>
    ),

    admin: (
      <>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />}>
            <Route index element={<ServiceContent />} />
            <Route path=":id" element={<ServiceDetailPage />} />
          </Route>
          <Route path="operators" element={<AdminOperators />}>
            <Route index element={<OperatorsContent />} />
            <Route path=":id" element={<OperatorDetailPage />} />
          </Route>
          <Route path="clients" element={<AdminClients />}>
            <Route index element={<ClientsContent />} />
            <Route path=":id" element={<ClientDetailPage />} />
          </Route>
          <Route path="admins" element={<AdminAdmins />}>
            <Route index element={<AdminsContent />} />
            <Route path=":id" element={<AdminDetailPage />} />
          </Route>
          <Route path="resources" element={<AdminResources />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="franchise-apps" element={<AdminFranchiseApps />}>
            <Route index element={<FranchiseContent />} />
            <Route path=":id" element={<FranchiseAppDetailPage />} />
          </Route>
          <Route path="qualifications" element={<AdminQualifications />}>
            <Route index element={<QualificationsContent />} />
          </Route>
          <Route path="tickets" element={<AdminTickets />}>
            <Route index element={<TicketsContent />} />
            <Route path=":id" element={<TicketDetailPage />} />
          </Route>
          <Route path="inquiry-history" element={<AdminInquiryHistory />}>
            <Route index element={<HistoryContent />} />
            <Route path=":id" element={<AdminInquiryDetailPage />} />
          </Route>
          <Route path="quick-links" element={<AdminQuickLinks />} />
          <Route path="workflow-templates" element={<AdminWorkflowTemplates />} />
        </Route>
      </>
    ),

    operator: (
      <>
        <Route path="/operator" element={<OperatorLayout />}>
          <Route index element={<OperatorDashboard />} />
          <Route path="services/:id/procedure" element={<OperatorServiceProcedure />} />
          <Route path="appointments" element={<OperatorAppointments />}>
            <Route index element={<AppointmentContent />} />
            <Route path=":id" element={<AppointmentDetailPage />} />
          </Route>
          <Route path="services" element={<OperatorServices />}>
            <Route index element={<OperatorServicesContent />} />
            <Route path=":id" element={<OperatorServiceDetailPage />} />
          </Route>
          <Route path="workflows" element={<Navigate to="/operator" replace />} />
          <Route path="resources" element={<OperatorResources />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="tickets" element={<OperatorTickets />}>
            <Route index element={<OperatorTicketsContent />} />
            <Route path=":id" element={<OperatorTicketDetailPage />} />
          </Route>
          <Route path="quotations" element={<OperatorQuotations />}>
            <Route index element={<QuotationsContent />} />
            <Route path=":id" element={<QuotationDetailPage />} />
          </Route>
          <Route path="history" element={<OperatorHistory />} />
          <Route path="quick-links" element={<OperatorQuickLinks />} />
          <Route path="inquiry-forms" element={<OperatorInquiryForms />}>
            <Route index element={<InquiryContent />} />
            <Route path=":id" element={<InquiryFormDetailPage />} />
          </Route>
        </Route>
      </>
    ),
  };

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />

        {userLoading ? (
          <Loading />
        ) : (
          <Routes>
            {/* User Routes */}
            {userDetails ? (
              <>
                {roleRoutes[userDetails.role]}
                <Route
                  path="*"
                  element={<Navigate to={`/${userDetails.role}`} replace />} //Default routes for authenticated users
                />
              </>
            ) : (
              /* Unauthenticated Route */
              <Route element={<Index />}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ResetPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            )}
          </Routes>
        )}

        <Chatbot />
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
