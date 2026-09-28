import { useEffect, useMemo, useState } from 'react';
import './operator-history.css';
import Pagination from '../../../components/UI/Pagination/Pagination';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import HistoryDetailModal from '../../../components/Operator/HistoryDetailModal/HistoryDetailModal';
import { useAuthContext } from '../../../context/AuthContext';
import { fetchAppointments } from '../../../services/appointmentService';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';

function formatHistoryDate(value) {
  if (!value) return 'N/A';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export default function OperatorHistory() {
  const { userToken } = useAuthContext();
  const [tab, setTab] = useState('appointments');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [servicesError, setServicesError] = useState('');

  // Selected item and modal control
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetailModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  useEffect(() => {
    if (!userToken) return;

    fetchAppointments(
      userToken,
      {},
      (appointments) => {
        const rows = Array.isArray(appointments) ? appointments : [];
        setAppointmentHistory(rows.map((appointment) => ({
          ...appointment,
          id: appointment.id,
          name: appointment.clientName || '',
          service: appointment.serviceType || '',
          date: formatHistoryDate(appointment.preferredDate || appointment.createdAt),
          status: appointment.status || 'N/A',
        })));
        setAppointmentsError('');
      },
      (error) => {
        setAppointmentHistory([]);
        setAppointmentsError(error?.message || 'Unable to load appointment history.');
      },
      setAppointmentsLoading
    );

    // Fetch all history services (both Completed and Cancelled)
    ApiCaller(
      `${API_BASE_URL}/api/services/active?status=history`,
      'GET',
      null,
      { Authorization: `Bearer ${userToken}` },
      (services) => {
        const rows = Array.isArray(services) ? services : [];
        setServiceHistory(rows.map((service) => ({
          ...service,
          id: service.id,
          name: service.clientName || '',
          service: service.serviceType || '',
          date: formatHistoryDate(service.completedAt || service.cancelledAt || service.updatedAt || service.startedAt || service.createdAt),
          status: service.status || 'Completed',
        })));
        setServicesError('');
      },
      (error) => {
        setServiceHistory([]);
        setServicesError(error?.message || 'Unable to load service history records.');
      },
      setServicesLoading
    );
  }, [userToken]);

  const activeData = tab === 'appointments' ? appointmentHistory : serviceHistory;
  const activeLoading = tab === 'appointments' ? appointmentsLoading : servicesLoading;
  const activeError = tab === 'appointments' ? appointmentsError : servicesError;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeData.slice(start, start + pageSize);
  }, [activeData, currentPage, pageSize]);

  // Column definitions for DataTable
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name / Client',
        render: (item) => <strong>{item.name || item.clientName || item.client}</strong>,
      },
      {
        key: 'service',
        header: 'Service Type',
        render: (item) => item.service || item.serviceType || 'General Consultation',
      },
      {
        key: 'date',
        header: tab === 'appointments' ? 'Preferred Date' : 'Date Finished / Updated',
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => {
          const s = (item.status || '').toLowerCase();
          const isComp = s === 'completed';
          const isCanc = s === 'cancelled';
          const isConf = s === 'confirmed';
          return (
            <span
              className={`status-pill ${
                isComp
                  ? 'status-pill-completed'
                  : isCanc
                  ? 'status-pill-disabled'
                  : isConf
                  ? 'status-pill-active'
                  : 'status-pill-pending'
              }`}
              style={isCanc ? { background: '#fee2e2', color: '#b91c1c', borderColor: '#f87171' } : undefined}
            >
              {item.status}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Action',
        render: (item) => (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            onClick={() => handleOpenDetailModal(item)}
          >
            <i className="fa-regular fa-eye"></i>
            <span>View</span>
          </button>
        ),
      },
    ],
    [tab]
  );

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'History' },
  ];

  return (
    <main className="operator-history-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="History Records"
        subtitle="View past appointments, completed services, and cancelled fulfillments with full refund audit"
        illustrationSrc="/pageImages/operator/history.png"
      />

      <section className="card op-history">
        <div className="op-tab-strip">
          <button
            className={`op-tab ${tab === 'appointments' ? 'active' : ''}`}
            onClick={() => {
              setTab('appointments');
              setCurrentPage(1);
            }}
          >
            Appointment History ({appointmentHistory.length})
          </button>
          <button
            className={`op-tab ${tab === 'services' ? 'active' : ''}`}
            onClick={() => {
              setTab('services');
              setCurrentPage(1);
            }}
          >
            Service History ({serviceHistory.length})
          </button>
        </div>

        {/* Reusable DataTable */}
        <DataTable
          columns={columns}
          data={paginatedData}
          keyField="id"
          selectable={false}
          isLoading={activeLoading}
          emptyState={{
            icon: 'fa-regular fa-clock',
            message: activeError || 'No history records found',
          }}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={activeData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* Detail Modal for View Action */}
      <HistoryDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseDetailModal}
        data={selectedRecord}
        type={tab === 'appointments' ? 'appointment' : 'service'}
      />
    </main>
  );
}
