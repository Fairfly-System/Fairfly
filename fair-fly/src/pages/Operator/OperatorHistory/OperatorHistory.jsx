import { useEffect, useMemo, useState } from 'react';
import './operator-history.css';
import Pagination from '../../../components/UI/Pagination/Pagination';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
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

  useEffect(() => {
    if (!userToken) return;

    fetchAppointments(
      userToken,
      {},
      (appointments) => {
        const rows = Array.isArray(appointments) ? appointments : [];
        setAppointmentHistory(rows.map((appointment) => ({
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

    ApiCaller(
      `${API_BASE_URL}/api/services/active?status=Completed`,
      'GET',
      null,
      { Authorization: `Bearer ${userToken}` },
      (services) => {
        const rows = Array.isArray(services) ? services : [];
        setServiceHistory(rows.map((service) => ({
          id: service.id,
          name: service.clientName || '',
          service: service.serviceType || '',
          date: formatHistoryDate(service.completedAt || service.updatedAt || service.startedAt || service.createdAt),
          status: service.status || 'Completed',
        })));
        setServicesError('');
      },
      (error) => {
        setServiceHistory([]);
        setServicesError(error?.message || 'Unable to load completed service history.');
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
        render: (item) => <strong>{item.name || item.client}</strong>,
      },
      {
        key: 'service',
        header: 'Service Type',
      },
      {
        key: 'date',
        header: 'Date Completed',
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <span
            className={`status-pill ${
              item.status === 'Completed'
                ? 'status-pill-completed'
                : 'status-pill-disabled'
            }`}
          >
            {item.status}
          </span>
        ),
      },
    ],
    []
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
        subtitle="View past appointments and completed service fulfillments"
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
    </main>
  );
}
