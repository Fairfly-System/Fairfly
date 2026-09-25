// ── Action Metadata Definitions ──────────────────────────────────────────────
export const ACTION_META = {
  CREATE: { label: 'Created', icon: 'fa-solid fa-plus', color: '#16a34a', bg: '#dcfce7' },
  UPDATE: { label: 'Updated', icon: 'fa-solid fa-pen', color: '#3b82f6', bg: '#dbeafe' },
  DELETE: { label: 'Deleted', icon: 'fa-solid fa-trash-can', color: '#dc2626', bg: '#fee2e2' },
};

// ── Time & Formatting Helpers ───────────────────────────────────────────────
export function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export function humanResourceType(type) {
  const map = {
    service: 'Service',
    operator: 'Operator',
    workflowTemplate: 'Workflow Template',
    workflowInstance: 'Workflow Instance',
    franchiseApplication: 'Franchise App',
    quicklink: 'Quick Link',
    chat: 'Chat',
    unknown: 'Resource',
  };
  return map[type] || type;
}

export function formatLogLine(log) {
  const date = new Date(log.timestamp);
  const dateStr = date.toISOString().replace('T', ' ').slice(0, 19);
  const resource = humanResourceType(log.resourceType);
  const id = log.resourceId ? ` (ID: ${log.resourceId})` : '';
  return `[${dateStr}] ${log.actionType} ${resource}${id} by ${log.adminEmail} (${log.adminUid}) — HTTP ${log.method} ${log.path} → ${log.statusCode}`;
}

export const PERIOD_OPTIONS = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export function formatCurrency(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;
}

export function formatReportPeriod(analytics) {
  if (!analytics?.range?.from && !analytics?.range?.to) return 'All available time';
  const from = analytics.range.from ? new Date(analytics.range.from).toLocaleDateString() : 'Start';
  const to = analytics.range.to ? new Date(analytics.range.to).toLocaleDateString() : 'Present';
  return `${from} - ${to}`;
}

export function toRevenueChartData(revenueTrend = []) {
  return revenueTrend.map(({ label, revenue }) => ({
    month: label,
    revenue: Number(revenue || 0),
  }));
}

export function escapeCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildAnalyticsCsv(analytics, scopeLabel = 'Overall') {
  const lines = [
    ['FairFly Analytics Report', scopeLabel, formatReportPeriod(analytics)],
    [],
    ['Operator', 'Completed Services', 'Revenue', 'Open Tickets', 'High Priority Tickets', 'Last Completed'],
    ...(analytics?.operators || []).map((operator) => [
      operator.name,
      operator.completedServices,
      operator.revenue,
      operator.openTickets,
      operator.highPriorityTickets,
      operator.lastCompletedAt || '',
    ]),
    [],
    ['Most Picked Completed Services', 'Completed'],
    ...(analytics?.serviceRanking || []).map((service) => [service.serviceType, service.completed]),
  ];

  return lines.map((line) => line.map(escapeCsvValue).join(',')).join('\n');
}
