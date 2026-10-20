import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuthContext } from '../../../context/AuthContext';
import AdminWorkflowTemplates from '../../Admin/AdminWorkflowTemplates/AdminWorkflowTemplates';
import Breadcrumbs from '../../../components/UI/Breadcrumbs/Breadcrumbs';
import PageHeader from '../../../components/UI/PageHeader/PageHeader';
import OperatorProvider, { useOperatorContext } from '../../../context/OperatorContext';
import Pagination from '../../../components/UI/Pagination/Pagination';
import './operator-workflows.css';

const DEFAULT_WORKFLOWS = {
  PSA: [
    'Receive client inquiry and requirements',
    'Verify client documents and IDs',
    'Submit request to PSA office portal',
    'Track application status',
    'Receive PSA certificate',
    'Quality check and verification',
    'Notify client for pickup/delivery',
    'Complete service and collect payment',
  ],
  Passport: [
    'Receive client inquiry and documents',
    'Review passport application requirements',
    'Schedule DFA appointment',
    'Accompany client to DFA office',
    'Submit passport application',
    'Track passport status',
    'Receive passport from DFA',
    'Deliver passport to client',
    'Complete service and collect payment',
  ],
  VISA: [
    'Receive visa application inquiry',
    'Assess visa type and requirements',
    'Collect required documents',
    'Complete visa application form',
    'Schedule embassy appointment',
    'Submit visa application',
    'Track visa processing',
    'Receive visa decision',
    'Notify client and arrange delivery',
    'Complete service and collect payment',
  ],
  Tour: [
    'Receive tour inquiry and preferences',
    'Prepare tour package options',
    'Confirm booking with client',
    'Process tour payment',
    'Coordinate with tour operator',
    'Send itinerary and confirmation',
    'Follow up before travel date',
    'Post-tour feedback collection',
  ],
  Tickets: [
    'Receive ticket booking inquiry',
    'Search available flights',
    'Present options to client',
    'Confirm flight selection',
    'Process ticket payment',
    'Issue airline ticket',
    'Send confirmation to client',
    'Provide travel reminders',
  ],
};

const TABS = ['PSA', 'Passport', 'VISA', 'Tour', 'Tickets'];

function WorkflowContent() {
  const { data: dbTemplates, loading } = useOperatorContext();
  const [active, setActive] = useState('PSA');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const activeSteps = useMemo(() => {
    if (dbTemplates && dbTemplates.length > 0) {
      const match = dbTemplates.find(
        (t) => (t.type || t.serviceType || t.name || '').toLowerCase() === active.toLowerCase()
      );
      if (match && Array.isArray(match.steps) && match.steps.length > 0) {
        return match.steps.map((s) => (typeof s === 'string' ? s : s.title || s.name || 'Workflow Step'));
      }
    }
    return DEFAULT_WORKFLOWS[active] || [];
  }, [dbTemplates, active]);

  // Compute individual step counts per workflow tab so swapping tabs does not alter other tabs' counts
  const tabStepCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((tab) => {
      let count = 0;
      if (dbTemplates && dbTemplates.length > 0) {
        const match = dbTemplates.find(
          (t) => (t.type || t.serviceType || t.name || '').toLowerCase() === tab.toLowerCase()
        );
        if (match && Array.isArray(match.steps) && match.steps.length > 0) {
          count = match.steps.length;
        }
      }
      if (count === 0 && DEFAULT_WORKFLOWS[tab]) {
        count = DEFAULT_WORKFLOWS[tab].length;
      }
      counts[tab] = count;
    });
    return counts;
  }, [dbTemplates]);

  const paginatedSteps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeSteps.slice(start, start + pageSize).map((text, i) => ({
      stepNum: start + i + 1,
      text,
    }));
  }, [activeSteps, currentPage, pageSize]);

  return (
    <div className="card op-workflows page-fade-in">
      <div className="op-workflows-header">
        <div>
          <h2>Standard Operating Procedures</h2>
          <p>Standardized step-by-step procedures for branch service fulfillment</p>
        </div>
      </div>

      <div className="op-tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`op-tab ${active === tab ? 'active' : ''}`}
            onClick={() => {
              setActive(tab);
              setCurrentPage(1);
            }}
          >
            {tab} ({tabStepCounts[tab] || 0} Steps)
          </button>
        ))}
      </div>

      <div className="op-step-list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-step-${i}`} className="op-step" aria-busy="true">
              <span className="skeleton skeleton-circle" style={{ width: '1.75rem', height: '1.75rem', minWidth: '1.75rem' }} />
              <span className="skeleton skeleton-text" style={{ width: `${60 + (i % 3) * 15}%`, height: '1rem', margin: 0 }} />
            </div>
          ))
        ) : paginatedSteps.length === 0 ? (
          <div className="empty-state-box"><p>No steps defined for this workflow</p></div>
        ) : (
          paginatedSteps.map((s) => (
            <div key={s.stepNum} className="op-step">
              <span className="op-step-num">{s.stepNum}</span>
              <span className="op-step-text">{s.text}</span>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={activeSteps.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

export default function OperatorWorkflows() {
  const { userDetails } = useAuthContext();

  if (userDetails?.isQualified) {
    return <AdminWorkflowTemplates />;
  }

  const breadcrumbItems = [
    { label: 'Dashboard', to: '/operator' },
    { label: 'Workflows' },
  ];

  return (
    <main className="operator-workflows-page page-fade-in">
      <Breadcrumbs items={breadcrumbItems} />
      <PageHeader
        title="Standard Booking Workflows"
        subtitle="Operational procedures and step-by-step service pipelines"
        illustrationSrc="/pageImages/admin/workflow-templates.png"
      />

      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.25rem',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              flexShrink: 0
            }}
          >
            <i className="fa-solid fa-lock"></i>
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#92400e' }}>
              Workflow Creation Restricted
            </h4>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8125rem', color: '#b45309' }}>
              Creating and editing custom workflow templates requires <strong>Qualified Operator</strong> certification.
            </p>
          </div>
        </div>
        <Link to="/operator/services" className="btn-primary btn-sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <i className="fa-solid fa-certificate" style={{ marginRight: '0.4rem' }}></i>
          Apply for Qualification
        </Link>
      </div>

      <OperatorProvider targetCollection="workflowTemplates">
        <WorkflowContent />
      </OperatorProvider>
    </main>
  );
}
