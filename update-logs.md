# Update Logs

## [2026-08-01] Backend Service Routes `allowedFields` Middleware Update

### Files Modified
- `fly-api/src/routes/serviceRoutes.js`

### Summary of Changes
- Updated the `allowedFields` middleware list in `serviceRoutes.js` to include:
  - `requirements` (array of service requirements with optional link & file attachments)
  - `workflowIds` (array of attached workflow template IDs)
  - `id`, `name`, `price`, `processingTime`, `actions`, `status`
- Added support for `PUT /services/:id` alongside `PATCH /services/:id` so both update methods pass validation.

### Reason
- The frontend `ServiceForm` submits `requirements` and `workflowIds` arrays when creating or updating services. Previously, `allowedFields` rejected requests containing these fields with a `400 Bad Request` error.

### Breaking Changes
- None.



## [2026-08-01] Admin Action Audit Logs & Recent Activity Dashboard Component

### Files Modified
- `fly-api/src/middleware/adminLogger.js` *(new)*
- `fly-api/src/server.js`
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx`
- `fair-fly/src/pages/Admin/AdminDashboard/admin-dashboard.css`

### Summary of Changes

**1. Backend `adminLogger` Middleware (`fly-api`)**
- Created `adminLogger.js` middleware utilizing Express `res.on('finish')` event listener.
- Logs all successful (2xx status) mutating HTTP actions (`POST`, `PATCH`, `PUT`, `DELETE`) initiated by authenticated admins into the Firestore `admin-logs` collection.
- Records `adminUid`, `adminEmail`, `method`, `path`, `resourceType`, `resourceId`, `statusCode`, `actionType`, and ISO `timestamp`.
- Non-blocking fire-and-forget execution ensuring zero delay to client API responses.
- Registered globally in `server.js` before route mounting.

**2. Frontend Recent Activity Card & Modal (`fair-fly`)**
- Updated `AdminDashboard.jsx` to render a real-time "Recent Activity" card backed by a Firestore `onSnapshot` listener on `admin-logs` showing the 15 most recent operations.
- Added color-coded badges and icons per action type (`CREATE` = green, `UPDATE` = blue, `DELETE` = red).
- Implemented a "View All" modal supporting real-time search (by email, UID, path, or resource type), action filter chips, and pagination.
- Added an "Export Logs" feature to download current or filtered logs as a formatted `.txt` report file.
- Styled using glassmorphism design standards (`backdrop-filter: blur(12px)`), staggered entrance animations, and responsive layout scaling in `admin-dashboard.css`.

### Reason
- User requested admin activity auditing logged on successful API responses to Firestore (`admin-logs/`) and displayed on the Admin Dashboard with search, pagination, and export capabilities.

### Breaking Changes
- None.



## [2026-08-01] Workflow Page — AdminContext + fly-api + Edit Modal Fix

### Files Modified
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/index.jsx` *(new)*
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowForm.jsx`
- `fair-fly/src/App.jsx`

### Summary of Changes

**1. AdminProvider wrapper (`index.jsx`)**
- Created a thin wrapper (`index.jsx`) that wraps `AdminWorkflowTemplates` with `<AdminProvider targetCollection="workflowTemplates">`.
- Matches the exact pattern used by `AdminServices`, `AdminOperators`, `AdminFranchiseApps`, etc.
- Updated `App.jsx` import to point to `index.jsx`.

**2. `AdminWorkflowTemplates.jsx` — switched to AdminContext + fly-api**
- Replaced `workflowService.js` (direct Firestore) with:
  - **Reads**: `useAdminContext()` — live `onSnapshot` stream provided by the wrapper.
  - **Create / Update / Delete / Duplicate**: `ApiCaller` → `fly-api` endpoints:
    - `POST /api/workflow/templates` (create & duplicate)
    - `PATCH /api/workflow/templates/:id` (update)
    - `DELETE /api/workflow/templates/:id` (delete)
  - All mutations send `Authorization: Bearer <userToken>` via `useAuthContext`.
- Removed all `useState`+`useEffect` loading logic (now handled by context).
- All `useMemo` hooks remain before any early return (Rules of Hooks compliant).

**3. `WorkflowForm.jsx` — fix edit modal pre-population**
- **Root cause**: parent passed `initialData` prop, but component destructured `templateData` — they never matched, so all edit fields were empty.
- **Fix**: renamed prop from `templateData` to `initialData`; renamed `onClose` to `onCancel` to match the calling convention in the parent.
- Form fields now correctly initialize from `initialData?.name`, `initialData?.description`, `initialData?.type`, and `initialData?.steps`.

### Reason
- User reported workflow page was not using the fly-api for mutations, was not wrapped in AdminProvider, and the edit modal always opened empty.

### Breaking Changes
- None. The `workflowService.js` file is not deleted — it is still used by any other potential consumers (workflow instances, etc.). The workflow templates page simply no longer imports it.



## [2026-08-01] Enhanced Stat Cards & Page-Level AlertBars

### Files Modified
- `fair-fly/src/components/Admin/StatCards/StatCards.jsx`
- `fair-fly/src/components/Admin/StatCards/stat-cards.css`
- `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx`
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`

### Summary of Changes

**StatCards Component Redesign**
- Added `detail` prop — secondary descriptor label below the primary metric value.
- Added `badge` + `badgeType` props — small semantic pill (variants: `ok`, `warn`, `error`, `info`, `neutral`) showing contextual sub-metric (e.g. "3 Disabled", "2 Pending").
- Added `trend` prop — optional `{ label, direction: 'up'|'down'|'neutral' }` row separated by a top border, using `↑ / ↓ / —` characters. No SVG, no emoji.
- Replaced bare icon with a **soft icon bubble** (rounded square, color-tinted background matching `iconColor`).
- Added `stat-cards.css`: hover lift (`translateY(-2px)` + shadow), staggered entrance animations (4 cards delay by 0.05s increments), `prefers-reduced-motion` override.
- All sizing in `rem`; no expensive continuous animations.

**AdminLayout.jsx Data Extension**
- Extended existing `onSnapshot` calls on `services` and `users` to also count `disabledServices`, `disabledOperators`, `activeOperators`.
- Added new `onSnapshot` on `franchiseApplications` to track `pendingApps` count.
- Wired `badge`, `badgeType`, and `detail` props to all four `StatCards` instances with real Firestore-driven counts.

**Page AlertBars (5 pages)**
All messages are computed via `useMemo` from data already available through `useAdminContext()`:

| Page | Warning Condition | Success Condition |
|------|-------------------|-------------------|
| Services | Any `Disabled` services | All services `Active` |
| Operators | Any `Disabled` operators | All operators `Active` |
| Franchise Apps | `pending > 0` | All reviewed |
| Inquiry History | Any rejected | All approved |
| Workflows | Any template with 0 steps | All templates have steps |

### Reason
- User requested richer Stat Cards with insight-oriented details and contextual AlertBars on admin pages.

### Breaking Changes
- None. Existing `StatCards` usage without new props degrades gracefully (badge, trend, and detail are all optional).

## [2026-07-13] Syntax Fixes in App.jsx

### Files Modified
- [App.jsx](file:///c:/Users/Isaac/Downloads/Fair/FairFly/fair-fly/src/App.jsx)

### Summary of Changes
- Corrected invalid comments inside the `<Routes>` block in `App.jsx` from `{// User Routes *}` to `{/* User Routes */}`.
- Fixed an invalid function call error on `roleRoutes[userDetails.role](...)` by wrapping the conditional client/admin/operator routes and fallback `<Route>` inside a React fragment (`<>...</>`).
- Simplified the redirect logic in the conditional routes for authenticated users by directly navigating to their role path (`to={`/${userDetails.role}`}`).
- Added a redirect for the index path `/` to `/home` under the unauthenticated routes (`<Route index element={<Navigate to="/home" replace />} />`).
- Changed the fallback wildcard `*` route in unauthenticated routes to redirect to `/home` instead of `/` to prevent infinite redirect loops.

### Reason
- The previous routing logic had malformed comments that broke JSX parsing, and it was invoking the route mapping expression as if it were a function, causing a JSX compilation/runtime error.
- When users logged out, they were programmatically navigated to `/`. Since there was no defined handler for `/` under the unauthenticated layout and the wildcard `*` routed back to `/`, it created an infinite redirect loop, leaving the page blank or not loading `/home`.

### Breaking Changes
- None.

---

## [2026-07-13] Backend API Server (fly-api) Created

### Files Created
- `fly-api/package.json`
- `fly-api/.env`
- `fly-api/.gitignore`
- `fly-api/src/server.js`
- `fly-api/src/config/firebase.js`
- `fly-api/src/services/cacheService.js`
- `fly-api/src/services/rateLimitService.js`
- `fly-api/src/services/firebaseService.js`
- `fly-api/src/middleware/auth.js`
- `fly-api/src/middleware/rateLimiter.js`
- `fly-api/src/controllers/franchiseController.js`
- `fly-api/src/controllers/serviceController.js`
- `fly-api/src/controllers/operatorController.js`
- `fly-api/src/controllers/workflowController.js`
- `fly-api/src/controllers/chatController.js`
- `fly-api/src/routes/index.js` and domain-specific route files

### Summary of Changes
- Built a complete Node.js Express backend API with Firebase Admin SDK authentication.
- Implemented a custom sliding-window rate limiter class with background memory cleanup.
- Implemented an in-memory TTL cache service with automatic garbage collection.
- Auth middleware verifies Firebase ID tokens and enforces role-based access control (RBAC).
- Created modular controllers and routes for franchise applications, services, operators, workflows, and chat.

### Reason
- Centralize business logic on the server to enforce "Never Trust the Client" security principles.

### Breaking Changes
- None.

---

## [2026-07-13] Removed getMessages from Backend Chat API

### Files Modified
- `fly-api/src/controllers/chatController.js`
- `fly-api/src/routes/chatRoutes.js`

### Summary of Changes
- Removed the `getMessages` controller function and the `GET /api/chats/:id/messages` route from the backend.
- Message reading is now handled on the frontend via Firestore `onSnapshot` real-time subscriptions to the `chats/{id}/messages` subcollection.
- `createChatSession`, `getChatSession`, and `postMessage` remain on the backend for validated writes.

### Reason
- Real-time message listening via Firestore subscriptions provides instant updates with lower latency than polling a REST endpoint. Write operations stay on the backend for validation and security.

### Breaking Changes
- The `GET /api/chats/:id/messages` endpoint no longer exists. Frontend must use Firestore `onSnapshot` to read messages.

---

## [2026-08-01] Components Directory Reorganization

### Folders Reorganized
- `fair-fly/src/components/Admin` (formerly `AdminComponents`)
- `fair-fly/src/components/Operator` (formerly `OperatorComponents`)
- `fair-fly/src/components/Client` (formerly `ClientComponents`)
- `fair-fly/src/components/Shared` (contains `Chatbot`, `Footer`, `FranchiseApplicationForm`, `Navbar`, `Services`, `TeamChatModal`)
- `fair-fly/src/components/UI` (contains `AlertBar`, `FooterCard`, `Loading`, `ModalBase`, `ScrollToTop`, `SearchBar`, `ServiceCard`, `toast`)

### Files Modified
- `fair-fly/src/App.jsx`
- `fair-fly/src/main.jsx`
- `fair-fly/src/context/AuthContext.jsx`
- `fair-fly/src/components/Admin/AdminNavbar/AdminNavbar.jsx`
- `fair-fly/src/components/Operator/OperatorNavbar/OperatorNavbar.jsx`
- `fair-fly/src/components/Client/ClientNavbar/ClientNavbar.jsx`
- `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx`
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx`
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx`
- `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`
- `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx`
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx`
- `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx`
- `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx`
- `fair-fly/src/pages/Index/Index.jsx`
- `fair-fly/src/pages/Index/Landing/Landing.jsx`
- `fair-fly/src/pages/Index/Login/login.jsx`
- `fair-fly/src/pages/Index/Register/Register.jsx`

### Summary of Changes
- Reorganized the `./fair-fly/src/components` directory into five dedicated domain subdirectories: `Admin`, `Operator`, `Client`, `Shared`, and `UI`.
- Relocated `TeamChatModal` to `Shared` as it is utilized by both Admin and Operator components.
- Updated all relative and absolute component imports across all pages, context providers, components, and root entry files.

### Reason
- Improve codebase maintainability, readability, and modularity by categorizing components into structured domain and UI groups.

### Breaking Changes
- Component import paths have changed; any external file importing components directly from root `src/components/` must use the new `Admin`, `Operator`, `Client`, `Shared`, or `UI` paths.

---

## [2026-08-01] Workflow Step Simultaneous Link & File Attachments with Executable File Security

### Files Modified
- `fair-fly/src/components/Admin/Modals/WorkflowForm.jsx`
- `fly-api/src/controllers/workflowController.js`

### Summary of Changes
- **Dual Step Attachments**: Updated `WorkflowForm.jsx` (`WorkflowStepsModal`) so that each step can optionally have both a **Web Link** (`step.link: { url, title }`) AND a **Document File** (`step.file: { url, name }`) attached simultaneously.
- **Non-Executable Security Validation**: Enforced non-executable file restriction (`.pdf`, `.docx`, `.xlsx`, `.png`, etc.) on both frontend and backend (`workflowController.js`). Blocked executable extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.msi`, `.jar`, etc.) with security error feedback.
- **Visual Attachment Chips**: Rendered purple Web Link chips and orange Document File chips on step cards.

### Reason
- Fulfill user request for simultaneous Web Link and Document File attachments per workflow step, with non-executable file security enforcement.

### Breaking Changes
- None.
