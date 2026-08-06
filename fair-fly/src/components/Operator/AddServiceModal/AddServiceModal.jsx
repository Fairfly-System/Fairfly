import { useState, useEffect } from 'react';
import BaseModal from '../../UI/ModalBase/BaseModal';
import { useAuthContext } from '../../../context/AuthContext';
import { useToast } from '../../UI/toast/ToastProvider';
import { firestore } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';
import './add-service-modal.css';

const PRIORITY_LEVELS = ['Normal Priority', 'High Priority'];
const SOURCES = ['Walk-in', 'Appointment'];

export default function AddServiceModal({ onClose }) {
  const { userToken } = useAuthContext();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminServices, setAdminServices] = useState([]);
  const [loadingAdminServices, setLoadingAdminServices] = useState(true);

  const [form, setForm] = useState({
    clientName: '',
    serviceId: '',
    serviceType: '',
    priority: 'Normal Priority',
    source: 'Walk-in',
  });

  // Listen to Admin Services Catalog from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, 'services'),
      (snapshot) => {
        const list = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((s) => s.status !== 'Disabled');
        setAdminServices(list);
        setLoadingAdminServices(false);
      },
      (error) => {
        console.error('Error listening to Admin services catalog:', error);
        setLoadingAdminServices(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleServiceSelect = (e) => {
    const selectedId = e.target.value;
    const selectedObj = adminServices.find((s) => s.id === selectedId);

    setForm((prev) => ({
      ...prev,
      serviceId: selectedId,
      serviceType: selectedObj ? selectedObj.name : '',
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.clientName.trim() || (!form.serviceId && !form.serviceType)) {
      addToast('Client name and Admin service selection are required', 'error');
      return;
    }

    const selectedObj = adminServices.find((s) => s.id === form.serviceId);
    const payload = {
      ...form,
      serviceType: selectedObj ? selectedObj.name : form.serviceType,
      workflowIds: selectedObj?.workflowIds || [],
    };

    ApiCaller(
      `${API_BASE_URL}/api/services/active`,
      'POST',
      payload,
      { Authorization: `Bearer ${userToken}` },
      () => {
        addToast('Active service record initialized with Admin workflows!', 'success');
        onClose();
      },
      (error) => {
        addToast(`Failed to create active service: ${error.message}`, 'error');
      },
      setIsSubmitting
    );
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      maxWidth="480px"
      title="Initialize Active Service Record"
      subtitle="Select a Service configured by Admin to load its attached workflows and procedure steps"
      isLoading={isSubmitting}
    >
      <div className="as-modal-body-content">
        <div className="as-field">
          <label>Client Full Name <span>*</span></label>
          <input
            type="text"
            name="clientName"
            placeholder="e.g. Reimier Reyes"
            value={form.clientName}
            onChange={handleChange}
            disabled={isSubmitting}
            className="as-input focused"
          />
        </div>

        <div className="as-field">
          <label>Admin Service Catalog <span>*</span></label>
          <div className="as-select-wrap">
            <select
              name="serviceId"
              value={form.serviceId}
              onChange={handleServiceSelect}
              disabled={isSubmitting || loadingAdminServices}
              className="as-select"
            >
              <option value="" disabled>
                {loadingAdminServices ? 'Loading Admin Services...' : 'Select Admin Service'}
              </option>
              {adminServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.price ? s.price : 'Standard Fee'})
                  {s.workflowIds?.length > 0 ? ` · ${s.workflowIds.length} Workflow(s)` : ''}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-field">
          <label>Priority Level</label>
          <div className="as-select-wrap">
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              disabled={isSubmitting}
              className="as-select"
            >
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-field">
          <label>Source</label>
          <div className="as-select-wrap">
            <select
              name="source"
              value={form.source}
              onChange={handleChange}
              disabled={isSubmitting}
              className="as-select"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>

        <div className="as-actions">
          <button className="as-btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button
            className="as-btn-submit"
            onClick={handleSubmit}
            disabled={!form.clientName.trim() || !form.serviceId || isSubmitting}
          >
            {isSubmitting ? 'Initializing...' : 'Initialize Service Record'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
