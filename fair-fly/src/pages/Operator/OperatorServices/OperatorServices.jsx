import { Outlet } from "react-router";
import AdminProvider from "../../../context/AdminContext";

export default function OperatorServices() {
  return (
    <AdminProvider targetCollection="services">
      <Outlet />
    </AdminProvider>
  );
}
