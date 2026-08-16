import { Outlet } from "react-router";
import AdminProvider from "../../../context/AdminContext";

export default function AdminFranchiseApps() {
    return (
        <AdminProvider targetCollection="franchiseApplications">
            <Outlet />
        </AdminProvider>
  );
}
