# Update Logs

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

## [2026-08-01] UI Redesign, Rem-Based Sizing, & Table Pagination

### Files Created
- `fair-fly/src/components/UI/Pagination/Pagination.jsx`
- `fair-fly/src/components/UI/Pagination/pagination.css`

### Files Modified
- `fair-fly/src/index.css`
- `fair-fly/src/components/UI/ModalBase/base-modal.css`
- `fair-fly/src/components/UI/Loading/Loading.css`
- `fair-fly/src/components/UI/AlertBar/alert-bar.css`
- `fair-fly/src/pages/Admin/AdminLayout/admin-layout.css`
- `fair-fly/src/components/Admin/AdminNavbar/admin-navbar.css`
- `fair-fly/src/components/Admin/AdminSidebar/admin-sidebar.css`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` & `admin-operators.css`
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx` & `admin-franchise-apps.css`
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` & `admin-inquiry-history.css`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` & `admin-services.css`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx` & `admin-quick-links.css`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx` & `admin-workflow-templates.css`
- `fair-fly/src/pages/Operator/OperatorLayout/operator-layout.css`
- `fair-fly/src/components/Operator/OperatorNavbar/operator-navbar.css`
- `fair-fly/src/components/Operator/OperatorSidebar/operator-sidebar.css`
- `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx` & `operator-appointments.css`
- `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx` & `operator-history.css`
- `fair-fly/src/pages/Operator/OperatorWorkflows/OperatorWorkflows.jsx` & `operator-workflows.css`
- `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx` & `operator-inquiry-forms.css`
- `fair-fly/src/pages/Operator/OperatorQuickLinks/OperatorQuickLinks.jsx` & `operator-quick-links.css`
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` & `operator-dashboard.css`
- `fair-fly/src/components/Client/ClientNavbar/client-navbar.css`
- `fair-fly/src/pages/ClientSide/ClientDashboard/client-dashboard.css`
- `fair-fly/src/pages/Index/Landing/landing.css`

### Summary of Changes
- Established global design tokens, CSS variables, HSL colors, shadow tokens, glassmorphic backdrop filters, `.status-pill`, and keyframe micro-animations in `index.css`.
- Converted layout sizing across all pages, navigation bars, sidebars, cards, and tables to a `rem`-based scale (`1rem = 16px`), maintaining layout consistency up to mobile breakpoints (`48rem` / 768px).
- Built and integrated a reusable `Pagination` component across all data tables and card containers (Operators, Franchise Applications, Inquiry History, Services, Quick Links, Workflow Templates, Operator Appointments, History, Workflows, Inquiry Forms, Quick Links, and Dashboard) to eliminate lag when managing large record sets.
- Enhanced layout density with search inputs, interactive filter chips, status badges, avatar icons, and empty state indicators following `/design-taste-frontend` and `/frontend-design` design principles.

### Reason
- Fulfill user request for rem-based responsive UI redesign, non-generic modern visual aesthetics, and pagination controls for high-volume record tables.

### Breaking Changes
- None.

---

## [2026-08-01] Layout Fixes: Team Chat Portal & Layout Restoration

### Files Modified
- `fair-fly/src/components/Shared/TeamChatModal/TeamChatModal.jsx` & `team-chat-modal.css`
- `fair-fly/src/components/UI/ModalBase/BaseModal.jsx`
- `fair-fly/src/components/Admin/Modals/ModalWrapper.jsx`
- `fair-fly/src/pages/Admin/AdminLayout/admin-layout.css`
- `fair-fly/src/pages/Operator/OperatorLayout/operator-layout.css`
- `fair-fly/src/components/Admin/AdminSidebar/admin-sidebar.css`
- `fair-fly/src/components/Operator/OperatorSidebar/operator-sidebar.css`
- `fair-fly/src/index.css`

### Summary of Changes
- Converted `TeamChatModal.jsx`, `BaseModal.jsx`, and `ModalWrapper.jsx` to render modal overlays using React `createPortal(..., document.body)` so overlays escape sticky navbar `backdrop-filter` stacking contexts.
- Removed global `min-height: 100vh` from `.card` in `index.css` which was causing stat cards to stretch across the full viewport and push content off-screen.
- Restored `.sidebar` and `.op-sidebar` to `height: fit-content` with `position: sticky; top: 5.5rem;` so sidebars sit naturally next to page content without layout breakage.
- Added `2rem` (32px) side paddings and `max-width: 90rem` centering to `.dashboard-stats` (Admin) and `.op-layout-stats` (Operator) so stat cards have clean margins and align with content containers.

### Reason
- Fix stat card height stretching bug identified via browser subagent inspection and restore clean, proportional dashboard layout.

### Breaking Changes
- None.
