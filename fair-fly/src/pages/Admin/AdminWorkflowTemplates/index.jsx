import AdminProvider from '../../../context/AdminContext';
import WorkflowTemplatesContent from './AdminWorkflowTemplates';

export default function AdminWorkflowTemplatesPage() {
  return (
    <AdminProvider targetCollection="workflowTemplates">
      <WorkflowTemplatesContent />
    </AdminProvider>
  );
}
