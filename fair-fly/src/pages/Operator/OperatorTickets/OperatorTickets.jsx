import OperatorProvider from "../../../context/OperatorContext";
import OperatorTicketsContent from "./OperatorTicketsContent";

export default function OperatorTickets() {
  return (
    <OperatorProvider targetCollection="tickets">
      <OperatorTicketsContent />
    </OperatorProvider>
  );
}
