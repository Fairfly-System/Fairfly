const { db } = require('../config/firebase');

const VALID_PERIODS = new Set(['day', 'week', 'month', 'year', 'overall']);

function parseDate(value, fieldName) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function getPeriodRange(period, fromValue, toValue) {
  const parsedFrom = parseDate(fromValue, 'from');
  const parsedTo = parseDate(toValue, 'to');

  if (parsedFrom || parsedTo) {
    if (!parsedFrom || !parsedTo || parsedFrom > parsedTo) {
      const error = new Error('from and to must be provided as a valid range');
      error.statusCode = 400;
      throw error;
    }

    const end = new Date(parsedTo);
    end.setUTCHours(23, 59, 59, 999);
    return { from: parsedFrom, to: end, key: 'custom' };
  }

  const normalizedPeriod = period || 'overall';
  if (!VALID_PERIODS.has(normalizedPeriod)) {
    const error = new Error('period must be one of: week, month, year, overall');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedPeriod === 'overall') {
    return { from: null, to: null, key: normalizedPeriod };
  }

  const now = new Date();
  const periodEnd = new Date(now);
  let from;

  if (normalizedPeriod === 'day') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else if (normalizedPeriod === 'week') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = from.getUTCDay();
    from.setUTCDate(from.getUTCDate() - (day === 0 ? 6 : day - 1));
  } else if (normalizedPeriod === 'month') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else {
    from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }

  return { from, to: periodEnd, key: normalizedPeriod };
}

function toDate(value) {
  if (!value) return null;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isInRange(value, range) {
  if (!range.from && !range.to) return true;
  const date = toDate(value);
  return Boolean(date && date >= range.from && date <= range.to);
}

function normalizeAmount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value || '').replace(/[^0-9.-]/g, '');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function serviceOperatorId(service) {
  return service.fulfilledBranchUid || service.branchUid || service.operatorId || null;
}

function operatorName(operator) {
  return operator.branchName || operator.name || operator.fullName || operator.email || 'Unnamed operator';
}

function isCompleted(service) {
  return String(service.status || '').toLowerCase() === 'completed' && Boolean(service.completedAt);
}

function formatBucket(date, period) {
  if (period === 'day' || period === 'week' || period === 'custom') {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 7);
}

async function getAdminAnalytics(req, res) {
  try {
    const { operatorId, period, from, to } = req.query;
    const range = getPeriodRange(period, from, to);
    const [operatorsSnapshot, servicesSnapshot, ticketsSnapshot] = await Promise.all([
      db.collection('users').where('role', '==', 'operator').get(),
      db.collection('activeServices').get(),
      db.collection('tickets').get(),
    ]);

    const operators = operatorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const operatorMap = new Map(operators.map((operator) => [operator.id, operator]));
    const completedServices = servicesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((service) => isCompleted(service) && isInRange(service.completedAt, range))
      .filter((service) => !operatorId || serviceOperatorId(service) === operatorId);

    const tickets = ticketsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((ticket) => isInRange(ticket.createdAt, range))
      .filter((ticket) => !operatorId || ticket.operatorId === operatorId);

    const operatorMetrics = new Map();
    operators.forEach((operator) => {
      operatorMetrics.set(operator.id, {
        id: operator.id,
        name: operatorName(operator),
        email: operator.email || '',
        branchName: operator.branchName || '',
        completedServices: 0,
        revenue: 0,
        openTickets: 0,
        highPriorityTickets: 0,
        lastCompletedAt: null,
      });
    });

    const revenueBuckets = new Map();
    const serviceRanking = new Map();
    completedServices.forEach((service) => {
      const id = serviceOperatorId(service);
      const metrics = operatorMetrics.get(id);
      if (metrics) {
        metrics.completedServices += 1;
        metrics.revenue += normalizeAmount(service.revenueAmount || service.price || service.servicePrice);
        const completedAt = toDate(service.completedAt);
        if (!metrics.lastCompletedAt || completedAt > new Date(metrics.lastCompletedAt)) {
          metrics.lastCompletedAt = completedAt.toISOString();
        }
      }

      const serviceType = service.serviceType || 'Uncategorized service';
      serviceRanking.set(serviceType, (serviceRanking.get(serviceType) || 0) + 1);

      const completedAt = toDate(service.completedAt);
      if (completedAt) {
        const bucket = formatBucket(completedAt, range.key);
        revenueBuckets.set(bucket, (revenueBuckets.get(bucket) || 0) + normalizeAmount(service.revenueAmount || service.price || service.servicePrice));
      }
    });

    const highPriorityTickets = tickets
        .filter((ticket) => ['urgent', 'high'].includes(String(ticket.priority || '').toLowerCase()))
      .filter((ticket) => String(ticket.status || '').toLowerCase() !== 'closed')
      .sort((first, second) => (toDate(second.createdAt)?.getTime() || 0) - (toDate(first.createdAt)?.getTime() || 0))
      .slice(0, 20)
      .map((ticket) => ({
        id: ticket.id,
        title: ticket.title || 'Untitled ticket',
        operatorId: ticket.operatorId || null,
        operatorName: ticket.operatorName || operatorName(operatorMap.get(ticket.operatorId) || {}),
        priority: ticket.priority || 'High',
        status: ticket.status || 'Pending',
        createdAt: ticket.createdAt || null,
      }));

    const ticketRows = tickets
      .filter((ticket) => String(ticket.status || '').toLowerCase() !== 'closed')
      .sort((first, second) => (toDate(second.createdAt)?.getTime() || 0) - (toDate(first.createdAt)?.getTime() || 0))
      .slice(0, 50)
      .map((ticket) => ({
        id: ticket.id,
        title: ticket.title || 'Untitled ticket',
        operatorId: ticket.operatorId || null,
        operatorName: ticket.operatorName || operatorName(operatorMap.get(ticket.operatorId) || {}),
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Pending',
        createdAt: ticket.createdAt || null,
      }));

    tickets.forEach((ticket) => {
      const metrics = operatorMetrics.get(ticket.operatorId);
      if (!metrics) return;
      if (String(ticket.status || '').toLowerCase() !== 'closed') metrics.openTickets += 1;
      if (['urgent', 'high'].includes(String(ticket.priority || '').toLowerCase())) metrics.highPriorityTickets += 1;
    });

    const rows = [...operatorMetrics.values()]
      .filter((operator) => !operatorId || operator.id === operatorId)
      .map((operator) => ({ ...operator, revenue: Math.round(operator.revenue * 100) / 100 }));
    const totals = rows.reduce((summary, row) => ({
      completedServices: summary.completedServices + row.completedServices,
      revenue: summary.revenue + row.revenue,
      openTickets: summary.openTickets + row.openTickets,
      highPriorityTickets: summary.highPriorityTickets + row.highPriorityTickets,
    }), { completedServices: 0, revenue: 0, openTickets: 0, highPriorityTickets: 0 });

    return res.status(200).json({
      period: range.key,
      range: { from: range.from?.toISOString() || null, to: range.to?.toISOString() || null },
      operatorId: operatorId || null,
      totals: { ...totals, revenue: Math.round(totals.revenue * 100) / 100 },
      operators: rows,
      revenueTrend: [...revenueBuckets.entries()]
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([label, revenue]) => ({ label, revenue: Math.round(revenue * 100) / 100 })),
      serviceRanking: [...serviceRanking.entries()]
        .sort(([, first], [, second]) => second - first)
        .map(([serviceType, completed]) => ({ serviceType, completed })),
      tickets: ticketRows,
      highPriorityTickets,
    });
  } catch (error) {
    console.error('Error generating admin analytics:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Internal Server Error' });
  }
}

module.exports = { getAdminAnalytics };