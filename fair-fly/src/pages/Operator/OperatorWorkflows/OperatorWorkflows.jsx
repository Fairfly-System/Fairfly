import { useState, useMemo } from 'react';
import './operator-workflows.css';
import Pagination from '../../../components/UI/Pagination/Pagination';

const WORKFLOWS = {
  PSA: [
    'Receive client inquiry and requirements',
    'Verify client documents and IDs',
    'Submit request to PSA office',
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

export default function OperatorWorkflows() {
  const [active, setActive] = useState('PSA');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const activeSteps = WORKFLOWS[active] || [];

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
        <h2>Workflow Steps Reference</h2>
        <p>Standardized operational procedures for service processing</p>
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
            {tab} ({WORKFLOWS[tab].length} Steps)
          </button>
        ))}
      </div>

      <div className="op-step-list">
        {paginatedSteps.map((s) => (
          <div key={s.stepNum} className="op-step">
            <span className="op-step-num">{s.stepNum}</span>
            <span className="op-step-text">{s.text}</span>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
