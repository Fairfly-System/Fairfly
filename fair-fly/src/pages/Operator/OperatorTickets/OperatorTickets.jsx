import { Outlet } from "react-router";
import OperatorProvider from "../../../context/OperatorContext";

export default function OperatorTickets() {
  console.log('[OperatorTickets] Rendering wrapper, Outlet should render children');
  return (
    <OperatorProvider targetCollection="tickets">
      <Outlet />
    </OperatorProvider>
  );
}
