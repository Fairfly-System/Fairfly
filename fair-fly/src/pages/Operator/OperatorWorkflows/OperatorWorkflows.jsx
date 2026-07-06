import { useState } from 'react';
import './operator-workflows.css';

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

  return (
    <div className="card op-workflows">
      <div className="op-workflows-header">
        <h2>Workflow Templates</h2>
        <p>Standard processes for each service type</p>
      </div>

      <div className="op-tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`op-tab ${active === tab ? 'active' : ''}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="op-step-list">
        {WORKFLOWS[active].map((step, i) => (
          <div key={i} className="op-step">
            <span className="op-step-num">{i + 1}</span>
            <span className="op-step-text">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
