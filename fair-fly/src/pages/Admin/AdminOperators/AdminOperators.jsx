import OperatorsContent from "./OperatorsContent";
import './admin-operators.css';
import AdminProvider from "../../../context/AdminContext";
import { where } from "firebase/firestore";

export default function AdminOperators() {
  return (
    <AdminProvider targetCollection="users" queryReq={[where("role", "==", "operator")]}>
      <OperatorsContent />
    </AdminProvider>
  );
}
