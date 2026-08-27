import { Outlet } from "react-router";
import AdminProvider from "../../../context/AdminContext";

export default function AdminQualifications() {
  return (
    <AdminProvider targetCollection="qualificationApplications">
      <Outlet />
    </AdminProvider>
  );
}
