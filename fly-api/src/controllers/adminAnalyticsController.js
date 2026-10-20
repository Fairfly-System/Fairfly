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

  const normalizedPeriod = period || 'month';
  if (!VALID_PERIODS.has(normalizedPeriod)) {
    const error = new Error('period must be one of: day, week, month, year, overall');
    error.statusCode = 400;
    throw error;
  }

  if (normalizedPeriod === 'overall') {
    return { from: null, to: null, key: normalizedPeriod };
  }

  const now = new Date();
  let from;
  let to;

  if (normalizedPeriod === 'day') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  } else if (normalizedPeriod === 'week') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const day = from.getUTCDay();
    from.setUTCDate(from.getUTCDate() - (day === 0 ? 6 : day - 1)); // Monday
    to = new Date(from);
    to.setUTCDate(from.getUTCDate() + 6);
    to.setUTCHours(23, 59, 59, 999);
  } else if (normalizedPeriod === 'month') {
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), lastDay, 23, 59, 59, 999));
  } else {
    // year
    from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    to = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
  }

  return { from, to, key: normalizedPeriod };
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

function operatorName(operator) {
  return operator.branchName || operator.name || operator.fullName || operator.email || 'Unnamed operator';
}

/**
 * Generates continuous, zero-filled timeline buckets for the selected period
 */
function generateTimelineBuckets(range, period) {
  const buckets = new Map();

  if (period === 'day') {
    for (let h = 0; h < 24; h++) {
      buckets.set(`${String(h).padStart(2, '0')}:00`, 0);
    }
  } else if (period === 'week') {
    const cur = new Date(range.from);
    for (let d = 0; d < 7; d++) {
      const label = cur.toISOString().slice(0, 10);
      buckets.set(label, 0);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
  } else if (period === 'month') {
    const year = range.from.getUTCFullYear();
    const month = range.from.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(Date.UTC(year, month, d));
      buckets.set(dt.toISOString().slice(0, 10), 0);
    }
  } else if (period === 'year') {
    const year = range.from.getUTCFullYear();
    for (let m = 1; m <= 12; m++) {
      buckets.set(`${year}-${String(m).padStart(2, '0')}`, 0);
    }
  } else if (period === 'custom' && range.from && range.to) {
    const cur = new Date(range.from);
    const end = new Date(range.to);
    let count = 0;
    while (cur <= end && count <= 90) {
      buckets.set(cur.toISOString().slice(0, 10), 0);
      cur.setUTCDate(cur.getUTCDate() + 1);
      count++;
    }
  }

  return buckets;
}

function getBucketKey(date, period) {
  if (period === 'day') {
    return `${date.toISOString().slice(11, 13)}:00`;
  }
  if (period === 'week' || period === 'month' || period === 'custom') {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 7); // YYYY-MM for year and overall
}

async function getAdminAnalytics(req, res) {
  try {
    const { operatorId, period, from, to } = req.query;
    const range = getPeriodRange(period, from, to);

    // 1. Fetch operators and system_stats/revenue (for all-time cache and metadata)
    const [operatorsSnapshot, statsDocSnap] = await Promise.all([
      db.collection('users').where('role', '==', 'operator').get(),
      db.collection('system_stats').doc('revenue').get().catch(() => null)
    ]);

    const operators = operatorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const operatorMap = new Map(operators.map((operator) => [operator.id, operator]));

    // 2. Fetch payments strictly by status == 'PAID' (Ground Truth for Revenue)
    const paymentsSnap = await db.collection('payments')
      .where('status', '==', 'PAID')
      .get();

    // 3. Fetch completed services (Ground Truth for Operational Completion)
    const servicesSnap = await db.collection('activeServices')
      .where('status', '==', 'Completed')
      .get();

    // 4. Fetch tickets
    const ticketsSnap = await db.collection('tickets').get();

    // Filter in range
    const validPayments = paymentsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => isInRange(p.paidAt || p.createdAt, range))
      .filter((p) => !operatorId || (p.operatorId === operatorId || p.branchUid === operatorId));

    const completedServices = servicesSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((s) => isInRange(s.completedAt, range))
      .filter((s) => !operatorId || (s.fulfilledBranchUid === operatorId || s.branchUid === operatorId || s.operatorId === operatorId));

    const tickets = ticketsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((ticket) => isInRange(ticket.createdAt, range))
      .filter((ticket) => !operatorId || ticket.operatorId === operatorId);

    // Initialize operator metrics map
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

    // Populate revenue strictly from verified payments!
    validPayments.forEach((p) => {
      const opId = p.operatorId || p.branchUid;
      const metrics = operatorMetrics.get(opId);
      if (metrics) {
        metrics.revenue += Number(p.amount || 0);
      }
    });

    // Populate completed services & lastCompletedAt from completed services
    const serviceRanking = new Map();
    completedServices.forEach((service) => {
      const opId = service.fulfilledBranchUid || service.branchUid || service.operatorId;
      const metrics = operatorMetrics.get(opId);
      if (metrics) {
        metrics.completedServices += 1;
        const completedAt = toDate(service.completedAt);
        if (!metrics.lastCompletedAt || completedAt > new Date(metrics.lastCompletedAt)) {
          metrics.lastCompletedAt = completedAt.toISOString();
        }
      }

      const serviceType = service.serviceTitle || service.serviceType || 'Uncategorized service';
      serviceRanking.set(serviceType, (serviceRanking.get(serviceType) || 0) + 1);
    });

    // Build timeline buckets with continuous zero-filled interpolation
    const revenueBuckets = generateTimelineBuckets(range, range.key);

    validPayments.forEach((p) => {
      const paidDate = toDate(p.paidAt || p.createdAt);
      if (paidDate) {
        const key = getBucketKey(paidDate, range.key);
        if (revenueBuckets.has(key)) {
          revenueBuckets.set(key, (revenueBuckets.get(key) || 0) + Number(p.amount || 0));
        } else {
          revenueBuckets.set(key, (revenueBuckets.get(key) || 0) + Number(p.amount || 0));
        }
      }
    });

    // Tickets processing (open & priority)
    tickets.forEach((ticket) => {
      const metrics = operatorMetrics.get(ticket.operatorId);
      if (!metrics) return;
      if (String(ticket.status || '').toLowerCase() !== 'closed') metrics.openTickets += 1;
      if (['urgent', 'high'].includes(String(ticket.priority || '').toLowerCase())) metrics.highPriorityTickets += 1;
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