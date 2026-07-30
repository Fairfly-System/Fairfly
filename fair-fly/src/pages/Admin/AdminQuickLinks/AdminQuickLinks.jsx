import AdminProvider from '../../../context/AdminContext';
import QuickLinksContent from './QuickLinksContent';

export default function AdminQuickLinks() {

  return (
    <AdminProvider targetCollection="quickLinks">
      <QuickLinksContent />
    </AdminProvider>
  );

}