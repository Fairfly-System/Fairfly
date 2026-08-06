import AdminProvider from "../../../context/AdminContext";
import TicketsContent from "./TicketsContent";

export default function AdminTickets() {
  return (
    <AdminProvider targetCollection="tickets">
      <TicketsContent />
    </AdminProvider>
  );
}
