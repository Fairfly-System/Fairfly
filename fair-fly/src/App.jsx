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
import { getFromDatabase } from './utils/firebaseutils';
import Login from './pages/Index/Login/login';
import Register from './pages/Index/Register/Register';
import ScrollToTop from './components/UI/ScrollToTop/ScrollToTop';
import Loading from './components/UI/Loading/Loading';
import Index from './pages/Index/Index';
import ClientDashboard from './pages/ClientSide/ClientDashboard/ClientDashboard';
import AdminLayout from './pages/Admin/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminServices from './pages/Admin/AdminServices/AdminServices';
import AdminOperators from './pages/Admin/AdminOperators/AdminOperators';
import AdminFranchiseApps from './pages/Admin/AdminFranchiseApps/AdminFranchiseApps';
import AdminInquiryHistory from './pages/Admin/AdminInquiryHistory/AdminInquiryHistory';
import AdminQuickLinks from './pages/Admin/AdminQuickLinks/AdminQuickLinks';
import AdminWorkflowTemplates from './pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates';
import OperatorLayout from './pages/Operator/OperatorLayout/OperatorLayout';
import OperatorDashboard from './pages/Operator/OperatorDashboard/OperatorDashboard';
import OperatorAppointments from './pages/Operator/OperatorAppointments/OperatorAppointments';
import OperatorWorkflows from './pages/Operator/OperatorWorkflows/OperatorWorkflows';
import OperatorHistory from './pages/Operator/OperatorHistory/OperatorHistory';
import OperatorQuickLinks from './pages/Operator/OperatorQuickLinks/OperatorQuickLinks';
import OperatorInquiryForms from './pages/Operator/OperatorInquiryForms/OperatorInquiryForms';
import { useAuthContext } from './context/AuthContext';

function App() {

  const { user, userDetails, userLoading } = useAuthContext();

  const roleRoutes = {
    client: (
      <>
        <Route path="/client" element={<ClientDashboard />} />
      </>
    ),

    admin: (
      <>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="operators" element={<AdminOperators />} />
          <Route path="franchise-apps" element={<AdminFranchiseApps />} />
          <Route path="inquiry-history" element={<AdminInquiryHistory />} />
          <Route path="quick-links" element={<AdminQuickLinks />} />
          <Route path="workflow-templates" element={<AdminWorkflowTemplates />} />
        </Route>
      </>
    ),

    operator: (
      <>
        <Route path="/operator" element={<OperatorLayout />}>
          <Route index element={<OperatorDashboard />} />
          <Route path="appointments" element={<OperatorAppointments />} />
          <Route path="workflows" element={<OperatorWorkflows />} />
          <Route path="history" element={<OperatorHistory />} />
          <Route path="quick-links" element={<OperatorQuickLinks />} />
          <Route path="inquiry-forms" element={<OperatorInquiryForms />} />
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
                  element={<Navigate to={`/${userDetails.role}`} replace />}
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
