import { Outlet } from "react-router";
import AdminProvider from "../../../context/AdminContext";

export default function AdminTickets() {
  console.log('[AdminTickets] Rendering wrapper, Outlet should render children');
  return (
    <AdminProvider targetCollection="tickets">
      <Outlet />
    </AdminProvider>
  );
}
