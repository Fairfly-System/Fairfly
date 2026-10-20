import { useEffect, useMemo, useState } from 'react';
import './operator-history.css';
import Pagination from '../../../components/UI/Pagination/Pagination';
import DataTable from '../../../components/UI/DataTable/DataTable';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import HistoryDetailModal from '../../../components/Operator/HistoryDetailModal/HistoryDetailModal';
import { useAuthContext } from '../../../context/AuthContext';
import { fetchAppointments } from '../../../services/appointmentService';
import { fetchPayments } from '../../../services/paymentService';
import { usePdfModal } from '../../../components/Shared/PdfDocument/PdfDocumentView';
import { isCashPayment, formatPaymentMethodPill } from '../../../utils/paymentUtils';
import ApiCaller from '../../../utils/ApiCaller';
import { API_BASE_URL } from '../../../utils/config';

function formatHistoryDate(value) {
  if (!value) return 'N/A';
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '₱0.00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(val);
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function OperatorHistory() {
  const { userToken } = useAuthContext();
  const { openPdfModal } = usePdfModal();
  const [tab, setTab] = useState('appointments');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [servicesError, setServicesError] = useState('');
  const [paymentsError, setPaymentsError] = useState('');

  // Selected item and modal control
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalType, setModalType] = useState('service');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetailModal = (record, type) => {
    setSelectedRecord(record);
    setModalType(type || (tab === 'appointments' ? 'appointment' : tab === 'payments' ? 'payment' : 'service'));
    setIsModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  useEffect(() => {
    if (!userToken) return;

    // Fetch appointments history
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

    // Fetch confirmed payment transactions
    fetchPayments(
      userToken,
      {},
      (payments) => {
        const rows = Array.isArray(payments) ? payments : [];
        setPaymentHistory(rows.map((payment) => ({
          ...payment,
          id: payment.id,
          receiptNo: payment.receiptNo || 'RCT-N/A',
          clientName: payment.clientName || 'Valued Client',
          serviceTitle: payment.serviceTitle || payment.serviceType || 'Custom Service',
          amount: Number(payment.amount || 0),
          paymentMethod: payment.paymentMethodType || payment.paymentMethod || (payment.provider === 'cash' ? 'Cash' : 'PayMongo'),
          date: formatHistoryDate(payment.paidAt || payment.createdAt),
          status: payment.status || 'PAID',
        })));
        setPaymentsError('');
      },
      (error) => {
        setPaymentHistory([]);
        setPaymentsError(error?.message || 'Unable to load payment transaction history.');
      },
      setPaymentsLoading
    );
  }, [userToken]);

  const activeData = tab === 'appointments'
    ? appointmentHistory
    : tab === 'services'
    ? serviceHistory
    : paymentHistory;
  const activeLoading = tab === 'appointments'
    ? appointmentsLoading
    : tab === 'services'
    ? servicesLoading
    : paymentsLoading;
  const activeError = tab === 'appointments'
    ? appointmentsError
    : tab === 'services'
    ? servicesError
    : paymentsError;

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeData.slice(start, start + pageSize);
  }, [activeData, currentPage, pageSize]);

  // Status pill helper
  const renderStatusPill = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    const isComp = ['completed', 'accepted', 'paid', 'fulfilled'].includes(s);
    const isCanc = ['cancelled', 'rejected', 'refunded'].includes(s);
    const isConf = ['confirmed', 'active'].includes(s);
    const isInfo = ['quoted', 'ongoing', 'in-progress'].includes(s);
    return (
      <span
        className={`status-pill ${
          isComp
            ? 'status-pill-completed'
            : isCanc
            ? 'status-pill-disabled'
            : isConf
            ? 'status-pill-active'
            : isInfo
            ? 'status-pill-info'
            : 'status-pill-pending'
        }`}
      >
        {statusStr}
      </span>
    );
  };

  // Column definitions for DataTable
  const columns = useMemo(() => {
    if (tab === 'appointments') {
      return [
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
          header: 'Preferred Date',
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => renderStatusPill(item.status),
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
              onClick={() => handleOpenDetailModal(item, 'appointment')}
            >
              <i className="fa-regular fa-eye"></i>
              <span>View</span>
            </button>
          ),
        },
      ];
    }

    if (tab === 'services') {
      return [
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
          header: 'Date Finished / Updated',
        },
        {
          key: 'status',
          header: 'Status',
          render: (item) => renderStatusPill(item.status),
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
              onClick={() => handleOpenDetailModal(item, 'service')}
            >
              <i className="fa-regular fa-eye"></i>
              <span>View</span>
            </button>
          ),
        },
      ];
    }

    // tab === 'payments'
    return [
      {
        key: 'receiptNo',
        header: 'Receipt / Ref',
        render: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--purple-dark, #4338ca)' }}>
              {item.receiptNo || 'RCT-N/A'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {item.id}
            </span>
          </div>
        ),
      },
      {
        key: 'client',
        header: 'Client Name',
        render: (item) => (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong>{item.clientName || 'Valued Client'}</strong>
            {item.clientEmail && (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.clientEmail}</span>
            )}
          </div>
        ),
      },
      {
        key: 'service',
        header: 'Service Title',
        render: (item) => item.serviceTitle || item.serviceType || 'Custom Service',
      },
      {
        key: 'amount',
        header: 'Amount Paid',
        render: (item) => (
          <strong style={{ color: '#166534', fontSize: '0.875rem' }}>
            {formatCurrency(item.amount)}
          </strong>
        ),
      },
      {
        key: 'method',
        header: 'Payment Method',
        render: (item) => {
          const isCash = isCashPayment(item.paymentMethod || item.paymentMethodType, item.provider);
          return (
            <span className={`op-payment-method-pill ${isCash ? 'cash' : 'electronic'}`}>
              <i className={`fa-solid ${isCash ? 'fa-money-bill-wave' : 'fa-qrcode'}`}></i>
              <span>{formatPaymentMethodPill(item.paymentMethod || item.paymentMethodType, item.provider)}</span>
            </span>
          );
        },
      },
      {
        key: 'date',
        header: 'Date Paid',
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => renderStatusPill(item.status),
      },
      {
        key: 'actions',
        header: 'Action',
        render: (item) => (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
              onClick={() => handleOpenDetailModal(item, 'payment')}
              title="Inspect transaction audit and details"
            >
              <i className="fa-regular fa-eye"></i>
              <span>View</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm op-history-receipt-btn"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                borderColor: '#fecaca',
                background: '#fef2f2',
                color: '#dc2626'
              }}
              onClick={() => openPdfModal({ type: 'receipt', data: item })}
              title="Open Official Electronic Receipt"
            >
              <i className="fa-solid fa-file-invoice"></i>
              <span>Receipt</span>
            </button>
          </div>
        ),
      },
    ];
  }, [tab, openPdfModal]);

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'History' },
  ];

  return (
    <main className="operator-history-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <PageHeader
        title="History Records"
        subtitle="View past appointments, completed services, confirmed payment transactions, and cancelled fulfillments with full audit trails"
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
          <button
            className={`op-tab ${tab === 'payments' ? 'active' : ''}`}
            onClick={() => {
              setTab('payments');
              setCurrentPage(1);
            }}
          >
            Payment History ({paymentHistory.length})
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
                icon: tab === 'payments' ? 'fa-solid fa-receipt' : 'fa-regular fa-clock',
                message: activeError || (tab === 'payments' ? 'No payment transaction records found' : 'No history records found'),
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
      {isModalOpen && selectedRecord && (
        <HistoryDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseDetailModal}
          data={selectedRecord}
          type={modalType}
        />
      )}
    </main>
  );
}
