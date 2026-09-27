const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_PDF_PATH = 'C:\\Users\\Isaac\\Downloads\\Fair2\\Fairfly\\Fairfly_Firestore_Bandwidth_Optimization_Plan.pdf';
const TEMP_HTML_PATH = path.join(__dirname, 'bandwidth_report_temp.html');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FairFly Firestore Bandwidth Optimization Audit & Implementation Plan</title>
<style>
  @page {
    size: A4;
    margin: 12mm 12mm 12mm 12mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.45;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  /* Header Cover */
  .cover-container {
    padding: 24px 20px 16px 20px;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 20px;
  }
  .brand-badge {
    display: inline-block;
    padding: 5px 12px;
    background: #4f46e5;
    color: #ffffff;
    font-weight: 700;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    border-radius: 6px;
    margin-bottom: 12px;
  }
  h1.report-title {
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 0 0 8px 0;
  }
  p.report-subtitle {
    font-size: 11pt;
    color: #64748b;
    margin: 0 0 16px 0;
    font-weight: 400;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 14px;
    background: #f8fafc;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  .meta-item strong {
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 2px;
    letter-spacing: 0.5px;
  }
  .meta-item span {
    font-size: 8.5pt;
    font-weight: 600;
    color: #1e293b;
  }

  /* Headings */
  h2.section-title {
    font-size: 13pt;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 5px;
    margin: 18px 0 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h3.subsection-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1e293b;
    margin: 14px 0 6px 0;
  }

  /* Stat Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 12px 0;
  }
  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
  }
  .stat-card.alert {
    background: #fef2f2;
    border-color: #fecaca;
  }
  .stat-card.success {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .stat-card.warning {
    background: #fffbeb;
    border-color: #fde68a;
  }
  .stat-number {
    font-size: 16pt;
    font-weight: 800;
    color: #4f46e5;
    line-height: 1;
    margin-bottom: 3px;
  }
  .stat-card.alert .stat-number { color: #dc2626; }
  .stat-card.success .stat-number { color: #16a34a; }
  .stat-card.warning .stat-number { color: #d97706; }
  .stat-label {
    font-size: 7.5pt;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }

  /* Tables */
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 7.5pt;
  }
  table.data-table th {
    background-color: #f1f5f9;
    color: #334155;
    text-align: left;
    padding: 6px 8px;
    font-weight: 700;
    border-bottom: 2px solid #cbd5e1;
    text-transform: uppercase;
    font-size: 7pt;
    letter-spacing: 0.5px;
  }
  table.data-table td {
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }
  table.data-table tr:nth-child(even) {
    background-color: #f8fafc;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 6.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .badge-warning { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .badge-success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-info { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
  .badge-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

  /* Callout boxes */
  .callout {
    padding: 10px 14px;
    border-radius: 6px;
    margin: 10px 0;
    border-left: 4px solid;
    font-size: 8pt;
  }
  .callout-warning {
    background-color: #fffbeb;
    border-left-color: #f59e0b;
    color: #92400e;
  }
  .callout-danger {
    background-color: #fef2f2;
    border-left-color: #ef4444;
    color: #991b1b;
  }
  .callout-info {
    background-color: #eff6ff;
    border-left-color: #3b82f6;
    color: #1e40af;
  }
  .callout-success {
    background-color: #f0fdf4;
    border-left-color: #22c55e;
    color: #166534;
  }

  /* Code snippet block */
  pre.code-block {
    background: #0f172a;
    color: #f8fafc;
    padding: 10px 12px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 7.2pt;
    line-height: 1.35;
    overflow-x: hidden;
    margin: 8px 0;
  }
  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  ul, ol {
    margin: 4px 0 8px 18px;
    padding: 0;
  }
  li {
    margin-bottom: 3px;
  }
</style>
</head>
<body>

  <!-- COVER PAGE / HEADER -->
  <div class="cover-container">
    <div class="brand-badge">FairFly Enterprise Architecture • Bandwidth & Database Audit</div>
    <h1 class="report-title">Firestore Data Fetching & Pagination Optimization Audit</h1>
    <p class="report-subtitle">Comprehensive Architectural Audit of 22 Tables & Lists, Query-Level Cursor Pagination Design, Real-Time Listener Optimization, and Phased Implementation Plan</p>
    
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Audit Target</strong>
        <span>fair-fly (Frontend) & fly-api (Backend)</span>
      </div>
      <div class="meta-item">
        <strong>Audit Date</strong>
        <span>September 27, 2026</span>
      </div>
      <div class="meta-item">
        <strong>Auditor</strong>
        <span>Lead Systems & AI Solutions Architect</span>
      </div>
      <div class="meta-item">
        <strong>Status</strong>
        <span>Audit Completed — Plan Awaiting Approval</span>
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <h2 class="section-title">1. Executive Summary & Impact Analysis</h2>
  <p>
    A comprehensive code audit was conducted across every React component, custom hook, service module, and Express backend route in the <strong>FairFly</strong> application to examine data fetching and pagination behavior.
  </p>
  <p>
    The audit uncovered a <strong>systemic pattern of full-collection fetching paired with client-side JavaScript slicing (<code>array.slice((page - 1) * pageSize, page * pageSize)</code>)</strong>. Out of 22 inspected data tables, lists, and navigation listeners:
  </p>

  <div class="stats-grid">
    <div class="stat-card alert">
      <div class="stat-number">20 / 22</div>
      <div class="stat-label">Tables Fetching Entire Collections</div>
    </div>
    <div class="stat-card alert">
      <div class="stat-number">91%</div>
      <div class="stat-label">Frontend Slicing Rate</div>
    </div>
    <div class="stat-card warning">
      <div class="stat-number">8</div>
      <div class="stat-label">Unconstrained onSnapshot Listeners</div>
    </div>
    <div class="stat-card success">
      <div class="stat-number">90-95%</div>
      <div class="stat-label">Projected Read/Bandwidth Reduction</div>
    </div>
  </div>

  <div class="callout callout-danger">
    <strong>Critical Architectural Bottlenecks Discovered:</strong>
    <ul>
      <li><strong>Unconstrained <code>OperatorProvider</code> & <code>AdminProvider</code>:</strong> Both context providers attach real-time <code>onSnapshot(collection(firestore, targetCollection))</code> with no query limits or where filters. An operator viewing their branch appointments or services downloads <em>every document from every branch in the entire company</em> and filters them client-side in React <code>useMemo</code>.</li>
      <li><strong>Detail Page Full Collection Subscriptions:</strong> In <code>OperatorServiceProcedure.jsx</code>, viewing a single active service by ID currently wraps the page in <code>&lt;OperatorProvider targetCollection="activeServices"&gt;</code>, downloading the <em>entire activeServices collection</em> just to execute <code>activeServices.find(s =&gt; s.id === id)</code>.</li>
      <li><strong>Navigation Layout Polling:</strong> <code>AdminLayout.jsx</code> and <code>OperatorLayout.jsx</code> subscribe to entire collections (including all <code>users</code> with role <code>operator</code> or <code>client</code>) solely to compute badge counter numbers like <code>openTickets</code>, <code>pendingApps</code>, and <code>clientCount</code>.</li>
      <li><strong>Redundant Dual Listeners:</strong> Several views (e.g. <code>OperatorsContent.jsx</code>, <code>OperatorTicketsContent.jsx</code>, and <code>Services.jsx</code>) fetch the entire dataset via REST API while simultaneously opening an unconstrained Firestore <code>onSnapshot</code> listener, doubling network load and Firestore read charges.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- COMPLETE INVENTORY TABLE -->
  <h2 class="section-title">2. Complete Table & List Pagination Inventory</h2>
  <p>The following audit matrix categorizes all 22 data presentation views, their data-fetching pipeline, existing pagination mechanism, collection-level impact, and targeted refactoring strategy:</p>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 17%;">Component / Feature</th>
        <th style="width: 25%;">Current Fetch Strategy</th>
        <th style="width: 15%;">Current Pagination</th>
        <th style="width: 13%;">Fetches All?</th>
        <th style="width: 30%;">Recommended Change</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Admin Clients</strong><br><code>ClientsContent.jsx</code></td>
        <td><code>fetchClients()</code> &rarr; <code>GET /api/clients</code> &rarr; <code>db.collection('users').where('role','==','client').get()</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (All Clients)</span></td>
        <td>Implement query-level pagination on backend with <code>limit</code> and Firestore cursor / offset; debounce search and push filters to query.</td>
      </tr>
      <tr>
        <td><strong>Admin Operators</strong><br><code>OperatorsContent.jsx</code></td>
        <td><strong>Dual Fetch:</strong> <code>fetchOperators()</code> REST + <code>onSnapshot(users where role=='operator')</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (Twice!)</span></td>
        <td>Remove redundant REST call; use single Firestore query with <code>limit(pageSize)</code> and cursor pagination <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Admin Operator Detail</strong><br><code>OperatorDetailPage.jsx</code></td>
        <td>Analytics REST + <code>onSnapshot(collection('activeServices'))</code> filtered in JS by <code>operatorId</code></td>
        <td>Frontend <code>.slice(0, 5)</code> for tickets</td>
        <td><span class="badge badge-danger">YES (All Services)</span></td>
        <td>Constrain <code>activeServices</code> query to <code>where('operatorId', '==', id)</code> with <code>limit(10)</code>; remove global collection scan.</td>
      </tr>
      <tr>
        <td><strong>Admin Dashboard Logs</strong><br><code>AdminDashboard.jsx</code></td>
        <td><code>onSnapshot(query(admin-logs, orderBy('timestamp','desc'), limit(5)))</code></td>
        <td>Firestore <code>limit(5)</code></td>
        <td><span class="badge badge-success">NO (Proper)</span></td>
        <td><strong>Already Compliant:</strong> Uses query-level limit(5). Retain real-time listener.</td>
      </tr>
      <tr>
        <td><strong>Admin Logs Modal</strong><br><code>AdminLogsModal.jsx</code></td>
        <td>Modal open triggers <code>onSnapshot(admin-logs, orderBy('timestamp','desc'))</code> (No limit!)</td>
        <td>Frontend <code>.slice()</code> (pageSize: 10)</td>
        <td><span class="badge badge-danger">YES (All Logs)</span></td>
        <td>Replace with cursor-paginated Firestore query using <code>limit(10)</code>, <code>startAfter()</code>, and forward/back cursor history.</td>
      </tr>
      <tr>
        <td><strong>Admin Franchise Apps</strong><br><code>FranchiseContent.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('franchiseApplications'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (All Apps)</span></td>
        <td>Refactor to cursor-paginated Firestore query <code>orderBy('submittedAt','desc')</code>, <code>limit(8)</code>, <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Admin Inquiry History</strong><br><code>HistoryContent.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('inquiries'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 10)</td>
        <td><span class="badge badge-danger">YES (All Inquiries)</span></td>
        <td>Convert to REST GET endpoint with server-side pagination, or Firestore cursor query with <code>limit(10)</code> and <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Admin Qualifications</strong><br><code>QualificationsContent.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('qualificationApplications'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (All Apps)</span></td>
        <td>Query with <code>where('status','==',filter)</code> (when active), <code>orderBy('createdAt','desc')</code>, <code>limit(8)</code>, <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Admin Quick Links</strong><br><code>QuickLinksContent.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('quickLinks'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-warning">YES (All Links)</span></td>
        <td>Dataset is small (~20 items); convert to cached REST GET or add Firestore limit(8) if scale demands.</td>
      </tr>
      <tr>
        <td><strong>Admin Resources Library</strong><br><code>ResourcesContent.jsx</code></td>
        <td><code>fetchResources()</code> &rarr; <code>GET /api/resources</code> &rarr; <code>db.collection('resources').get()</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (All Files)</span></td>
        <td>Add <code>limit</code> and <code>page</code> parameters to <code>/api/resources</code>; execute bounded Firestore query on backend.</td>
      </tr>
      <tr>
        <td><strong>Admin Services Catalog</strong><br><code>ServiceContent.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('services'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (All Services)</span></td>
        <td>Query with <code>orderBy('name')</code>, <code>limit(8)</code>, <code>startAfter()</code>; debounce search.</td>
      </tr>
      <tr>
        <td><strong>Admin Support Tickets</strong><br><code>TicketsContent.jsx</code></td>
        <td>Redundant <code>AdminProvider</code> + <code>fetchTickets()</code> &rarr; <code>GET /api/tickets</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 5)</td>
        <td><span class="badge badge-danger">YES (Twice!)</span></td>
        <td>Remove unused <code>AdminProvider</code> wrapper; add <code>limit(5)</code> and cursor pagination to <code>GET /api/tickets</code>.</td>
      </tr>
      <tr>
        <td><strong>Admin Workflow Templates</strong><br><code>AdminWorkflowTemplates.jsx</code></td>
        <td><code>AdminProvider</code> &rarr; <code>onSnapshot(collection('workflowTemplates'))</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-warning">YES (All Templates)</span></td>
        <td>Add query limit(8) with <code>orderBy('createdAt','desc')</code> and cursor pagination.</td>
      </tr>
      <tr>
        <td><strong>Admin Layout Counters</strong><br><code>AdminLayout.jsx</code></td>
        <td><code>onSnapshot</code> on entire <code>services</code> and <code>users</code> (operators+clients)</td>
        <td>No Pagination (Count Only)</td>
        <td><span class="badge badge-danger">YES (Massive!)</span></td>
        <td>Replace collection streaming with Firestore <code>getCountFromServer()</code> aggregation queries or backend counter doc.</td>
      </tr>
      <tr>
        <td><strong>Operator Appointments</strong><br><code>OperatorAppointments.jsx</code></td>
        <td><code>OperatorProvider</code> &rarr; <code>onSnapshot(collection('appointments'))</code></td>
        <td>Client filter + <code>.slice()</code> (pageSize: 5)</td>
        <td><span class="badge badge-danger">YES (All Branches!)</span></td>
        <td>Scope query: <code>where('branchUid','==',user.uid)</code>, <code>orderBy('createdAt','desc')</code>, <code>limit(5)</code>, <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Dashboard</strong><br><code>OperatorDashboard.jsx</code></td>
        <td><code>OperatorProvider</code> &rarr; <code>onSnapshot(collection('activeServices'))</code></td>
        <td>Client filter + <code>.slice()</code> (pageSize: 5)</td>
        <td><span class="badge badge-danger">YES (All Branches!)</span></td>
        <td>Scope query: <code>where('operatorId','==',user.uid)</code>, <code>orderBy('startedAt','desc')</code>, <code>limit(5)</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Service Detail</strong><br><code>OperatorServiceProcedure.jsx</code></td>
        <td><code>OperatorProvider</code> &rarr; <code>onSnapshot(collection('activeServices'))</code></td>
        <td>Single item <code>.find(s =&gt; s.id)</code></td>
        <td><span class="badge badge-danger">YES (Full Collection!)</span></td>
        <td><strong>Critical Fix:</strong> Remove <code>OperatorProvider</code>; use single document listener: <code>onSnapshot(doc(firestore, 'activeServices', id))</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Quotations</strong><br><code>OperatorQuotations.jsx</code></td>
        <td><code>OperatorProvider</code> &rarr; <code>onSnapshot(collection('quotations'))</code></td>
        <td>Client filter + <code>.slice()</code> (pageSize: 5)</td>
        <td><span class="badge badge-danger">YES (All Branches!)</span></td>
        <td>Scope query: <code>where('branchUid','==',user.uid)</code>, <code>orderBy('createdAt','desc')</code>, <code>limit(5)</code>, <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Inquiries</strong><br><code>OperatorInquiryForms.jsx</code></td>
        <td><code>OperatorProvider</code> &rarr; <code>onSnapshot(collection('inquiries'))</code></td>
        <td>Client filter + <code>.slice()</code> (pageSize: 5)</td>
        <td><span class="badge badge-danger">YES (All Branches!)</span></td>
        <td>Scope query: <code>where('branchUid','==',user.uid)</code>, <code>orderBy('createdAt','desc')</code>, <code>limit(5)</code>, <code>startAfter()</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Tickets</strong><br><code>OperatorTicketsContent.jsx</code></td>
        <td>Redundant <code>OperatorProvider</code> + <code>fetchTickets()</code> &rarr; <code>GET /api/tickets</code></td>
        <td>Frontend <code>.slice()</code> (pageSize: 8)</td>
        <td><span class="badge badge-danger">YES (Twice!)</span></td>
        <td>Remove redundant <code>OperatorProvider</code>; pass <code>limit=8</code> and cursor to <code>ticketService.fetchTickets</code>.</td>
      </tr>
      <tr>
        <td><strong>Operator Layout Counters</strong><br><code>OperatorLayout.jsx</code></td>
        <td><code>onSnapshot</code> on entire <code>activeServices</code>, <code>appointments</code>, and <code>tickets</code></td>
        <td>No Pagination (Count Only)</td>
        <td><span class="badge badge-danger">YES (3 Collections!)</span></td>
        <td>Replace full collection listeners with scoped <code>where('branchUid','==',user.uid)</code> using <code>getCountFromServer()</code>.</td>
      </tr>
      <tr>
        <td><strong>Client Marketplace</strong><br><code>ClientServicesMarketplace.jsx</code></td>
        <td><code>fetchServices()</code> REST (downloads all active services into React state)</td>
        <td>Frontend <code>.slice(0, visibleCount)</code> load more</td>
        <td><span class="badge badge-danger">YES (All Services)</span></td>
        <td>Implement server-side cursor pagination with <code>limit=6</code>; request next page upon reaching sentinel scroll element.</td>
      </tr>
      <tr>
        <td><strong>Notifications Drawer</strong><br><code>NotificationContext.jsx</code></td>
        <td><code>onSnapshot(notifications where recipientUid==user.uid, limit(50))</code></td>
        <td>Firestore <code>limit(50)</code></td>
        <td><span class="badge badge-success">NO (Proper)</span></td>
        <td><strong>Already Compliant:</strong> Properly scoped and limited to 50 documents.</td>
      </tr>
      <tr>
        <td><strong>Announcements Feed</strong><br><code>AnnouncementsPage.jsx</code></td>
        <td><code>onSnapshot(announcements, orderBy('createdAt','desc'))</code> (No limit)</td>
        <td>None (Renders all)</td>
        <td><span class="badge badge-warning">YES (All Posts)</span></td>
        <td>Add <code>limit(10)</code> with cursor-based "Load older announcements" using <code>startAfter()</code>.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- 6 CORE AUDIT QUESTIONS -->
  <h2 class="section-title">3. Detailed Analysis of the 6 Core Audit Inquiries</h2>

  <h3 class="subsection-title">1. Which tables already use proper Firestore-side pagination?</h3>
  <ul>
    <li><strong>Admin Dashboard Activity Stream (<code>AdminDashboard.jsx</code>):</strong> Correctly uses <code>query(collection(firestore, 'admin-logs'), orderBy('timestamp', 'desc'), limit(5))</code>. Limits reads to 5 rows directly at the database engine.</li>
    <li><strong>User Notifications Center (<code>NotificationContext.jsx</code>):</strong> Correctly uses <code>query(collection(firestore, 'notifications'), where('recipientUid', '==', user.uid), limit(50))</code>. Limits reads to 50 rows.</li>
  </ul>

  <h3 class="subsection-title">2. Which tables are doing frontend-only pagination?</h3>
  <p>
    <strong>20 out of 22 inspected views</strong> download the complete dataset into client memory and paginate using <code>.slice(start, start + pageSize)</code>. These include all primary management screens: Admin Clients, Admin Operators, Admin Franchise Applications, Admin Inquiries, Admin Qualifications, Admin Resources, Admin Services, Admin Tickets, Admin Templates, Admin Logs Modal, Operator Appointments, Operator Dashboard Services, Operator Inquiries, Operator Quotations, Operator Tickets, Operator Services, and the Client Services Marketplace.
  </p>

  <h3 class="subsection-title">3. Which tables use onSnapshot() and whether they subscribe to too many documents?</h3>
  <p>
    The most severe bandwidth vulnerabilities stem from <strong>unconstrained real-time subscriptions</strong>:
  </p>
  <ul>
    <li><code>OperatorProvider</code> in <code>fair-fly/src/context/OperatorContext.jsx</code>: Listens to raw collections (<code>appointments</code>, <code>activeServices</code>, <code>inquiries</code>, <code>quotations</code>, <code>tickets</code>) without a <code>where('branchUid', '==', operatorUid)</code> clause. A single branch operator receives <em>all data across all branches</em> in real-time.</li>
    <li><code>OperatorServiceProcedure.jsx</code>: Uses <code>OperatorProvider targetCollection="activeServices"</code>, downloading the <em>entire company's active services database</em> just to view 1 document.</li>
    <li><code>AdminLayout.jsx</code> and <code>OperatorLayout.jsx</code>: Subscribe to <code>users</code> (all operators and clients), <code>services</code>, <code>appointments</code>, and <code>tickets</code> just to calculate badge numbers, maintaining active persistent WebChannel streams for thousands of unnecessary documents.</li>
    <li><code>AdminDashboard.jsx</code> (Audit Logs Modal): Subscribes to <em>every admin action log ever recorded</em> without limit whenever the modal is opened.</li>
  </ul>

  <h3 class="subsection-title">4. Any Firestore Composite Indexes required?</h3>
  <p>
    When Firestore combines equality filters (<code>where</code>) with ordering (<code>orderBy</code>) and range cursors (<code>startAfter</code>), composite indexes are strictly mandatory. Since no <code>firestore.indexes.json</code> currently exists, the following composite indexes must be deployed:
  </p>

  <pre class="code-block">
// Target firestore.indexes.json additions:
{
  "indexes": [
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branchUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branchUid", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activeServices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "startedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "activeServices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "quotations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branchUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "inquiries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branchUid", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "operatorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "admin-logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "actionType", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}</pre>

  <h3 class="subsection-title">5. Any filtering/search requirements that conflict with proposed queries?</h3>
  <ul>
    <li><strong>Client-Side Substring Search Conflict:</strong> Existing search bars evaluate multi-field JavaScript substrings: <code>(item.name.toLowerCase().includes(q) || item.email.includes(q) || item.phone.includes(q))</code>. Firestore native queries cannot perform arbitrary multi-field partial substring searches across unread documents without reading them.</li>
    <li><strong>Conflict Resolution Strategy:</strong> 
      <ol>
        <li>For REST API tables (Clients, Resources, Tickets), transfer search handling to the backend endpoint with bounded Firestore retrieval and limit bounds.</li>
        <li>For Firestore real-time tables, apply equality status/branch filters and deterministic ordering in Firestore, and pair text searches with a dedicated search prefix or debounced server-side query with a 50-item hard limit safeguard.</li>
      </ol>
    </li>
    <li><strong>Global KPI Aggregations vs Page Size:</strong> AlertBars compute counts (e.g. <code>applications.filter(a =&gt; a.status === 'pending').length</code>). If only 8 docs are fetched, the counter would read 8 instead of the database total. 
      <br><strong>Solution:</strong> Use Firestore's lightweight <code>getCountFromServer()</code> aggregation queries, which calculate exact document counts on the server with negligible bandwidth and 1 read charge per 1,000 index items.</li>
  </ul>

  <h3 class="subsection-title">6. Any places where changing the query could affect existing functionality?</h3>
  <ul>
    <li><strong>Cursor Sliding on Real-Time Mutations:</strong> If a table uses real-time <code>onSnapshot</code> with <code>startAfter(lastDoc)</code>, a newly inserted document at the top of the collection could push boundaries and cause duplicate row displays on page 2. For static/administrative tables, moving from <code>onSnapshot</code> to paginated REST GET endpoints eliminates this instability.</li>
    <li><strong>Back-Page Navigation:</strong> Unlike SQL <code>OFFSET</code>, Firestore cursors are unidirectional. Navigating backwards requires maintaining a page cursor stack in React state: <code>pageSnapshots = [docPage1First, docPage2First, ...]</code>.</li>
  </ul>

  <div class="page-break"></div>

  <!-- IMPLEMENTATION PLAN -->
  <h2 class="section-title">4. Phased Implementation Plan & Migration Architecture</h2>
  <p>The refactoring will be executed across 5 logical phases, adhering to the <code>AGENTS.md</code> rule: <em>"Reads should use onSnapshot for real-time data, use query on snapshots to prevent unnecessary frontend filtering, make GET requests for data that doesn't require real-time data"</em>.</p>

  <div class="callout callout-info">
    <strong>Implementation Rules & Safety Guarantees:</strong>
    <ul>
      <li>No code refactoring will begin until this plan and audit matrix are approved.</li>
      <li>Each phase will be verified independently with zero breaking changes to existing UI components (<code>DataTable</code>, <code>Pagination</code>, <code>FilterChipGroup</code>).</li>
      <li>Page 1 will strictly request only the designated page size (5 to 10 documents).</li>
      <li>Loading, empty, error, and filtering states will be preserved verbatim.</li>
    </ul>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 12%;">Phase</th>
        <th style="width: 28%;">Scope & Target Files</th>
        <th style="width: 40%;">Technical Implementation Details</th>
        <th style="width: 20%;">Verification Criteria</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1: Critical Leak Fixes</strong></td>
        <td>
          • <code>OperatorServiceProcedure.jsx</code><br>
          • <code>AdminLayout.jsx</code><br>
          • <code>OperatorLayout.jsx</code><br>
          • <code>OperatorDetailPage.jsx</code>
        </td>
        <td>
          1. Replace <code>OperatorProvider</code> in <code>OperatorServiceProcedure.jsx</code> with direct single-doc listener: <code>onSnapshot(doc(firestore, 'activeServices', id))</code>.<br>
          2. Refactor navigation badge listeners in <code>AdminLayout</code> & <code>OperatorLayout</code> to use <code>getCountFromServer()</code> aggregation queries instead of streaming thousands of user & service docs.<br>
          3. Constrain <code>OperatorDetailPage</code> activeServices listener with <code>where('operatorId', '==', id)</code>.
        </td>
        <td>
          Detail page reads drop from entire collection to 1 doc. Layout streams 0 documents into memory.
        </td>
      </tr>
      <tr>
        <td><strong>Phase 2: Operator Portal Tables</strong></td>
        <td>
          • <code>OperatorAppointments.jsx</code><br>
          • <code>OperatorDashboard.jsx</code><br>
          • <code>OperatorQuotations.jsx</code><br>
          • <code>OperatorInquiryForms.jsx</code><br>
          • <code>OperatorContext.jsx</code>
        </td>
        <td>
          1. Upgrade <code>OperatorProvider</code> to accept query constraints (<code>operatorUid</code>, <code>pageSize</code>, <code>cursor</code>).<br>
          2. Refactor Operator tables to execute queries scoped by <code>where('branchUid', '==', user.uid)</code>, ordered deterministically by timestamp, with <code>limit(pageSize)</code>.<br>
          3. Implement cursor stack (<code>startAfter(lastVisibleDoc)</code>) for smooth page navigation.<br>
          4. Use <code>getCountFromServer()</code> for KPI chips and total page count calculation.
        </td>
        <td>
          Network inspection confirms Page 1 requests exactly 5 documents. Operator only receives own branch records.
        </td>
      </tr>
      <tr>
        <td><strong>Phase 3: Admin Portal Real-Time Tables</strong></td>
        <td>
          • <code>FranchiseContent.jsx</code><br>
          • <code>QualificationsContent.jsx</code><br>
          • <code>ServiceContent.jsx</code><br>
          • <code>AdminLogsModal.jsx</code><br>
          • <code>AdminWorkflowTemplates.jsx</code>
        </td>
        <td>
          1. Upgrade <code>AdminProvider</code> to support cursor pagination with <code>orderBy</code>, <code>limit(pageSize)</code>, and <code>startAfter(cursor)</code>.<br>
          2. Refactor <code>AdminLogsModal.jsx</code> to fetch logs in batches of 10 with cursor-based pagination instead of listening to all historical logs.<br>
          3. Deploy composite indexes in <code>firestore.indexes.json</code> for status + timestamp sorting.
        </td>
        <td>
          Admin tables read 8-10 documents per page. Modal loads instantly without memory spikes.
        </td>
      </tr>
      <tr>
        <td><strong>Phase 4: Backend REST API Pagination</strong></td>
        <td>
          • <code>fly-api/src/controllers/clientController.js</code><br>
          • <code>fly-api/src/controllers/resourceController.js</code><br>
          • <code>fly-api/src/controllers/ticketController.js</code><br>
          • <code>fair-fly/src/pages/Admin/AdminClients</code><br>
          • <code>fair-fly/src/pages/Admin/AdminResources</code><br>
          • <code>fair-fly/src/pages/Admin/AdminTickets</code>
        </td>
        <td>
          1. Add <code>page</code>, <code>limit</code>, and <code>search</code> parameters to <code>GET /api/clients</code>, <code>GET /api/resources</code>, and <code>GET /api/tickets</code>.<br>
          2. Implement query bounds and return <code>{ data, total, page, totalPages }</code>.<br>
          3. Remove duplicate <code>onSnapshot</code> listeners in <code>AdminTickets</code> and <code>OperatorTickets</code>.<br>
          4. Connect frontend <code>DataTable</code> and <code>Pagination</code> to server-driven pagination state.
        </td>
        <td>
          Backend response payloads shrink from entire databases to 8 records per HTTP call.
        </td>
      </tr>
      <tr>
        <td><strong>Phase 5: Client Store & Verification</strong></td>
        <td>
          • <code>ClientServicesMarketplace.jsx</code><br>
          • <code>AnnouncementsPage.jsx</code><br>
          • <code>firestore.indexes.json</code>
        </td>
        <td>
          1. Implement server-side batched retrieval (<code>limit: 6</code>) for Client Services Store with infinite scroll trigger.<br>
          2. Add <code>limit(10)</code> to <code>AnnouncementsPage</code> with "Load older announcements" cursor.<br>
          3. Conduct full automated performance & security regression testing.
        </td>
        <td>
          Total initial bundle transfer and Firestore document reads confirmed reduced by >90%.
        </td>
      </tr>
    </tbody>
  </table>

  <!-- SIGN-OFF FOOTER -->
  <div style="margin-top: 24px; padding-top: 12px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #64748b;">
    <div><strong>FairFly Core Engineering Group</strong> • Performance & Bandwidth Optimization Track</div>
    <div>Document Reference: <code>FF-PERF-AUDIT-2026-001</code> • Confidential</div>
  </div>

</body>
</html>
`;

fs.writeFileSync(TEMP_HTML_PATH, htmlContent, 'utf8');
console.log('Temporary HTML report written to:', TEMP_HTML_PATH);

try {
  const cmd = `"${EDGE_PATH}" --headless --disable-gpu --no-pdf-header-footer --run-all-compositor-stages-before-draw --print-to-pdf="${OUTPUT_PDF_PATH}" "${TEMP_HTML_PATH}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF successfully generated at:', OUTPUT_PDF_PATH);
} catch (error) {
  console.error('Error generating PDF report:', error);
} finally {
  if (fs.existsSync(TEMP_HTML_PATH)) {
    fs.unlinkSync(TEMP_HTML_PATH);
    console.log('Cleaned up temporary HTML file.');
  }
}
