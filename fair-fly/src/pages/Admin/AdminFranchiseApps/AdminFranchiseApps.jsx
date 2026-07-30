import AdminProvider from "../../../context/AdminContext";
import FranchiseContent from "./FranchiseContent";

export default function AdminFranchiseApps() {

    return (
        <AdminProvider targetCollection="franchiseApplications">
            <FranchiseContent />
        </AdminProvider>
  );
}
