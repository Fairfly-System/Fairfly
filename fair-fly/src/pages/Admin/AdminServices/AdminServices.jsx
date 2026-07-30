import AdminProvider from '../../../context/AdminContext';
import ServiceContent from './ServiceContent';

export default function AdminServices() {
  return (
    <AdminProvider targetCollection="services">
      <ServiceContent />
    </AdminProvider>
  );
}
