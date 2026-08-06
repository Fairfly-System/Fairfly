import { useState, useMemo } from 'react';
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
          <h2>Template-Driven Booking Workflows</h2>
          <p>Admin-standardized step-by-step operational procedures for service processing</p>
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
            {tab} ({activeSteps.length} Steps)
          </button>
        ))}
      </div>

      <div className="op-step-list">
        {loading ? (
          <div className="empty-state-box"><p>Loading workflow templates...</p></div>
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
  return (
    <OperatorProvider targetCollection="workflowTemplates">
      <WorkflowContent />
    </OperatorProvider>
  );
}
