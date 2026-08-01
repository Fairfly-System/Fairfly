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

// ── Chart Data ─────────────────────────────────────────────────────────────
export const revenueData = [
  { month: 'Jan', revenue: 185000 },
  { month: 'Feb', revenue: 210000 },
  { month: 'Mar', revenue: 195000 },
  { month: 'Apr', revenue: 240000 },
  { month: 'May', revenue: 220000 },
  { month: 'Jun', revenue: 260000 },
  { month: 'Jul', revenue: 275000 },
  { month: 'Aug', revenue: 250000 },
  { month: 'Sep', revenue: 290000 },
  { month: 'Oct', revenue: 310000 },
  { month: 'Nov', revenue: 295000 },
  { month: 'Dec', revenue: 330000 },
];

export const servicesCompletedData = [
  { month: 'Jan', completed: 32 },
  { month: 'Feb', completed: 41 },
  { month: 'Mar', completed: 38 },
  { month: 'Apr', completed: 50 },
  { month: 'May', completed: 47 },
  { month: 'Jun', completed: 55 },
  { month: 'Jul', completed: 60 },
  { month: 'Aug', completed: 58 },
  { month: 'Sep', completed: 63 },
  { month: 'Oct', completed: 70 },
  { month: 'Nov', completed: 66 },
  { month: 'Dec', completed: 75 },
];
