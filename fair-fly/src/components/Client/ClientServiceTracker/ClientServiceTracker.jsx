import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Steps from './Steps/Steps';
import './service-tracker.css';

export default function ClientServiceTracker({ service }) {
  const [showSteps, setShowSteps] = useState(false);

  if (!service) return null;

  const toggleSteps = () => {
    setShowSteps(!showSteps);
  };

  const stepsList = service.steps || [
    { status: 'completed', description: 'Receive client information' },
    { status: 'in-progress', description: 'Verify client information' },
    { status: 'todo', description: 'Submit client information' }
  ];

  const completedCount = Array.isArray(service.steps)
    ? service.steps.filter((s) => s.status === 'Completed').length
    : 0;

  const totalSteps = Array.isArray(service.steps) ? service.steps.length : stepsList.length;
  const progressPct = service.progress !== undefined
    ? service.progress
    : totalSteps > 0
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

  const serviceTitle = service.serviceType || service.title || 'Client Service Request';
  const branchName = service.branchName ? `Branch: ${service.branchName}` : null;
  const dateFormatted = service.startedAt
    ? new Date(service.startedAt).toLocaleDateString()
    : service.dateRequested || 'Recently';

  const isCompleted = service.status === 'Completed';

  // Format steps for Steps child component
  const formattedSteps = stepsList.map((s, idx) => ({
    status: s.status === 'Completed' ? 'completed' : s.status === 'Currently Processing' || s.status === 'Ongoing' ? 'in-progress' : 'todo',
    description: s.title || s.description || `Step ${idx + 1}`
  }));

  return (
    <div className="service-tracker">
      <div className="service-tracker-header">
        <div className="service-tracker-title">
          <h2>{serviceTitle}</h2>
          <p>Requested: {dateFormatted} {branchName ? `· ${branchName}` : ''}</p>
        </div>
        <div className={`service-tracker-status ${isCompleted ? 'completed' : 'in-progress'}`}>
          {isCompleted ? 'Complete' : service.status || 'In Progress'}
        </div>
      </div>

      <div className="service-tracker-progress">
        <div className="progress-bar-header">
          <h3>Progress ({completedCount} of {totalSteps} steps)</h3>
          <p>{progressPct}%</p>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
        </div>
        {service.estimatedCompletion && (
          <h3 className="estimated-completion">Estimated Completion: {service.estimatedCompletion}</h3>
        )}
      </div>

      <p className={`service-steps-show ${showSteps ? 'active' : ''}`} onClick={toggleSteps}>
        <ChevronDown className="icon-chevron-down" />
        {!showSteps ? 'Show Workflow Steps' : 'Hide Workflow Steps'}
      </p>

      {showSteps ? <Steps steps={formattedSteps} /> : null}
    </div>
  );
}