import { Outlet } from "react-router";
import './admin-operators.css';
import AdminProvider from "../../../context/AdminContext";
import { where } from "firebase/firestore";

export default function AdminOperators() {
  console.log('[AdminOperators] Rendering wrapper, Outlet should render children');
  return (
    <AdminProvider targetCollection="users" queryReq={[where("role", "==", "operator")]}>
      <Outlet />
    </AdminProvider>
  );
}
