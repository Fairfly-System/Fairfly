# Update Logs

## [2026-09-27] Feature: Client Details Auto-Prefill Across Client Forms

### Overview
To streamline the client booking and inquiry experience, client-side modal forms now automatically prefill the client's Full Name, Contact Number, and Email Address from their authenticated profile (`userDetails` in Firestore and `user` in Firebase Auth). Previously, modal forms only checked `userDetails?.name`, which caused fields to remain empty for registered clients whose profile document stores their name under `fullName`, and phone numbers stored under various aliases (`phone`, `phoneNumber`, `contactNumber`, `cellphone`) were not consistently resolved. Furthermore, opening modals repeatedly did not resync fresh auth profile details.

### Key Changes
1. **Client Appointment Form (`ClientAppointmentForm.jsx`)**:
   - Initialized `clientName`, `clientEmail`, and `clientPhone` with fallback resolution covering `fullName`, `name`, `displayName`, and all phone fields (`phone`, `phoneNumber`, `contactNumber`, `cellphone`).
   - Extended `useEffect` to watch `[user, userDetails, isOpen]`, ensuring client details auto-populate whenever the appointment modal is opened.
2. **Client Inquiry / Quotation Modal (`ClientInquiryModal.jsx`)**:
   - Initialized form fields with comprehensive user details fallbacks for `clientName`, `contactPerson`, `cellphone`, `email`, `address`, and `telNo`.
   - Updated `useEffect` dependency array with `[isOpen, user, userDetails]` so re-opening the inquiry modal dynamically updates the inputs with the latest client profile data.
3. **Client Service Request Modal (`ClientServiceRequestModal.jsx`)**:
   - Updated `useState` initializers for `clientName`, `clientEmail`, and `clientPhone` with comprehensive field fallbacks.
   - Refactored `useEffect` to trigger on `[user, userDetails, isOpen]`, resolving `fullName` and all contact phone number variations.
4. **Franchise Application Form (`FranchiseApplicationForm.jsx`)**:
   - Connected `useAuthContext()` to access the authenticated client session.
   - Added `useEffect` listening to `[isOpen, user, userDetails]` to prefill `fullName`, `phoneNumber`, and `email` for logged-in clients when opening the application form, while retaining custom edits if previously entered.

---

## [2026-09-27] Feature: Operator Analytics Integration in Operator Detail Page & Dashboard Redirection

### Overview
Per user request, the operator-specific analytics suite formerly embedded within the Admin Analytics/Dashboard view has been migrated and integrated into the dedicated Operator Detail page (`/admin/operators/:id`). The Operator performance table remains on the main Admin Dashboard (`/admin`), but clicking an operator row or its "View" action now navigates directly to the comprehensive operator page. The Operator Detail page now displays the complete analytics experience alongside all existing account management functions.

### Key Changes
1. **Admin Dashboard Redirection (`AdminDashboard.jsx`)**:
   - Kept the Operator performance table on the main dashboard (`/admin`), presenting completed services count, total branch revenue, and open tickets.
   - Removed the single-operator scoped state filter that previously restricted the entire dashboard view.
   - Enhanced the Operator table rows and the "View" action button to navigate directly to `/admin/operators/${operator.id}`.
2. **Operator Detail Page Analytics Suite (`OperatorDetailPage.jsx`)**:
   - Replaced static/mock values with real-time analytics data fetched via `fetchAdminAnalytics` with scoped `operatorId: id` parameters.
   - Integrated time period controls (`Today`, `This week`, `This month`, `This year`, `Custom range` with from/to date pickers).
   - Added operator-scoped CSV report generation (`handleDownloadReport` via `buildAnalyticsCsv`).
   - Integrated 4 performance KPI cards: Total Revenue (PESO currency format), Completed Services, Active Services in fulfillment (real-time Firestore listener), and Open Support Tickets.
   - Added Recharts `LineChart` inside `ResponsiveContainer` to plot historical revenue trajectory for the operator.
   - Added a 2-column layout containing Report Summary indicators, Most Picked Services ranking, support tickets sorted by priority or recency with pagination, alongside the existing Account Profile, Service Qualification toggles, active orders, and administration action modals.
   - Fixed unimported `ApiCaller` by replacing it with standard `updateOperator` from `adminService.js`.
3. **Styling Enhancements (`operator-detail.css`)**:
   - Added styles for `.operator-analytics-controls-card`, `.operator-kpi-grid` (responsive grid), `.operator-chart-card`, `.operator-analytics-columns`, `.analytics-summary-grid`, `.service-ranking-list`, and `.priority-ticket-list`.

---

## [2026-09-26] Fix: Notification Tab Routing, Delete-on-Read Bandwidth Optimization & Appointment Role Scoping

### Overview
Addressed several notification routing, access control, and bandwidth efficiency issues:
1. **Notifications Appearing on Wrong Tabs**: Notifications targeting subroute tabs (such as `/operator/appointments`) were incorrectly inflating the dashboard counter due to overly broad prefix matching (`startsWith('/operator')`), and permissions prevented the operator appointments badge from syncing correctly.
2. **Notification Broadcast Bleed**: Client appointment bookings were notifying all Admins and falling back to all operators instead of being directed strictly to the selected branch operator.
3. **Appointment Leak Across Clients**: Client appointments were visible to all clients due to a role-checking bug where `req.user?.role` was evaluated instead of `req.userDetails?.role` in the backend controller.
4. **Operator Permission in Firestore Rules**: Operators were blocked from reading appointments in Firestore security rules (`isOperator()` was omitted from the read condition).
5. **Delete on Read & Tab-Click Cleanup**: To minimize database bandwidth and storage usage, notifications are now permanently deleted from Firestore when read (or marked all read) rather than retaining read documents. Navigating to or clicking any tab that has notifications automatically clears and deletes matching notifications.

### Key Changes
1. **Firestore Security Rules (`firestore.rules`, `deployRules.js`)**:
   - Added `match /announcements/{announcementId}` (`allow read: if isSignedIn(); allow write: if isAdmin();`), fixing `Missing or insufficient permissions` error when subscribing to head office announcements.
   - Added camelCase aliases `match /workflowTemplates/{templateId}` and `match /workflowInstances/{instanceId}` alongside snake_case matches.
   - Added `match /admin-logs/{logId}` (`allow read: if isAdmin(); allow write: if false;`).
   - Updated `match /appointments/{appointmentId}` to allow read for `isAdminOrOperator() || (isSignedIn() && resource.data.clientUid == request.auth.uid)`.
   - Verified `match /notifications/{notifId}` allows delete permissions for signed-in users.
   - Built and ran `deployRules.js` (`npm run deploy:rules`) using the service account credentials to release the security ruleset directly to the live Firebase Firestore database.
2. **Backend Appointment Controller & Notification Dispatching (`appointmentController.js`, `notificationService.js`)**:
   - `createAppointment`: Removed `notifyAdmins` spam on client appointment bookings. Configured `notifyBranch` with direct destination `/operator/appointments` and operator ID assignment (`operatorId: branchUid`).
   - `getAppointments`: Fixed role resolution to inspect `req.userDetails.role`. Applied strict query scoping: clients only retrieve appointments where `clientUid == req.user.uid`, operators only retrieve appointments where `branchUid == req.user.uid`.
   - `notifyBranch`: Removed fallback broadcast that dispatched alerts to all operators when a specific branch operator was not matched.
3. **Notification Deletion & Tab Clearing (`NotificationContext.jsx`, `NotificationBell.jsx`)**:
   - `markAsRead`: Calls `deleteDoc(docRef)` to permanently remove read notifications from Firestore.
   - `markAllAsRead`: Batches `batch.delete(docRef)` across all unread notifications.
   - `clearNotificationsForTab`: Deletes all unread notifications associated with a tab route or type. Leverages `notificationsRef` for stable callback references.
   - `NotificationBell.jsx`: Clicking any notification item unconditionally deletes the notification record from Firestore.
4. **Navigation & Tab Badge Integration (`AppSidebar.jsx`, `AppNavbar.jsx`, `OperatorLayout.jsx`, `OperatorAppointments.jsx`, `ClientAppointmentsPage.jsx`)**:
   - `AppSidebar.jsx`: Fixed root portal link matching so dashboard (`/operator`) does not swallow subroute notifications. Added `clearNotificationsForTab(link.to)` to the sidebar link `onClick` handler.
   - `AppNavbar.jsx`: Added `clearNotificationsForTab` calls when client navigation links are clicked.
   - `OperatorLayout.jsx`: Scoped real-time pending appointment snapshot listener to the logged-in operator's branch.
   - `OperatorAppointments.jsx`: Scoped appointment filtering by operator branch and triggers tab notification cleanup on mount. Fixed `useEffect` import.
   - `ClientAppointmentsPage.jsx`: Scoped queries with `{ clientUid: user?.uid }` and triggers tab notification cleanup on mount.

---

## [2026-09-26] Feature: Domain-Specific Entity ID Prefixes & Comprehensive Auth / Firestore Database Migration

### Overview
Revamped entity ID generation and storage across the Fairfly ecosystem. Previously, random raw 20-character Firestore Auto-IDs were assigned to documents and users without domain context. We introduced a centralized prefixing architecture (`idGenerator.js`) and migrated all existing Firestore documents and Firebase Auth accounts to domain-prefixed UIDs (e.g. `USR-CLT-`, `USR-OPR-`, `USR-ADM-`, `USR-SUA-`, `INQ-`, `QTN-`, `SVC-`, `CAT-`, `WFL-`, `TKT-`, `APT-`, `CNV-`, `MSG-`, `RES-`, `ANN-`, `QAP-`, `FRA-`, `NTF-`, `FAQ-`, `LOG-`). All foreign key relationships and participant arrays across the entire database were systematically updated to maintain complete referential integrity.

### Key Changes
1. **Centralized ID Generator (`idGenerator.js`)**:
   - Defined canonical `ID_PREFIXES` covering all domain entities.
   - Implemented `generatePrefixedId(prefix)`, `parsePrefix(id)`, `getRawId(id)`, and `hasPrefix(id, prefix)` utility functions.
2. **Database Service (`firebaseService.js`)**:
   - Enhanced `addToDatabase(collectionName, data, prefix)` to generate prefixed document IDs natively while retaining Firestore Auto-ID entropy.
3. **Backend Controllers & Services**:
   - Updated `adminController.js`, `operatorController.js`, and `verificationService.js` to create Firebase Auth users and corresponding Firestore user documents with synchronized, role-specific prefixes (`USR-ADM-`, `USR-OPR-`, `USR-CLT-`).
   - Integrated prefixes across `inquiryController.js` (`INQ-`), `quotationController.js` (`QTN-`), `activeServiceController.js` (`SVC-`), `serviceController.js` (`CAT-`, `QLK-`), `workflowController.js` (`WFL-`, `WFI-`), `ticketController.js` (`TKT-`), `appointmentController.js` (`APT-`), `chatController.js` (`CNV-`, `MSG-`, `ANN-`), `chatbotController.js` (`FAQ-`), `qualificationController.js` (`QAP-`), `franchiseController.js` (`FRA-`), `notificationService.js` (`NTF-`), and `adminLogger.js` (`LOG-`).
4. **UI Refinements for Prefixed IDs**:
   - Updated `CreateTicketModal.jsx`, `TicketTable.jsx`, `AdminDashboard.jsx`, and `AdminLogsModal.jsx` to prevent premature truncation or 8-character slicing of IDs, ensuring prefixed IDs are cleanly rendered with meaningful characters.
5. **Database Migration Script (`migratePrefixes.js`)**:
   - Successfully executed migration across the entire live database:
     - 44 Firebase Auth user accounts migrated to prefixed UIDs with SCRYPT password hashes and user metadata strictly preserved.
     - 40 Firestore user documents migrated with all role and profile data preserved.
     - 7 Services, 6 Workflow Templates, 6 Quick Links, 5 Support Tickets, 7 Appointments, 1 Resource, 15 Conversations & Messages subcollections, 2 Announcements, 1 Qualification Application, 2 Franchise Applications, 1 Active Service, 167 Notifications, and 5 Chatbot FAQs migrated.
     - All cross-references and foreign keys (`clientUid`, `operatorId`, `branchUid`, `userId`, `uploadedByUid`, `authorUid`, `participants`, `unreadCount`, `serviceId`, `workflowIds`, etc.) updated with 100% referential integrity.

---

## [2026-09-26] Bug Fix: Operator Service Fulfillment Scoping, Quotation Acceptance Active Service Preservation, and Data Wipe

### Overview
Fixed critical issues where:
1. When an operator or client accepted a quotation, the operator's active procedures list on the dashboard suddenly only displayed that single quotation while all other services vanished.
2. Active service fulfillment was previously shared across all operators when an operator had 0 assigned services due to an improper fallback check (`if (assigned.length > 0) list = assigned`), allowing unassigned or foreign services to bleed into an operator's dashboard view.
3. Quotations, inquiries, and service fulfillments were wiped clean across Firestore per request to allow fresh end-to-end testing with strict operator assignments.

### Key Changes
1. **Operator Dashboard Scoping (`OperatorDashboard.jsx`)**:
   - Replaced conditional `if (assigned.length > 0) list = assigned` fallback with strict, non-leaking operator scoping: `operatorScopedServices = dbServices.filter(s => s.operatorId === user.uid || s.branchUid === user.uid)`. Operators now strictly and exclusively view service fulfillments assigned to their branch.
   - Updated priority chip counters (`All`, `High Priority`, `Normal Priority`) to compute against `operatorScopedServices` rather than `dbServices`, preventing discrepancies where chips counted services belonging to other operators.
2. **Operator Layout Metrics (`OperatorLayout.jsx`)**:
   - Removed `userHasScoped` check that leaked total global counts to operators who had no assigned services. Active and completed metrics badges in the operator sidebar now strictly reflect records where `operatorId === user.uid || branchUid === user.uid`.
3. **Operator Service Procedure Access Control (`OperatorServiceProcedure.jsx`)**:
   - Added an authorization guard (`isUnauthorized`) to prevent operators from viewing or executing procedure steps for services assigned to another operator. Displays a secure "Access Restricted" view.
4. **Operator Quotations & Inquiries Scoping (`OperatorQuotations.jsx`, `OperatorInquiryForms.jsx`)**:
   - Scoped quotation lists and inquiry form lists to the authenticated operator's UID (`branchUid === user.uid || operatorId === user.uid`).
   - Updated filter chip badges to reflect operator-specific counts.
5. **Backend Quotation & Inquiry Controllers (`quotationController.js`, `inquiryController.js`, `activeServiceController.js`)**:
   - In `acceptQuotation`: Strictly resolves `assignedOperatorId` and `assignedBranchName` from the quotation, originating inquiry, or accepting operator. Reuses existing `activeServiceId` if present instead of creating an orphaned duplicate service fulfillment.
   - In `createQuotation`: Ensures `branchUid`, `branchName`, and `operatorId` inherit from linked inquiries or the logged-in operator.
   - In `createInquiry`: Fixed bug where client's UID was previously assigned to `effectiveBranchUid` and `operatorId`. Intake forms now preserve selected `branchUid` and assign operator ID appropriately.
   - In `getActiveServices`, `getQuotations`, and `getInquiries`: Added server-side role filters restricting operator queries strictly to `operatorId === req.user.uid` or `branchUid === req.user.uid`.
   - In `updateStepStatus` and `cancelActiveService`: Enforced server-side operator ownership verification (403 Forbidden if not assigned).
6. **Firestore Security Rules (`firestore.rules`)**:
   - Added `match /activeServices/{activeId}` matching `active_services` so security rules explicitly cover the camelCase collection name.
7. **Database Clean Purge**:
   - Successfully deleted all documents from `activeServices`, `active_services`, `quotations`, `quotation_requests`, and `inquiries` in Firestore.

---

## [2026-09-25] Enhancement: Defer Government ID Upload until "Create Account" Clicked

### Overview
Updated the Client Registration and ID Re-upload forms so that attaching government ID files (Front and Back) does not prematurely upload files to the server or database upon file selection. Instead, selecting files creates local object URL previews for instant client-side inspection. Network uploads to `/api/upload` (`client_ids`) are triggered strictly on-demand only when the user clicks the "Create Account" (or "Submit ID for Admin Review") button.

### Key Changes
1. **ValidIdUpload (`ValidIdUpload.jsx`, `valid-id-upload.css`)**:
   - Removed immediate backend upload API calls upon file selection in `handleFileSelected`.
   - Generates client-side preview blob URLs (`URL.createObjectURL(file)`) with instantaneous local thumbnail rendering, size calculations, and high-resolution lightbox inspection.
   - Cleans up and revokes previous object URLs when removing or replacing files.
   - Added disabled styles and state handling for submission locking.
2. **Register Page (`Register.jsx`)**:
   - Updated form submit guard to recognize local attached file objects.
   - Enhanced `handleSubmit` to asynchronously upload Front and Back ID files to `/api/upload` only upon clicking "Create Account".
   - Displays dynamic loading indicator ("Uploading ID & Creating Account...") on the submit button.
   - Added unmount cleanup effect to revoke allocated blob URLs from browser memory.
3. **Re-upload ID Page (`ReuploadId.jsx`)**:
   - Applied identical deferred upload pattern: Front and Back files are validated locally upon selection and only uploaded to the server when "Submit ID for Admin Review" is clicked.
   - Revokes object URLs on unmount and removal.

---

## [2026-09-25] Fix: Client Table Filter Chips, Bulk Actions Standard Layout & Service Workflows Real-Time Listing

### Overview
Addressed user-reported issues across the Client Management and Service Workflow modules:
1. **Client Table Filter Chips & Standard Component Layout**: Fixed the filter chips in `ClientsContent.jsx` which were not switching filters. Standardized the Client table layout using the shared `DataTable`, `Pagination`, `table-toolbar`, and `search-box` components matching the Operators and Workflows tables.
2. **Client Bulk Operations**: Added bulk selection checkboxes, multi-row selection state, and bulk action buttons (`onBulkEnable`, `onBulkDisable`, `onBulkDelete`) with confirmation dialogs. Implemented matching backend endpoints `PATCH /api/clients/bulk-status` and `POST /api/clients/bulk-delete` in `clientController.js` and `clientRoutes.js` with Firebase Auth and Firestore cascade synchronization.
3. **Service Workflows Listing & Real-Time Attachment**: Fixed the bug where workflows were not listed when adding/attaching workflows to a service. Added `/api/workflows` route aliases in `workflowRoutes.js`, upgraded `ServiceWorkflowsModal.jsx` with real-time Firestore sync (`onSnapshot`) and an in-modal "+ New Workflow" creation flow. Upgraded `ServiceDetailPage.jsx` and `OperatorServiceDetailPage.jsx` to resolve and render all attached workflows, stage checklists, file attachments, and updated KPI counters.

### Key Changes
1. **FilterChipGroup & Clients Filter Chips (`FilterChipGroup.jsx`, `ClientsContent.jsx`)**:
   - Enhanced `FilterChipGroup` to seamlessly accept `activeFilter` and `onFilterChange` aliases in addition to `activeChip` / `onChipChange`.
   - Updated `ClientsContent.jsx` to bind `activeChip={statusFilter}` and `onChipChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}`.
2. **Client Table Layout & Bulk Actions (`ClientsContent.jsx`, `admin-clients.css`, `clientController.js`, `clientRoutes.js`, `adminService.js`)**:
   - Aligned table container structure to `.card.clients-table-card`, `.table-toolbar`, and `.search-box`.
   - Enabled `selectable={true}` on `DataTable` with `selectedIds`, `onSelectionChange`, `onBulkEnable`, `onBulkDisable`, and `onBulkDelete`.
   - Added confirmation modals for bulk activating, disabling, and permanently deleting selected accounts.
   - Built `bulkStatusClients` (`PATCH /api/clients/bulk-status`) to bulk toggle client status in Firestore.
   - Built `bulkDeleteClients` (`POST /api/clients/bulk-delete`) to bulk purge accounts from Firebase Auth and Firestore.
3. **Workflow Route Aliases & Workflow Service (`workflowRoutes.js`, `workflowService.js`)**:
   - Added direct route aliases `/` (GET, POST, bulk-delete) and `/:id` (GET, PUT, PATCH, DELETE) to `workflowRoutes.js` so client calls to `/api/workflows` resolve properly.
4. **Service Workflows Modal Real-Time Sync & In-Modal Creation (`ServiceWorkflowsModal.jsx`)**:
   - Subscribed to `onSnapshot(collection(firestore, 'workflowTemplates'))` with API fallback for instantaneous real-time workflow discovery.
   - Integrated `WorkflowModal` directly into `ServiceWorkflowsModal`, allowing administrators to create a brand-new workflow template on the fly and have it automatically attached.
5. **Service Detail Workflows Resolution & Presentation (`ServiceDetailPage.jsx`, `OperatorServiceDetailPage.jsx`, `service-detail.css`)**:
   - Resolved `service.workflowIds` against `workflowTemplates` via real-time Firestore listener.
   - Replaced empty `service.steps` display with individual attached workflow cards featuring name, service type badge, step count, full checklist steps, third-party links, and document attachments.
   - Updated the KPI card from 0 stages to reflect total attached workflows and aggregated steps.
   - Removed the misplaced "Perform Service SOP" callout banner from `OperatorServiceDetailPage.jsx` since execution procedures belong exclusively to active client transaction orders on the Operator Dashboard.

---


## [2026-09-25] Feature: Client Government ID Verification, Admin Review Tabs, Approval/Rejection Flow, and Anti-Spam Protection

### Overview
Implemented a client registration verification and anti-spam system to protect the platform from bot and spam account creation. Client registration now mandates selecting an official Philippine government ID type and uploading dual high-resolution scans/photos (Front and Back side) alongside an information modal detailing acceptable documents. Accounts remain in a pending state until vetted by an administrator. Administrators can inspect front and back IDs via a dedicated "Identity Verification" tab in the Client Detail Record with high-resolution lightbox inspection, approve accounts (with automated welcome email), reject submissions with customized feedback (with automated email containing a secure re-upload link), or permanently purge spam accounts from both Firebase Auth and Firestore.

### Key Changes

1. **Client Registration & Valid ID Upload (`ValidIdUpload.jsx`, `ValidIdInfoModal.jsx`, `Register.jsx`)**:
   - Built reusable `ValidIdUpload` component with ID type selector (16 accepted Philippine government IDs), info modal button, and dual dropzones for front and back images with real-time preview thumbnails, file validation (JPG/PNG/WEBP/PDF, <=10MB), and removal controls.
   - Built `ValidIdInfoModal` displaying accepted Primary (Passport, UMID, Driver's License, PhilID National ID, PRC ID, SSS ID) and Secondary IDs, plus compliance guidelines (clear lighting, all 4 corners visible, unexpired).
   - Integrated validation into `Register.jsx` to mandate `idType` and `idFrontUrl` (and optional/recommended `idBackUrl`) prior to submission.
   - Adjusted `VerifyEmail.jsx` so email verification leads to an "Application Under Review" confirmation screen rather than premature direct login.

2. **Pending Client Login Guard (`login.jsx`)**:
   - If a client with `status === 'Pending'` attempts to log in, Firebase Auth immediately signs out, navigation is aborted, and a persistent informative Toast notification is displayed informing the user that their account registration is under administrator review and an email will be sent upon approval.

3. **Admin Client Management & KPI Metrics (`ClientsContent.jsx`, `admin-clients.css`)**:
   - Added a 4th KPI summary card "Pending Verification" with amber badge indicators for accounts awaiting review.
   - Added a "Pending Approval" filter chip filter with real-time count badges.
   - Enhanced the table Status column to display amber `Pending Review` pills with clock icons and rose `Rejected` pills.
   - Added warning banner in `alertBarProps` highlighting when pending ID verifications require attention.
   - Quick action link directly routes to the new verification tab with amber highlight.

4. **Client Detail Record "Identity Verification" Tab & Lightbox (`ClientDetailPage.jsx`, `IdPreviewModal.jsx`, `RejectClientModal.jsx`)**:
   - Added tab switcher between "Account Overview" and "Identity Verification".
   - If client is `Pending`, defaults directly to the "Identity Verification" tab on page load.
   - Side-by-side front and back ID display cards with full-width preview frame, hover zoom overlay, "Inspect Full Size" button, and "Open Original" link.
   - Built `IdPreviewModal` providing a high-resolution darkroom lightbox view of either side.
   - Built `RejectClientModal` with preset feedback suggestions ("Blurry or unreadable photo", "Document is expired", "Name does not match account", etc.) and custom feedback textarea.
   - Added top header actions and in-page decision action panel:
     - **Approve Account**: Marks account as `Active` / `Approved` and triggers automated approval email to client.
     - **Reject Application**: Marks account as `Rejected`, creates `reuploadToken`, and emails client with rejection reason and secure reupload link.
     - **Delete Spam**: Permanently deletes the client account from both Firebase Auth and Firestore database.

5. **Client ID Resubmission Portal (`ReuploadId.jsx`, `reupload-id.css`, `App.jsx`)**:
   - Created `/reupload-id` route and page allowing rejected applicants to enter the email link token, inspect admin feedback, select and re-upload corrected front/back ID images, and resubmit for review.
   - Resubmission transitions the account back to `Pending` and dispatches a high-priority in-app notification to administrators.

6. **Backend Verification & Email Dispatch Pipeline (`fly-api`)**:
   - `emailService.js`: Added branded HTML templates and sender functions `sendAccountApprovedEmail` and `sendAccountRejectedEmail` with secure deep links and graceful dev fallback.
   - `verificationService.js`: Added `idType`, `idFrontUrl`, `idBackUrl` validation in `createPendingRegistration`, and `notifyAdmins` notification on client submission.
   - `clientController.js`: Added `approveClient` (with email + in-app notification) and `rejectClient` (with secure token generation, email with reupload URL, and in-app notification). Verified `deleteClient` purges both Firebase Auth and Firestore.
   - `authController.js` & `authRoutes.js`: Added `POST /api/auth/reupload-id` endpoint with secure token verification, status reset to `Pending`, and admin in-app notification.

### Verification
- Executed `npm run build` in `fair-fly`, passing cleanly with 0 compilation errors.
- Verified backend server running with nodemon on port 5001 with Firebase Admin SDK successfully connected.
- Tested component rendering, modal states, tab switching, and auth status checks.

---


## [2026-09-23] Feature: Client Preferred Branch Debounced Search & System-Wide Real-Time In-App Notifications

### Overview
Addressed the issue where the "Preferred Processing Branch" field in the Client Inquiry Modal (`ClientInquiryModal.jsx`, Form `SAF-01-002`) displayed no options by building a reusable debounced searchable branch selection component (`BranchSelectSearch`). Additionally, implemented comprehensive, system-wide real-time in-app notifications across all core workflows—including Client Inquiry intake, Quotations, Active Service requests & step progress, Appointments, Support Tickets, Qualifications, Franchise applications, and Service Catalog publishing.

### Key Changes

1. **Client Preferred Branch Debounced Search (`BranchSelectSearch.jsx`, `branch-select-search.css`)**:
   - **Root Cause Resolution**: The branch API `/api/operators/branches` returned `branchName` and `address` fields, but `ClientInquiryModal.jsx` expected `branch.name`, causing the HTML `<select>` to render empty blank options. Added dual alias support (`name` / `branchName`, `address` / `location`) in `fly-api/src/controllers/operatorController.js` and added Firestore fallback loading.
   - **Reusable Component**: Built `BranchSelectSearch` conforming to `.agents/rules/style-guide-components.md` and `AGENTS.md` (reusable components for repeated UI elements):
     - 300ms query debouncing with instant input responsiveness.
     - Clear button (`xmark`) to quickly reset filters.
     - Active selection badge with branch name, address, and quick "Change" action.
     - Empty states with helpful suggestions and loading spinner.
     - Keyboard accessibility and click-outside dropdown closure.
   - **Integration in Client Intake Modal (`ClientInquiryModal.jsx`)**:
     - Replaced native `<select>` with `<BranchSelectSearch />`.
     - Preserved form validity and updated submit payload to cleanly fallback between `branchName` and `name`.

2. **Backend Real-Time Notification Pipeline (`fly-api/src/services/notificationService.js`)**:
   - Added `notifyBranch({ branchUid, branchName, title, message, type, link, metadata })`:
     - Dispatches notification directly to `recipientUid: branchUid` (where branch UID equals the operator account ID).
     - Simultaneously queries matching operators by `branchName` to ensure all operators for that branch receive the update without duplicates.
     - Safely falls back to `notifyAllOperators` if no specific branch operator is resolved.

3. **System-Wide Workflow Notifications (`fly-api/src/controllers/`)**:
   - **Client Inquiries (`inquiryController.js`)**:
     - `createInquiry`: Notifies the assigned Branch Operator (`notifyBranch`), Admins (`notifyAdmins`), and Client (`createNotification` receipt).
     - `confirmInquiry`: Notifies Client with direct quotation reference (`/client/tracking`) and Admins upon operator confirmation.
   - **Quotations (`quotationController.js`)**:
     - `createQuotation`: Notifies Client of new quotation available with total fee summary.
     - `updateQuotationStatus`: Notifies Client when quotation is marked `'Sent'`; notifies Operator when marked `'Rejected'` or `'Cancelled'`.
     - `acceptQuotation`: Notifies Branch Operator and Admins of client acceptance; sends confirmation notification to Client.
   - **Active Services & Service Requests (`activeServiceController.js`)**:
     - `createActiveService`: Notifies Branch Operator, Admins, and Client on service requests submitted via the marketplace modal.
     - `updateStepStatus`: Sends live step progress updates to Client as operators complete each milestone; notifies upon final fulfillment with corrected link (`/client/tracking`).
   - **Appointments (`appointmentController.js`)**:
     - `createAppointment`: Notifies Branch Operator via `notifyBranch`, Admins, and Client with appointment details.
     - `updateAppointmentStatus`: Notifies Admins when appointments are confirmed or cancelled.
   - **Support Tickets (`ticketController.js`)**:
     - `updateTicketStatus`: Notifies Operator when admin updates status to `'Ongoing'` or `'Closed'`.
     - `closeTicket`: Notifies Operator if closed by admin, or Admins if closed by operator.
   - **Qualification Requests (`qualificationController.js`)**:
     - `reviewQualificationApplication`: Notifies Operator upon approval (`Qualification Approved! 🎉`) or rejection with admin notes.
   - **Franchise Applications (`franchiseController.js`)**:
     - `updateApplicationStatus`: Notifies applicant if registered user on status changes.
   - **Service Catalog (`serviceController.js`)**:
     - `createService`: Notifies all operators when admin publishes a new catalog service; notifies admins when an operator creates a branch-exclusive service.

4. **Frontend Notification Dropdown Categories (`NotificationBell.jsx`)**:
   - Extended `getCategoryIcon` to map `'inquiry'`, `'quotation'`, and `'qualification'` types to dedicated FontAwesome icons (`fa-file-invoice`, `fa-file-circle-dollar`, `fa-award`).

5. **Verification**:
   - Verified frontend Vite build (`npm run build`) in `fair-fly`, passing with 0 errors.
   - Executed live test inquiry submission to `http://localhost:5001/api/inquiries` targeting Manila branch operator (`CIQvnx68jRM6SHU1BM7JeaFCzIv2`). Verified in Firestore that real-time notifications were created for both the branch operator and administrators, and cleaned up test records.

---

## [2026-09-23] Feature: Client Forgot Password Backend Implementation & Modern 50/50 Split Reset Page Redesign

### Overview
Implemented the secure backend for the Client Forgot Password feature in `fly-api` and overhauled the client-facing Password Reset page (`/forgot-password`, `/reset-password`) in `fair-fly`. The backend enforces role-specific handling: password reset links are generated and emailed strictly for accounts with `role === 'client'`. Privileged accounts (`admin` and `operator`) as well as unregistered email addresses are silently masked—returning a uniform `200 OK` generic response without dispatching emails, preventing account and role enumeration attacks. Also redesigned the Password Reset page to adopt the modern 50/50 split authentication layout matching `Login.jsx` and `Register.jsx`, resolving unapplied input styles and eliminating the insecure client-side Firebase Auth email dispatch.

### Key Changes

1. **Transactional Email Service (`fly-api/src/services/emailService.js`)**:
   - Added `generatePasswordResetEmailHtml`: responsive, branded HTML email template featuring FairFly header (`#5558E3`), recipient greeting, prominent "Reset My Password" CTA button, copyable fallback URL, 60-minute single-use validity notice, and security disclaimers.
   - Added `sendPasswordResetEmail`: transmits transactional password reset emails via Nodemailer with Gmail SMTP (with automatic fallback console logging for dev mode).

2. **Backend Password Reset Controller & Role Filtering (`fly-api/src/controllers/authController.js` & `authRoutes.js`)**:
   - Refactored `requestClientPasswordReset`:
     - Normalizes incoming email addresses (`trim().toLowerCase()`) and performs regex format validation.
     - Searches Firestore `users` collection. If no account exists, silently suppresses email dispatch and returns uniform `200 OK` (`GENERIC_RESET_SUCCESS_MESSAGE`).
     - If the account role is `admin`, `operator`, or any non-client privilege, silently logs suppression to internal server logs and returns the identical generic `200 OK` response with 0 emails dispatched.
     - If the account role is `client`, verifies Firebase Auth existence, generates an official reset link via `admin.auth().generatePasswordResetLink()`, sends the branded email, and returns `200 OK`.
   - Updated `authRoutes.js`: wrapped `/client-forgot-password`, `/forgot-password`, and `/reset-password` route aliases with `publicRateLimiter` and `allowedFields(['email'])`.

3. **Frontend 50/50 Split Password Reset Redesign (`ResetPassword.jsx` & `reset-password.css`)**:
   - Upgraded `ResetPassword.jsx` to the established 50/50 split authentication layout (`.auth-split-layout`, `.auth-side-showcase`, `.auth-side-form`) strictly adhering to `.agents/rules/style-guide-components.md`.
   - Left Panel: Inspiring Philippine travel showcase image, Fairfly system brand header, `Client Account Recovery` badge, security assurances, and 100% security KPI stats.
   - Right Panel: Clean flat SaaS form with styled `.auth-input-wrapper`, `Mail` icon, client portal notice card, and full-width `.auth-submit-btn`.
   - Success View: Displays email confirmation icon, highlighted target email pill (`.reset-target-email-pill`), instructions card, 60-second cooldown resend countdown timer (`Resend link in Xs`), and a return to sign in button.
   - Removed client-side `sendPasswordResetEmail(auth, email)` call to eliminate the security loophole of browser-initiated auth actions.

4. **Verification**:
   - Tested backend endpoints via PowerShell with client (`gp@gm.com`), admin (`admin@gmail.com`), operator (`manila@email.com`), and unregistered test emails:
     - Client email: generated reset link and successfully dispatched email via Gmail SMTP (`MessageId: <ef45d398-8c3c-e2ef-6204-420ec5a4cdb0@gmail.com>`).
     - Admin/Operator emails: returned `200 OK` with uniform message; suppressed email sending.
     - Unregistered email: returned `200 OK` with uniform message; suppressed email sending.
   - Tested frontend in browser subagent: verified initial form rendering, input styling, submission flow, transition to success screen, and 60s cooldown timer.
   - Verified Vite production build (`npm run build`) in `fair-fly`, passing in 7.03s with 0 errors.

---

## [2026-09-21] Fix: Client Branch Appointments Cards Redesign & Client Inquiry Modal (`SAF-01-002`) Unapplied Styles Fix

### Overview
Addressed unapplied and deficient styling on the Client Side for both the Branch Appointments page (`/client/appointments`) and the Submit New Inquiry Modal (`ClientInquiryModal`, form `SAF-01-002`). In the Inquiry Modal, form inputs used an undefined `.input-base` class and the modal ignored the `size="large"` prop, causing a narrow 450px layout and raw browser inputs. Added responsive modal sizing in `BaseModal`, styled all `.input-base` controls to meet SaaS design standards, and redesigned the Branch Appointment cards with dedicated schedule blocks, branch badges, and anchored footers.

### Key Changes

1. **Responsive Modal Size Support (`BaseModal.jsx`)**:
   - Upgraded `BaseModal` with native support for the `size` prop (`'large'` -> 54rem max-width, `'xl'` -> 66rem, `'medium'` -> 40rem, `'small'` -> 28.125rem).
   - Explicitly configured `ClientInquiryModal` with `size="large"` (`maxWidth="54rem" width="94%"`), resolving narrow squished modal rendering.

2. **Client Submit New Inquiry Modal (`ClientInquiryModal.jsx` & `client-inquiry-modal.css`)**:
   - Implemented full flat SaaS CSS rules for `.input-base` (inputs, selects with custom dropdown chevrons, and textareas) with proper padding, border colors, hover highlights, and purple focus rings (`0 0 0 3px rgba(85, 88, 227, 0.12)`).
   - Standardized form action buttons using `.btn-secondary` and `.btn-primary.inquiry-modal-submit-btn` with disabled states and loading spinner support.
   - Refined section cards, category checkbox tiles, and intro callout banner with flat SaaS styling.

3. **Client Branch Appointments Cards (`ClientAppointmentsPage.jsx` & `client-appointments.css`)**:
   - Fixed broken FontAwesome icon (`fa-regular fa-calendar-day` replaced with valid `fa-solid fa-calendar-day`).
   - Redesigned `.appointment-card` with:
     - Header: Monospace appointment reference badge (`Ref #...`) and bordered status badge pill.
     - Service Title: Bold typography with service handshake icon.
     - Schedule Highlight Banner (`.appointment-schedule-banner`): Dedicated date and time-window block.
     - Details Box: Clean rows for assigned branch and client contact.
     - Purpose Notes: Structured callout box with clipboard icon and clamped text.
     - Card Footer: Anchored to bottom with `margin-top: auto;` for equal height card alignment across rows.
   - Fixed missing empty state styles by declaring `.appointments-empty-card` and `.appointments-empty-icon` directly in `client-appointments.css`.

4. **Verification**:
   - Tested Vite build (`npm run build`) in `fair-fly` — passed in 2.49s with exit code 0.

---

## [2026-09-21] Fix: Service Item Page (`/client/services/:id`) Equal-Height Layout & Price Block SaaS Styling Redesign

### Overview
Resolved layout height discrepancies and aesthetic issues on the Client Service Item Detail page (`/client/services/:id`). The left column (Cover/Gallery & Additional Details) and right column (Service Details & CTA) previously collapsed to unequal heights due to grid alignment settings. Additionally, the service price block exhibited non-standard diagonal gradient backgrounds and unformatted flex layouts that conflicted with our design standards. Synchronized column heights with flex stretch mechanics, anchored bottom action bars, added structured service specifications, and completely restyled the price block following the flat SaaS design principles outlined in `.agents/rules/style-guide-components.md`.

### Key Changes

1. **Equal-Height Two-Column Grid Alignment (`service-item-page.css`)**:
   - Switched `.service-ecommerce-grid` from `align-items: start;` to `align-items: stretch;`, ensuring both column cards expand equally within the grid row.
   - Set `height: 100%;` on both `.service-gallery-card` (left) and `.service-details-card` (right).
   - Added `margin-top: auto;` to `.service-additional-details` (left) and `.service-actions-cta-bar` (right) so bottom widgets anchor cleanly to the card base, maintaining visual balance regardless of description or requirement length.

2. **Left Column Structured Additional Details (`ServiceItemPage.jsx` & `service-item-page.css`)**:
   - Structured the left column with a clean `.service-additional-details` section containing a `.service-specs-table` with key operational specifications (Category, Processing Turnaround, Fulfillment Branch, and SLA).
   - Integrated `.service-trust-grid` seamlessly beneath specifications.
   - Refactored the branch exclusivity alert banner into dedicated CSS class `.service-branch-exclusive-banner`, removing all inline styles.
   - Updated the skeleton loader to accurately mirror the equal-height layout structure.

3. **Flat SaaS Service Price Block Redesign (`ServiceItemPage.jsx` & `service-item-page.css`)**:
   - Removed diagonal gradient background and loose spacing. Replaced with a crisp, flat card container (`var(--bg)`, 1px border `#E2E8F0`, rounded corners).
   - Added `.service-price-header` featuring an uppercase label (`SERVICE PROCESSING FEE`) and a subtle branded status badge (`Official Standard Rate`).
   - Styled high-contrast typography for the main price amount (`font-size: 2.25rem; font-weight: 800; color: #0F172A`) paired with a `/ application filing` unit suffix.
   - Added a subtle divider line and an inclusions callout (`.service-price-note`) with a green semantic check icon.

4. **Verification**:
   - Built the frontend via Vite (`npm run build`) in `fair-fly`, passing in 2.34s with exit code 0 and zero compilation errors.

---

## [2026-09-21] Feature: Secure 6-Digit Email Confirmation Registration Flow with Nodemailer Gmail SMTP, Anti-Brute Force Protection, and Custom Token Auto-Sign-In

### Overview
Implemented a secure, multi-step email confirmation flow for client account registration. Upon completing the registration form, users transition to a dedicated verification screen (`/verify-email`) where they enter a 6-digit numeric confirmation code delivered to their email. The system enforces strict security standards: server-side code generation, SHA-256 code hashing, 10-minute expiration windows, a 5-attempt brute-force limit with automatic invalidation, and 60-second resend cooldowns. Upon successful verification, the account is created in Firebase Auth and Firestore, and the user is automatically authenticated into the Client Portal using Firebase Custom Tokens.

### Key Changes

1. **Email Service & Gmail SMTP Integration (`fly-api/src/services/emailService.js` & `.env`)**:
   - Integrated `nodemailer` configured for Gmail SMTP (`smtp.gmail.com`, port 465, secure SSL).
   - Designed a responsive, official FairFly transactional HTML email template with indigo branding (`#5558E3`), clear greeting, prominent monospace 6-digit verification code box, security notes, and expiration notice.
   - Added zero-crash fallback logging to terminal (`[EMAIL SERVICE: NO SMTP CREDENTIALS IN .ENV — DEV LOGGING MODE]`) for local development and testing before Google App Passwords are configured.

2. **Cryptographic Verification Service (`fly-api/src/services/verificationService.js`)**:
   - `createPendingRegistration`: Validates full name, email, phone, and strong password. Performs pre-flight checks against Firebase Auth and Firestore `users` to prevent duplicate accounts. Generates unguessable 6-digit numeric codes using `crypto.randomInt` and saves their SHA-256 hashes to `pending_registrations` with a 10-minute expiration and 5-attempt budget.
   - `verifyRegistrationCode`: Enforces expiration checks, brute-force attempt countdowns, and lockout triggers. On successful hash match, creates the Firebase Auth user (`emailVerified: true`), creates the Firestore `users` document (`role: 'client'`), purges the pending record, and issues a Firebase Custom Token (`admin.auth().createCustomToken(uid)`).
   - `resendVerificationCode`: Enforces a 60-second cooldown timer between requests, generates a fresh code, updates the hash, and re-dispatches the email.

3. **Backend API Routes & Controllers (`fly-api/src/controllers/authController.js` & `authRoutes.js`)**:
   - Added rate-limited public endpoints: `POST /api/auth/register-initiate`, `POST /api/auth/register-verify`, and `POST /api/auth/register-resend` wrapped with `publicRateLimiter` and `allowedFields`.
   - Maintained `/api/auth/register` routing to `initiateRegistration` for backwards compatibility.

4. **Firestore Security Rules (`Fairfly/firestore.rules`)**:
   - Added `match /pending_registrations/{pendingId} { allow read, write: if false; }` to lock down all client access to pending registration documents. Only the backend Firebase Admin SDK can interact with this collection.

5. **Frontend 50/50 Verification Screen (`fair-fly/src/pages/Index/VerifyEmail/VerifyEmail.jsx` & `verify-email.css`)**:
   - Created a responsive 50/50 split authentication screen matching `Register.jsx` and `Login.jsx` strictly adhering to `.agents/rules/style-guide-components.md`.
   - Built a 6-box segmented OTP input with auto-focus, single-character advancing, backspace navigation, arrow key traversal, and full 6-character paste support.
   - Integrated live 10-minute expiration countdown timer (`MM:SS`) with expired-state locking and resend guidance.
   - Integrated 60-second resend cooldown timer with animated rotating indicator.
   - Provided remaining attempts feedback on invalid submissions and security lockout notices.
   - Automatically signs the client in using `signInWithCustomToken(auth, res.customToken)` on verification, navigating directly to `/client`.

6. **Frontend Routing & Registration Submission Updates (`fair-fly/src/App.jsx`, `Register.jsx`, & `authService.js`)**:
   - Updated `authService.js` with `initiateRegistration`, `verifyRegistrationCode`, and `resendRegistrationCode`.
   - Updated `Register.jsx` to call `initiateRegistration` and navigate to `/verify-email` with navigation state and `sessionStorage` fallback.
   - Mounted `/verify-email` and `/confirm-email` in `App.jsx` under the unauthenticated route tree.

---

## [2026-09-10] Redesign: Consistent Flat Light SaaS Landing Page, Instrument Serif Editorial Accents, Service Card De-cluttering & Service Details React Child Bug Fix

### Overview
Addressed explicit design requirements and runtime error fixes on the public landing page. Strictly adhered to a **consistent, flat light SaaS design**—eliminating all liquid glass, dark/blackish backgrounds, and translucent blur filters across all sections (Franchise, CTA Footer Card, Explore, Services). Resolved a fatal React child crash (`Objects are not valid as a React child (found: object with keys {required, name})`) in the Service Details modal and purged all dummy data arrays. Streamlined the service cards from over-cluttered 15-element widgets to crisp 16:9 photo cards with clean metadata and a single "View Details" action. Integrated Google Font `Instrument Serif` italic accents across section headers for high-end editorial flair.

### Key Changes

1. **Hero Section Background Image (`Landing.jsx` & `landing.css`)**:
   - Switched hero backdrop from ambient video to a high-resolution background image container (`.hero-bg-container`, `.hero-bg-img`).
   - Configured local target `/hero-bg.jpg` with a graceful high-res aviation/sky Unsplash fallback via `onError`.
   - Applied a soft atmospheric light gradient overlay (`.hero-bg-overlay`) that keeps the existing light color scheme (`#F8FAFC`, `--bg`), while ensuring high contrast and readability for all headlines, CTAs, and the trust strip.
   - File path for custom replacement: `Fairfly/fair-fly/public/hero-bg.jpg`.

2. **Fixed React Child Runtime Crash & Purged Dummy Data (`ServiceDetailModal.jsx`)**:
   - Resolved `Objects are not valid as a React child (found: object with keys {required, name})` when opening the service details modal.
   - Added `getRequirementName(req, idx)` helper to safely extract requirement label strings from Firestore objects (`req.name || req.title || req.label`).
   - Added `isRequirementMandatory(req)` to render clean status pills (`.service-req-pill.mandatory` / `.service-req-pill.optional`).
   - Purged all hardcoded dummy data arrays (removed fake 5-point inclusions and fake workflow steps), ensuring the modal presents only actual backend service data (`requirements`, `description`, `processingTime`, `price`, `tags`).
   - Redesigned modal dialog into a crisp, flat white card (`#FFFFFF`, `1px solid var(--border-color)`, `var(--shadow-lg)`) without liquid glass.

2. **De-cluttered Service Cards (`Services.jsx` & `services.css`)**:
   - Eliminated visual clutter: removed redundant icon box, hashtag rows, multi-branch pill tags, double button actions, and heavy overlay gradients.
   - Streamlined layout: clean 16:9 thumbnail photo with single category pill, clean title, 1-line metadata (`turnaround • docs required`), 2-line description clamp, and clean footer with starting price + single "View Details" button.
   - Replaced bouncy hover transforms with subtle border color transitions (`#94A3B8`) and slight photo scale (`1.025`).

3. **Consistent Flat Light Theme & Elimination of Blackish Sections (`franchise-section.css`, `footer-card.css`, `explore.css`)**:
   - `FranchiseSection`: Removed dark slate `#0F172A` background, glowing radials, and `backdrop-filter: blur(6px)` glass cards. Replaced with crisp white background (`#FFFFFF`), flat slate cards (`var(--bg): #F8FAFC`, border `#E2E8F0`), high-contrast text (`var(--text-dark)`), and flat orange accent buttons.
   - `FooterCard`: Converted from blackish `#0F172A` to a clean branded light card (`var(--purple-light-2)`, border `var(--purple-light)`), high-contrast text, and a solid purple CTA button.
   - `Explore`: Standardized container and grid borders with `--border-color` and `--radius-md`.
   - `Footer`: Clean white background with `--border-color` top border.

4. **Editorial Typography (`Instrument Serif`)**:
   - Imported `@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');` in `fair-fly/src/index.css`.
   - Defined `--font-serif: 'Instrument Serif', Georgia, serif;` in `:root`.
   - Applied italic serif styling (`font-family: var(--font-serif); font-style: italic; font-weight: 400;`) to heading brand accents across Hero (`.hero-heading-brand`), Business System (`.bs-title-accent`), Service Guidelines (`.sg-title-accent`), Business Model (`.bm-title-accent`), Training Academy (`.tc-title-accent`), Explore (`.explore-title-accent`), Franchise Section (`.fr-titleOrange`), and FooterCard (`.footer-title-accent`).

5. **Verification**:
   - Tested Vite production build (`npm run build`) which succeeded in 3.19s with exit code 0.
   - Executed browser subagent testing: verified clean visual rendering, checked all sections for light/flat consistency, tested modal opening/closing on service cards, and confirmed 0 console errors.

---

## [2026-09-10] Redesign: Landing Page AI-Slop Cleanup, E-Commerce/Airbnb Service Detail Modal, and 50/50 Split Authentication

### Overview
Executed a comprehensive aesthetic overhaul across the public-facing landing page and user onboarding journey. Eliminated all "AI-slop" design tropes—pulsing badges, neon gradient text, aggressive hover translations, and oversaturated glowing shadows—in favor of a refined, enterprise-grade travel SaaS layout. Introduced photo thumbnail cards on the landing page with automatic local and Unsplash fallbacks, paired with an Airbnb / E-commerce-style rich service detail modal (`ServiceDetailModal`) featuring full operational checklists, procedure timelines, and a sticky booking action card. Additionally transformed both Login and Register experiences into a modern 50/50 split-screen layout with an inspiring brand showcase on the left and a minimalist, accessible form on the right.

### Key Changes

1. **Landing Page AI-Slop Elimination (`fair-fly`)**:
   - `Landing.jsx` & `landing.css`:
     - Replaced multicolor neon gradient heading with clean, authoritative slate typography and single-accent brand emphasis (`.hero-heading`, `.hero-heading-brand`).
     - Removed animated pulsing status dot in favor of a steady, clean indicator (`.hero-badge-dot`).
     - Standardized hero CTA button styles (`.btn-hero-primary`, `.btn-hero-secondary`, `.btn-hero-outline`) with subtle single-light-source hover states.
     - Redesigned Metric Trust Strip with clean border demarcation and subtle background tints.
   - `franchise-section.css`:
     - Replaced 3-color purple-magenta gradient background and 28px orange glowing shadow with a modern slate container (`#0F172A`) with subtle radial lighting and clean `--shadow-md`.
   - `footer-card.css`:
     - Replaced purple gradient and 60px glowing shadow with a dark slate card (`#0F172A`) featuring subtle radial lighting and `--shadow-md`.
   - `service-guidelines.css` & `business-system.css`:
     - Removed `box-shadow: var(--shadow-purple)` and bouncy card hover `transform: translateY(-0.25rem)` across all sections.

2. **Airbnb / E-Commerce Style Service Detail Modal (`fair-fly`)**:
   - `ServiceDetailModal.jsx` & `service-detail-modal.css`:
     - Created a responsive two-column modal dialog:
       - **Left Column**: High-resolution hero media banner with category pills, verified operator badge, star rating, service overview, 5-point verification inclusions list, required documents checklist, and a 3-step operational procedure timeline.
       - **Right Column**: Sticky Airbnb-style booking widget with starting price breakdown, turnaround estimate, verified franchise operator badge, "Avail Service Now" CTA, and security guarantees.
     - Added full keyboard navigation (`Escape` dismissal), backdrop click closing, and body scroll locking.
   - `Services.jsx` & `services.css`:
     - Updated all default operator services with `image` paths (`/services/*.jpg`) and robust Unsplash fallback URLs (`onError` handler).
     - Upgraded service cards with 16:9 photo banners, quick view hints, mini icon headers, category tags, turnaround times, requirement counters, and dual actions ("Details" modal trigger + "Avail" direct booking navigation).

3. **Modern 50/50 Split Authentication Screens (`fair-fly`)**:
   - `Login/login.jsx` & `login.css`:
     - Transformed from a basic centered card into a modern 50/50 split screen (`.auth-split-layout`).
     - **Left Panel (50%)**: Atmospheric visual showcase featuring `/auth/login-hero.jpg` (with Unsplash fallback), dark overlay gradient, Fairfly brand badge, value proposition copy, and key trust statistics (ISO 9001:2000, 50+ Branches, 24/7 SLA).
     - **Right Panel (50%)**: Clean, accessible login form with "Back to Home" navigation, sleek input wrappers with icon prefixes, password toggle, URL query param service continuation banner, and terms/privacy modal triggers.
   - `Register/Register.jsx` & `register.css`:
     - Transformed into matching 50/50 split screen with `/auth/register-hero.jpg` (with Unsplash fallback), ecosystem benefits list, and clean registration inputs with client-side field validation.
   - Both pages collapse gracefully on mobile screens (< 960px) to provide a 100% full-width form layout with zero horizontal overflow.

---

## [2026-09-10] Redesign: Clean Modern SaaS Polish & Sidebar Tab Notification System with Real-Time Dynamic Badging

### Overview
Systematically redesigned the Fairfly web application to eliminate "AI-slop" aesthetic anti-patterns—removing heavy glowing drop shadows, pulsating status dots, bouncy hover transforms, and inline styles across layouts and components. Replaced them with a refined, professional SaaS aesthetic utilizing subtle single-light-source shadows, crisp borders, and clean status indicators. Additionally implemented a comprehensive Sidebar Tab Notification System that renders red notification badges displaying numeric unread counts (formatted as `9+` when exceeding 9) across Admin, Operator, and Client navigation tabs, fully integrated with real-time Firestore listeners and `NotificationContext`.

### Key Changes

1. **Global CSS Design System Tokens & Base Reset (`fair-fly/src/index.css`)**:
   - Replaced heavy colored drop shadows (`--shadow-purple`, `--purple-glow`, `--orange-glow`) with standardized, elevation tokens (`--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`).
   - Standardized modern slate canvas palette (`--bg: #F8FAFC`), crisp borders (`#E2E8F0`), and professional indigo/purple tokens (`--purple: #5558E3`, `--purple-dark: #4338CA`, `--purple-light-2: #EEF2FF`).
   - Removed distracting `pulseDot` CSS animation on `.status-pill::before` for steady, reliable status pills.
   - Removed aggressive hover shadow expansions on `.card` in favor of clean border highlights.
   - Replaced noisy glowing input focus rings with clean `0 0 0 3px rgba(85, 88, 227, 0.12)`.

2. **Sidebar Tab Notification System (`fair-fly`)**:
   - `AppSidebar.jsx`:
     - Integrated `useNotifications()` from `NotificationContext`.
     - Added `tabNotifications?: Record<string, number>` prop to `AppSidebar` and support for `notificationCount?: number`, `badge?: number | string`, or `notifications?: number` on `navLinks`.
     - Added automatic fallback mapping between navigation paths (`/notifications`, `/messages`, `/appointments`, `/tickets`) and unread categories from `NotificationContext`.
     - Rendered `<span className="sidebar-tab-badge">{count > 9 ? '9+' : count}</span>` for tabs with positive unread counts.
   - `app-sidebar.css`:
     - Removed jittery `transform: translateX(0.125rem)` hover and purple active tab box-shadow glow.
     - Added `.sidebar-tab-badge` with vibrant red background (`var(--error-red)`), white bold typography, tabular numerals, circular/pill geometry, and flex alignment.
     - Added `.sidebar-link-label` wrapper to guarantee clean spacing between tab labels and badges.
   - `AppLayout.jsx`:
     - Forwarded `tabNotifications` prop from caller layouts directly to `AppSidebar`.
   - `AdminLayout.jsx`:
     - Added real-time Firestore listener on `tickets` collection querying open tickets (`status == 'Open'`).
     - Passed `tabNotifications` to `AppLayout` mapping `/admin/franchise-apps` (pending applications count) and `/admin/tickets` (open tickets count).
   - `OperatorLayout.jsx`:
     - Added real-time Firestore listener on `tickets` collection querying open tickets (`status == 'Open'`).
     - Passed `tabNotifications` to `AppLayout` mapping `/operator/appointments` (pending actions count) and `/operator/tickets` (open tickets count).

3. **Top Navbar & Notification Bell (`fair-fly`)**:
   - `AppNavbar.jsx` & `app-navbar.css`:
     - Removed navbar drop shadow in favor of a crisp bottom border.
     - Replaced pill-shaped client navigation buttons with standard SaaS radius (`var(--radius-sm)`).
     - Added live red notification badges to Client navigation items for Tracking, Appointments, and Messages (both desktop and mobile drawer).
   - `NotificationBell.jsx` & `notification-bell.css`:
     - Removed glowing purple box-shadow and distracting badge pulse animation.
     - Flattened dropdown shadow to `var(--shadow-md)`.

4. **Component Modularization & Zero Inline Styles Enforcement (`fair-fly`)**:
   - `RecordDetailLayout.jsx` & `record-detail-layout.css`:
     - Extracted all inline styles from loading skeleton blocks and fallback avatar thumbnails into modular CSS classes (`.record-skeleton-back`, `.record-skeleton-avatar`, `.record-skeleton-card`, `.record-skeleton-grid`, etc.).
   - `OperatorDashboard.jsx` & `operator-dashboard.css`:
     - Extracted inline styles from Qualification Status banner into `.op-qualification-banner`, `.op-qualification-icon-bubble`, and `.op-qualification-pill`.
     - Cleaned up `.op-perform-procedure-btn` and `.op-message-lead-btn`, eliminating heavy gradients, bouncy transforms, and purple shadows.
   - `AdminDashboard.jsx` & `admin-dashboard.css`:
     - Replaced inline styles on activity skeleton placeholders and empty inbox icons with dedicated CSS classes (`.activity-skeleton-row`, `.activity-skeleton-bubble`, etc.).
   - `OperatorServiceProcedure.jsx` & `operator-service-procedure.css`:
     - Replaced inline styles on loading skeleton cards and not-found states with CSS classes.
     - Replaced green gradient and heavy shadow on `.swm-btn-complete` with standard SaaS styling.
     - Replaced cancel modal blur and 25px shadow with clean `var(--shadow-lg)`.
   - `admin-qualification-detail.css` & `announcements-page.css`:
     - Removed purple glow box shadows on hover cards and search inputs; standardized focus rings and avatar circles.

---


### Overview
Softened the system-wide "selection" colors across tables, checkboxes, bulk action bars, and multi-selection cards, replacing high-contrast opaque purple/blue highlights with subtle, translucent tints. Enhanced the Expanded Announcement Reader Modal in the Announcements feature: made the modal significantly wider for generous reading comfort and fixed the scroll architecture so that the modal window itself never scrolls, isolating scroll behavior strictly to the inner announcement content.

### Key Changes

1. **System-Wide Subtle Selection Styling (`fair-fly`)**:
   - `index.css`:
     - Introduced semantic selection design tokens in `:root`:
       - `--selection-bg: rgba(107, 111, 245, 0.045);`
       - `--selection-bg-hover: rgba(107, 111, 245, 0.075);`
       - `--selection-border: rgba(107, 111, 245, 0.18);`
       - `--selection-text: rgba(107, 111, 245, 0.16);`
     - Added global `::selection` and `::-moz-selection` rules using `--selection-text` to eliminate default browser neon/electric blue text highlights.
     - Set default `input[type="checkbox"], input[type="radio"]` accent color to `var(--purple-dark, #5558E3)`.
     - Standardized global table row selection (`tr.table-row-selected td`, `tr.selected td`) to subtle `--selection-bg` and hover to `--selection-bg-hover`.
   - `data-table.css`:
     - Softened `.table-bulk-bar-active` to use subtle `var(--selection-bg)` with refined border `var(--selection-border)`.
     - Updated `.count-badge-active` to a soft badge tint (`background: rgba(107, 111, 245, 0.12); color: var(--purple-dark, #5558E3)`).
     - Standardized `tr.table-row-selected td` to use `--selection-bg` and hover to `--selection-bg-hover`.
     - Changed selection checkboxes accent-color to `var(--purple-dark, #5558E3)`.
   - `admin-admins.css`:
     - Refined `.admin-operator-checkbox-card.selected` from opaque `var(--purple-light-2)` to `var(--selection-bg)` and hover to `var(--selection-bg-hover)`.
   - `ServiceWorkflowsModal.jsx`:
     - Replaced hard-coded `var(--purple-light-2)` selected background with `var(--selection-bg)`.
     - Standardized checkbox `accentColor` to `var(--purple-dark)`.

2. **Expanded Announcement Modal Width & Scroll Isolation (`fair-fly`)**:
   - `AnnouncementsPage.jsx`:
     - Widened the expanded reader modal from narrow `44rem` to generous `60rem` with `width="92%"`.
     - Added specialized class `announcements-reader-modal` to `BaseModal`.
   - `announcements-page.css`:
     - Isolated modal frame: locked `.base-modal-container.announcements-reader-modal` and its `.base-modal-body` to `overflow: hidden !important` with `max-height: 88vh`.
     - Replaced nested scroll container on `.fb-expanded-reader`: configured it as the sole scrollable element (`overflow-y: auto; flex: 1; min-height: 0; padding: 1.5rem 1.75rem`) with custom thin scrollbar styling.
     - Added mobile-responsive rules (`width: 95% !important; max-height: 92vh; padding: 1rem 1rem`) in `@media (max-width: 640px)`.
   - `BaseModal.jsx` & `base-modal.css`:
     - Added automatic body scroll locking (`document.body.style.overflow = 'hidden'`) using `useEffect` whenever `isOpen` is active, preventing the underlying page from scrolling while reading modals.
     - Added `overflow: hidden;` to `.base-modal-overlay`.

---

## [2026-09-08] Feature: Dedicated Announcements Page with Facebook-Style Post Feed, Multi-Photo Mosaic Grid, Fullscreen Lightbox, Reader Modal, and Storage Diffing

### Overview
Moved Head Office Announcements from a modal dialog (`AnnouncementsModal`) into a dedicated full page accessible to both Administrators (`/admin/announcements`) and Operators (`/operator/announcements`). Announcements are styled as Facebook-style post cards featuring official author badges, priority indicators, inline text expander ("... See more"), Facebook-style multi-photo mosaic grids (supporting 1 to 5 photos), a fullscreen lightbox viewer, and an expanded reader modal. Deleting announcements cleanly deletes all attached photos from Firebase Storage, and updating announcements uses storage URL diffing to remove replaced or deleted photos from Firebase Storage.

### Key Changes

1. **Backend Enhancements (`fly-api`)**:
   - `chatController.js`:
     - Updated `postAnnouncement` to accept and sanitize up to 5 attached photos (`url`, `name`, `size`, `type`, `storagePath`).
     - Added `updateAnnouncement` (`PATCH /api/chats/announcements/:id`) with role-check (admin only) and storage diffing: compares existing storage URLs with updated storage URLs and invokes `deleteFilesFromStorage` for deleted photos.
     - Added `deleteAnnouncement` (`DELETE /api/chats/announcements/:id`) with role-check (admin only) and invokes `deleteRecordStorageFiles` to clean up all storage assets associated with the announcement document upon deletion.
   - `chatRoutes.js`:
     - Registered `PATCH /announcements/:id` and `DELETE /announcements/:id` protected with authentication and rate limiting.

2. **Frontend Services & Routing (`fair-fly`)**:
   - `chatService.js`:
     - Updated `postAnnouncement` to pass sanitized `photos`.
     - Added `updateAnnouncement(id, { title, content, priority, photos })`.
     - Added `deleteAnnouncement(id)`.
   - `App.jsx`:
     - Registered `<Route path="announcements" element={<AnnouncementsPage />} />` under both `/admin` and `/operator`.
   - `AppNavbar.jsx`:
     - Removed the Announcements button from the top navbar since Announcements is now a dedicated page accessible via the main sidebar navigation.
     - Removed obsolete `AnnouncementsModal` from the navbar.
   - `AdminLayout.jsx` & `OperatorLayout.jsx`:
     - Added Announcements link (`fa-solid fa-bullhorn`) to sidebar menus in both admin and operator portals.

3. **Facebook-Style Announcements Page & Components (`fair-fly`)**:
   - `AnnouncementsPage.jsx`:
     - Integrated `PageHeader`, `SearchBar` with debouncing, and `FilterChipGroup` with real-time priority counts.
     - Implemented Facebook-style post composer for Administrators with drag-and-drop / file picker photo attachments (max 5 photos, $\le 15\text{MB}$ each, thumbnail previews with remove `✕` buttons, sequential upload via `uploadFileToBackend`).
     - Supports inline post editing with form pre-filling and scroll-into-view.
     - Supports post deletion with `ConfirmationModal` and storage asset cleanup.
     - Implemented post cards with official Head Office avatar, author metadata, verified badge, relative/absolute timestamp, priority indicator pill (`Urgent Alert`, `Important`, `Normal`), inline text truncation with "... See more" / "Show less" toggle, and "Expand Notice" reader action.
     - Integrated `SkeletonAnnouncement` replacing the loading spinner with realistic shimmering Facebook-card skeletons.
   - `Skeleton.jsx` & `skeleton.css`:
     - Created and exported `SkeletonAnnouncement` composite component matching the Facebook post card layout (avatar circle, author metadata bar, priority badge, headline, paragraph lines, photo placeholder, and footer actions).
   - `AnnouncementPhotoGrid.jsx`:
     - Renders responsive Facebook-style multi-photo mosaic grid layouts for 1, 2, 3, 4, and 5 photos with hover zoom effects.
   - `AnnouncementLightbox.jsx`:
     - Implemented fullscreen image viewer with next/previous controls, keyboard navigation (`Esc`, `ArrowLeft`, `ArrowRight`), photo counter ("X of Y"), and external tab open link.
   - `announcements-page.css`:
     - Complete CSS styling for the Facebook feed layout, composer, photo dropzone, thumbnail preview grid, mosaic photo grids (1 to 5 photos), lightbox viewer, and expanded reader modal.
     - **Layout Refinement**: Removed restrictive `max-width: 48rem` clamp and centered alignment, allowing the toolbar, composer, and post cards to utilize the full comfortable dashboard content width (`width: 100%`) without excessive horizontal margins or narrow column squishing. Streamlined card and toolbar paddings.

---

## [2026-09-08] Refactor: Admin Inquiry History Table Clean-Up and Symbol Styling

### Overview
Refined the Inquiry History table in the Admin portal (`/admin/inquiry-history`) by removing the redundant Requirements column per design requirements. Fixed missing and broken icon/symbol styles across the table and toolbar, including search icon positioning, clear button styling, branch selector label, branch tag badges with building icons, status pills, and standardized table action icon buttons for PDF export and record view.

### Key Changes

1. **Table Structure Optimization (`HistoryContent.jsx`)**:
   - Removed the `Requirements` column header and its table data cells.
   - Reduced `SkeletonTable` column count from 7 to 6 columns.
   - Updated empty state table cell `colSpan` from 7 to 6.
   - Cleaned up unused requirements parsing variables in the table render loop.

2. **Symbol & Typography Styling (`admin-inquiry-history.css` & `HistoryContent.jsx`)**:
   - **Toolbar Controls**: Added styles for `.search-box`, `.search-icon` (proper absolute positioning), `.search-box input`, and `.clear-search-btn` (interactive button with clean icon positioning).
   - **Branch Selector**: Styled `.inquiry-branch-label` with code-branch icon and focus states on `.inquiry-branch-select`.
   - **Form Reference & Date**: Styled `.inquiry-form-code` as a clean monospace badge with document icon and `.inquiry-date-sub` with calendar icon.
   - **Client Info**: Styled `.inquiry-client-name` and `.inquiry-client-sub` with mail/phone icons and proper hierarchy.
   - **Branch Received From**: Added complete styling for `.branch-tag` with purple building icon, padding, subtle border, and background tag.
   - **Table Actions**: Replaced mismatched buttons with standardized `.icon-btn.pdf` (red PDF icon with subtle highlight) and `.icon-btn.view` (purple eye icon button).
   - **Status Badges**: Standardized `.status-pill` classes (`status-pill-active`, `status-pill-pending`, `status-pill-disabled`) with capitalized text.

---

## [2026-09-08] Feature: Operator Qualification Application Supporting Documents & Admin Dedicated Qualification Detail Page

### Overview
Enhanced the Operator Qualification Application flow by adding multi-document upload support (up to 5 documents, 15MB each, supporting PDF, images, Word docs) on the Operator side. Converted the Admin qualification review flow from a modal into a dedicated full-page view (`/admin/qualifications/:id`) utilizing `RecordDetailLayout`. The dedicated page displays the applicant operator's live performance KPIs (Fulfilled Revenue, Active Services, Completed Services, Attached Documents), comprehensive branch profile, justification statement, decision form, and an interactive document manager providing View (with in-modal preview), Print, and Download capabilities for each attached document.

### Key Changes

1. **Backend API Enhancements (`fly-api`)**:
   - `qualificationRoutes.js`: Whitelisted `documents` array in `allowedFields` for `POST /qualifications`.
   - `qualificationController.js`:
     - Added robust server-side validation in `submitQualificationApplication`: enforces array type, maximum 5 documents, individual item schema verification (`name`, `url`, `size`, `type`, `storagePath`, `uploadedAt`), sanitized payload insertion, and dynamic Super Admin notifications with attached document counts.
     - Enriched `getQualificationApplicationById`: fetches and merges the operator's profile data (`operatorProfile`), including branch details and performance metrics (`totalRevenue`, `completedServicesCount`).

2. **Operator Document Upload Experience (`fair-fly`)**:
   - `QualificationApplicationModal.jsx`: Integrated dropzone allowing drag-and-drop and file picker uploads for up to 5 documents ($\le 15\text{MB}$ each, supported types `.pdf, .png, .jpg, .jpeg, .webp, .doc, .docx`). Features file type icons, size calculation, validation warnings, duplicate avoidance, attached document list with removal, upload progress indicator, and sequential upload via `uploadFileToBackend`.
   - `qualification-application-modal.css`: Styled upload dropzone, hover states, document item badges, remove actions, and progress feedback adhering to clean UI standards (no emojis).

3. **Dedicated Admin Qualification Detail Page (`fair-fly`)**:
   - `AdminQualificationDetailPage.jsx`: Created new dedicated detail page built with `RecordDetailLayout`, featuring:
     - Realtime synchronization with Firestore (`qualificationApplications`, `users`, `activeServices`).
     - Performance KPI Grid: Fulfilled Revenue (`₱${operator.totalRevenue}`), Active Services count, Completed Services count, and Attached Documents count badge.
     - Operator & Branch Profile Panel: Displays Branch Name, Contact Person, Email, Contact Number, Address, Account Status, Current Certification, Operator ID, and direct navigation link to the operator's account profile (`/admin/operators/:id`).
     - Justification Panel: Cleanly formatted statement of qualifications and experience.
     - Document Manager Panel: Shows all uploaded documents with type icons, file size, upload timestamp, and 3 dedicated actions per document: **View** (opens in-modal preview for images/PDFs), **Print** (triggers print window), and **Download** (secure blob download with proper filename).
     - Administrative Decision Form: Super Admin controls for approval/rejection with custom remarks and confirmation modals.
   - `admin-qualification-detail.css`: Tailored styles for KPI cards, two-column panels, document cards, hover treatments, action buttons, and responsive in-modal document previewer.

4. **Routing and Navigation Updates (`fair-fly`)**:
   - `App.jsx`: Registered route `<Route path=":id" element={<AdminQualificationDetailPage />} />` inside `<Route path="qualifications" element={<AdminQualifications />}>`.
   - `QualificationsContent.jsx`: Added document count badge to the data table, removed legacy review modal, and updated table action button to navigate directly to `/admin/qualifications/:id`.

---

## [2026-09-07] Feature: System-Wide Skeleton UI Implementation Replacing Data Loading Spinners

### Overview
Converted all data-loading states across the entire FairFly system (Admin portal, Operator portal, Client portal, and shared modals) from generic loading spinners and text placeholders to a modern, responsive Skeleton UI with shimmering animation. Created a global `.skeleton` CSS class hierarchy and reusable composite components (`Skeleton`, `SkeletonTable`, `SkeletonCard`, `SkeletonKpi`).

### Key Changes

1. **Global Skeleton CSS Animation & Utilities (`fair-fly/src/index.css`)**:
   - Implemented `@keyframes skeleton-shimmer` with a smooth linear gradient animation tailored to the design token palette (`var(--bg)`, `var(--border-color)`, `rgba(255, 255, 255, 0.4)`).
   - Created `.skeleton` base class with child suppression (`visibility: hidden`) allowing components to switch to `.skeleton` during loading and seamlessly transition back to their default class when data arrives.
   - Added utility classes: `.skeleton-text`, `.skeleton-title`, `.skeleton-circle`, `.skeleton-badge`, `.skeleton-btn`, and `.skeleton-card`.

2. **Core Reusable Skeleton Component Suite (`fair-fly/src/components/UI/Skeleton/`)**:
   - `Skeleton.jsx`: Exported primitive `Skeleton` supporting variants (`rect`, `circle`, `text`, `title`, `button`, `badge`).
   - `SkeletonTable`: Renders customizable skeleton table rows and cell bars matching table layouts with natural width variation.
   - `SkeletonCard`: Renders modular card skeletons with avatar, titles, multi-line descriptions, and actions.
   - `SkeletonKpi`: Renders metric KPI card skeletons matching dashboard stat cards.
   - `skeleton.css`: Defined styles for composite skeletons and natural pulse animations.

3. **Core Shared Layouts & Component Integration**:
   - `DataTable.jsx`: Integrated `isLoading` and `loading` props to render `<SkeletonTable columns={columns.length} rows={5} />` in `<tbody>`, instantly upgrading all standard tabular data across the application.
   - `KpiCard.jsx`: Added `isLoading` / `loading` props to seamlessly show skeleton headers and metric values while stats calculate.
   - `RecordDetailLayout.jsx`: Replaced `.spinner-box` with a full record detail skeleton (breadcrumbs, header card with avatar/title/badges/actions, and sectioned content body), upgrading all 10 detail pages system-wide.
   - `Loader.jsx`: Upgraded legacy loader component to render structured card skeletons instead of spinning wheels.
   - `Loading.jsx` & `Loading.css`: Modernized root app loading shell (auth initialization) with an animated app skeleton (sidebar, topbar, KPI grid, and table skeleton).

4. **Admin Portal Enhancements**:
   - `ServiceContent.jsx`: Removed early blank card; bound `isLoading` to KPI cards and `DataTable`.
   - `OperatorsContent.jsx`: Bound `isLoading={operatorLoading}` to KPI cards and `DataTable`.
   - `ClientsContent.jsx` & `AdminsContent.jsx`: Added `isLoading={loading}` to KPI cards and `DataTable`.
   - `FranchiseContent.jsx`: Replaced `<Loader />` with `<SkeletonCard count={4} />` and added `isLoading` to KPI cards.
   - `QualificationsContent.jsx`: Replaced loading spinner return with `isLoading` forwarded to KPI cards and `DataTable`.
   - `HistoryContent.jsx`: Replaced empty-state loading box with `<SkeletonTable columns={7} rows={5} />` in `tbody`.
   - `TicketsContent.jsx` & `TicketTable.jsx`: Bound `isLoading={ticketsLoading}` to KPI cards and forwarded to `DataTable`.
   - `TicketDetailPage.jsx`: Replaced spinner card with a full skeleton ticket conversation layout.
   - `ResourcesContent.jsx` & `QuickLinksContent.jsx`: Added `isLoading` to KPI cards and `DataTable`.
   - `AdminWorkflowTemplates.jsx`: Bound `isLoading` to `DataTable`.
   - `AdminDashboard.jsx` & `AdminLogsModal.jsx`: Replaced loading text with skeleton log rows.
   - `AdminForm.jsx`: Replaced loading operators spinner with skeleton operator checkbox cards.

5. **Operator Portal Enhancements**:
   - `OperatorDashboard.jsx`: Replaced active services loading box with 3 skeleton active service cards.
   - `OperatorServicesContent.jsx`: Bound `isLoading` to KPI cards and `DataTable`.
   - `OperatorServiceProcedure.jsx`: Replaced plain text loading box with a skeleton procedure stepper and step cards.
   - `OperatorTicketsContent.jsx` & `OperatorTicketDetailPage.jsx`: Bound `isLoading` to KPI cards and ticket detail layout.
   - `OperatorQuotations.jsx`: Replaced loading text with 3 skeleton quotation cards matching `.op-quotation-card` geometry.
   - `OperatorInquiryForms.jsx`: Replaced loading text with 4 skeleton inquiry cards matching `.op-inquiry-card`.
   - `OperatorAppointments.jsx`: Replaced loading box with 3 skeleton appointment cards matching `.op-appt-card`.
   - `OperatorWorkflows.jsx`: Replaced loading text with 4 skeleton step rows.
   - `OperatorResources.jsx`: Replaced loading spinner with 6 skeleton resource cards in `.op-resources-grid`.
   - `OperatorQuickLinks.jsx`: Replaced loading text with 6 skeleton quick link buttons.

6. **Client Portal & Shared Modals Enhancements**:
   - `ClientAppointmentsPage.jsx`: Added skeleton KPI metric values and replaced grid spinner with 4 skeleton appointment cards.
   - `ClientTrackingPage.jsx`: Added skeleton states for KPI metrics, replaced `loadingServices` spinner with skeleton service tracker cards, replaced `loadingQuotations` spinner with skeleton quotation cards, and replaced `loadingInquiries` spinner with skeleton inquiry cards.
   - `ClientServicesMarketplace.jsx`: Replaced catalog loading spinner with 6 skeleton product cards in `.shopping-products-grid`.
   - `ServiceItemPage.jsx`: Replaced `service-loading-card` with a full 2-column skeleton product layout matching the e-commerce gallery and specifications.
   - `ClientAppointmentForm.jsx`: Replaced branch options loading spinner with skeleton form inputs.
   - `ClientServiceRequestModal.jsx`: Replaced service options loading spinner with skeleton form inputs.
   - `NewChatModal.jsx`: Replaced contacts loading spinner with 5 skeleton contact list items.
   - `AnnouncementsModal.jsx`: Replaced announcements loading spinner with 3 skeleton announcement cards.
   - `MessagesPage.jsx`: Added `loadingConversations` state and rendered 4 skeleton conversation items in the left chat sidebar.

---

## [2026-09-07] Feature & Polish: Operator Service Fulfillment Revenue Crediting, Cancellation Flow, Client Notifications, and Complete Emoji Removal

### Overview
Implemented branch revenue crediting upon service fulfillment completion, added service fulfillment cancellation workflow with reason capture, integrated automated client in-app notifications on both service completion and cancellation, surfaced real-time fulfilled revenue in the Operator portal, and performed a comprehensive codebase-wide emoji removal replacing all unicode emojis and pictographs with semantic FontAwesome icons or text.

### Key Changes

1. **Revenue Crediting on Service Fulfillment (`fly-api`)**:
   - `fly-api/src/controllers/activeServiceController.js`:
     - When all steps in a service procedure are marked as `Completed`, parses and calculates the service revenue.
     - Atomically increments `totalRevenue` and `completedServicesCount` on the fulfilling operator's branch record (`users/${branchUid}`) using `admin.firestore.FieldValue.increment`.
     - Flags `revenueCredited: true`, `revenueAmount`, and `fulfilledBranchUid` on the active service document with strict idempotency to prevent duplicate revenue additions.
     - Automatically creates and dispatches an in-app notification to `clientUid` (`createNotification`) notifying the client that their service fulfillment has been completed and verified.

2. **Service Fulfillment Cancellation Workflow (`fly-api` & `fair-fly`)**:
   - `fly-api/src/controllers/activeServiceController.js`: Added `cancelActiveService` controller method (`PATCH /api/services/active/:id/cancel`). Validates that the service is not already finalized, transitions status to `Cancelled`, timestamps `cancelledAt`, records `cancellationReason` and `cancelledBy`, and dispatches an in-app notification to `clientUid` (`'Service Fulfillment Cancelled'`).
   - `fly-api/src/routes/activeServiceRoutes.js`: Mounted `PATCH /services/active/:id/cancel` endpoint.
   - `fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx`:
     - Added "Cancel Service Fulfillment" button in the top header bar when active.
     - Added an interactive modal dialog with cancellation reason input and confirm/cancel actions.
     - Added dedicated status banners for both `Completed` (displaying credited revenue) and `Cancelled` (displaying cancellation reason and timestamp).
     - Locked workflow step action buttons when service fulfillment is completed or cancelled.
   - `fair-fly/src/pages/Operator/OperatorServiceProcedure/operator-service-procedure.css`: Added styles for `.swm-overall-badge.cancelled`, `.op-procedure-top-actions`, `.op-procedure-cancel-btn`, `.op-procedure-status-banner.completed`, `.op-procedure-status-banner.cancelled`, and `.op-cancel-modal-*` modal components.

3. **Operator Dashboard & Layout Real-time Revenue Surfacing (`fair-fly`)**:
   - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx`: Added a real-time `Fulfilled Revenue` KPI Card (`₱...`) linked to the operator's branch profile `userDetails.totalRevenue`, and scoped active service counts to the branch.
   - `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx`: Added status badges (`Completed`, `Cancelled`, `Processing`) and dynamic button actions (`View Fulfilled Details`, `View Cancellation`, `Perform Workflow Procedure`) on active service cards.
   - `fair-fly/src/pages/Operator/OperatorDashboard/operator-dashboard.css`: Added `.op-status-badge` classes for `completed`, `cancelled`, and `processing`.

4. **Complete Elimination of Emojis Across Repository**:
   - Replaced all emojis and unicode pictographs across the codebase with FontAwesome icons or clean semantic text:
     - `ServiceForm.jsx`: Replaced `✓` in suggested tag buttons with `<i className="fa-solid fa-check"></i>`.
     - `ClientServiceRequestModal.jsx`: Removed `🎉` from success toast notification.
     - `QualificationApplicationModal.jsx`: Removed `🎉` from success toast notification.
     - `ServiceWorkflowModal.jsx`: Removed `🎉` from completion toast notification.
     - `OperatorServiceProcedure.jsx`: Removed `🎉` from completion toast notification, replaced requirement type badges (`📷`, `📄`, `📅`, `🔢`, `✏️`) with `<i className="fa-regular ..."></i>` icons.
     - `Chatbot.jsx`: Removed `☕` from quota fallback message.
     - `Toast.jsx`: Replaced unicode symbols (`✓`, `✕`, `⚠`) with `<i className="fa-solid fa-circle-check"></i>`, `<i className="fa-solid fa-circle-xmark"></i>`, `<i className="fa-solid fa-triangle-exclamation"></i>`.
     - `OperatorServiceDetailPage.jsx`: Removed `✨`, `🔒`, `📖` from privilege alert banners.
     - `OperatorServicesContent.jsx`: Removed `🎉` from service creation toast.
     - `PdfDocumentView.jsx`: Replaced unicode `✓` in print checkbox with FontAwesome icon.
   - Verified 0 remaining emojis across the entire frontend and backend source trees using custom unicode character inspection.

---



## [2026-09-04] Fix: Removed Duplicate Selection Checkbox in DataTable

### Overview
Resolved an issue where tables with row selection enabled displayed two selection boxes side-by-side. The header and body row selection cells in `DataTable.jsx` contained both a native `<input type="checkbox" />` and a redundant `<span className="checkbox-custom"></span>` which picked up global styling from the application CSS bundle.

### Files Modified
- `fair-fly/src/components/UI/DataTable/DataTable.jsx`: Removed redundant `<span className="checkbox-custom"></span>` from both table header and table body row selection cells (`th.select-col` and `td.select-col`), and added accessible `aria-label` tags.
- `fair-fly/src/components/Client/ClientInquiryModal/client-inquiry-modal.css`: Scoped `.checkbox-custom` to `.service-check-tile .checkbox-custom` to prevent any CSS rule leakage to other components across the project.

---

### Overview
Enhanced the Operator portal with a dedicated "Services" catalog tab allowing all operators to inspect standard catalog services in detail (read-only), while empowering qualified branch operators to create, manage, and price their own branch-exclusive services. Added an interactive `<ServiceCarouselGallery />` with thumbnail navigation and high-resolution Lightbox preview to Service Detail pages across both Admin and Operator portals, and eliminated inline CSS.

### Files Created & Modified
- **Shared UI Gallery Component (`fair-fly`)**:
  - `fair-fly/src/components/UI/ServiceCarouselGallery/ServiceCarouselGallery.jsx` **[NEW]**: Reusable multi-image carousel component combining `coverImage` and `carouselImages` with smooth navigation, previous/next controls, image counter indicator, thumbnail strip selector, category overlay pills, and fullscreen click-to-zoom Lightbox modal with keyboard Escape support.
  - `fair-fly/src/components/UI/ServiceCarouselGallery/service-carousel-gallery.css` **[NEW]**: Complete styling for the gallery stage, buttons, thumbnail items, and lightbox overlay.
- **Admin Portal (`fair-fly`)**:
  - `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx`: Replaced static hero cover banner with interactive `<ServiceCarouselGallery />`. Migrated all remaining inline styles to `.service-detail.css`.
  - `fair-fly/src/pages/Admin/AdminServices/service-detail.css`: Added utility classes (`.service-kpi-purple`, `.service-detail-category-value`, `.service-featured-pill`, `.service-add-desc-btn`, etc.).
- **Operator Portal (`fair-fly`)**:
  - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx`: Updated navigation item from `'My Services'` to `'Services'` with icon `'fa-solid fa-concierge-bell'`.
  - `fair-fly/src/pages/Operator/OperatorServices/OperatorServicesContent.jsx`: Removed hard access lockout for unqualified operators. Implemented Scope Filter chips ("All Services", "Standard Catalog", "My Branch Exclusive"), search with debouncing, status filters, and "View Details" action for all services. Restricted Edit, Status Toggle, and Delete actions strictly to qualified operators for their own branch-exclusive services. Displayed contextual privilege alert banners and header CTA ("Create Branch Service" for qualified; "Apply for Qualification" for standard). Cleaned all inline styles.
  - `fair-fly/src/pages/Operator/OperatorServices/operator-services.css`: Added styles for branch badges (`.op-service-badge-own`, `.op-service-badge-standard`, `.op-service-badge-other`), scope chips, qualification banner, and view links.
  - `fair-fly/src/pages/Operator/OperatorServices/OperatorServiceDetailPage.jsx` **[NEW]**: Full detail view at `/operator/services/:id` utilizing `RecordDetailLayout`. Renders `<ServiceCarouselGallery />`, KPI metrics (fee, turnaround, requirements count, workflow stages), specifications, required input checklist with attachment links, and workflow milestones. Displays permissions banner and enables management actions only for qualified operators on their own branch services; provides quick-action link to SOP Procedure if available.
  - `fair-fly/src/pages/Operator/OperatorServices/operator-service-detail.css` **[NEW]**: Stylesheet for operator service detail layout, procedure callout banner, and branch exclusivity indicators.
- **Application Routing (`fair-fly`)**:
  - `fair-fly/src/App.jsx`: Registered child route `<Route path=":id" element={<OperatorServiceDetailPage />} />` under `/operator/services`.

---

### Files Modified
- `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx`: Defined `CATEGORIES` and `PRIORITIES` constants at module scope and ensured both Category and Priority select dropdowns map options cleanly with `className="form-select"`.
- `Fairfly/lessons-learned.md`: Documented root cause, remediation, and prevention for unscoped array constant references in JSX.

## [2026-09-03] Refactor: Migrated Inline CSS Styles to Dedicated Stylesheets and Semantic Classes

### Overview
Moved inline styles (`style={{ ... }}`) across Inquiry, Quotation, Qualification, Tracking, and Service Request interfaces into their corresponding CSS files following FairFly component and design system standards.

### Files Modified
- **Operator Inquiry Details (`InquiryFormDetailPage.jsx` & `inquiry-form-detail.css`)**:
  - Extracted cross-reference action links, badge indicators, service offered tags wrap/badges, panel title headers, SAF-01-002 section badges, specified requirements box, and attachment actions to `.inquiry-action-link`, `.inquiry-service-badge`, `.inquiry-specs-box`, etc.
- **Admin Inquiry Details (`AdminInquiryDetailPage.jsx`)**:
  - Shared `.inquiry-form-detail.css` stylesheet classes replacing all inline styles in the intake metadata and specified requirements panels.
- **Operator Quotation Details (`QuotationDetailPage.jsx` & `quotation-detail.css`)**:
  - Extracted accepted banner styles, inquiry cross-reference bar, total amount inputs, and multi-line text blocks to `.quote-accepted-banner`, `.quote-inquiry-bar`, `.quote-total-input`, etc.
- **Client Tracking Portal (`ClientTrackingPage.jsx` & `client-tracking.css`)**:
  - Extracted header action bar, live sync pill, loading/empty state containers, and secondary inquiry action headers to `.tracking-header-actions`, `.tracking-empty-title`, etc.
- **Operator Qualification Modal (`QualificationApplicationModal.jsx` & `qualification-application-modal.css`)**:
  - Created dedicated `qualification-application-modal.css` and replaced all inline modal styles with semantic BEM classes (`.qualification-modal-form`, `.qualification-info-callout`, etc.).
- **Client & Operator Modals (`ClientInquiryModal.jsx`, `CreateQuotationModal.jsx`, `CreateInquiryFormModal.jsx`, `CreateTicketModal.jsx`, `ClientServiceRequestModal.jsx`)**:
  - Moved inline button and input styles into their respective CSS files (`client-inquiry-modal.css`, `create-quotation-modal.css`, `create-inquiry-form-modal.css`, `tickets.css`, and `client-service-request-modal.css`).

## [2026-09-03] Fix: Resolved ReferenceError for isConfirmed in InquiryFormDetailPage

### Files Modified
- `fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx` (Fixed `ReferenceError: isConfirmed is not defined` on line 233 by passing the dynamic helper `statusType={getStatusBadgeType()}` to `<RecordDetailLayout>` and declaring `isConfirmed` state helper).
- `Fairfly/lessons-learned.md` (Recorded root cause, prevention, and remediation for stale identifier references).

## [2026-09-03] Fix: Proactive Submit Button Disabling Across All Forms Until Required Inputs and Files Are Provided

### Files Modified
- **Client Portal (`fair-fly`)**:
  - `fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx` (Added `isFormValid` memo that validates selected service, selected branch, client name, and every dynamic requirement in `serviceRequirements` ensuring all required files/images are attached and text inputs are filled before enabling the submit button; updated submit button `disabled={isSubmitting || servicesList.length === 0 || !isFormValid}`).
  - `fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx` (Added `isFormValid` memo checking `clientName`, phone/email, `selectedServices.length > 0`, `specifiedRequirements`, and branch selection; updated submit button `disabled={isSubmitting || !isFormValid}`).
  - `fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx` (Added `isFormValid` validation checking client name, phone number, and preferred appointment date; updated submit button `disabled={isSubmitting || !isFormValid}`).
  - `fair-fly/src/pages/Index/Login/login.jsx` (Added `isFormValid` checking email and password alongside `isLoading` state; updated submit button `disabled={!isFormValid || isLoading}`).
  - `fair-fly/src/pages/Index/Login/login.css` (Added dedicated `.login-button:disabled` visual styles with dimmed background and `not-allowed` cursor).
- **Operator Portal (`fair-fly`)**:
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx` (Added `isFormValid` checking client name, contact info, selected services offered, and specified requirements; updated submit button `disabled={isSubmitting || !isFormValid}`).
  - `fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx` (Added `isFormValid` checking client name, service title/id, requirements, rate, and total amount; updated submit button `disabled={isSubmitting || !isFormValid}`).
  - `fair-fly/src/components/Operator/QualificationApplicationModal/QualificationApplicationModal.jsx` (Updated submit button `disabled={isSubmitting || !reason.trim()}`).
- **Admin Portal & Shared Modals (`fair-fly`)**:
  - `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceForm.jsx` (Added `isFormValid` checking service name, category/customCategory, price, and processing time turnaround; updated submit button `disabled={isLoading || !isFormValid}`).
  - `fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx` (Enhanced Add Requirement button validation to verify `attachmentUrl` when attachment type is link).
  - `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowForm.jsx` (Added `isWorkflowValid` checking workflow name, description, and `steps.length > 0`; disabled Save Steps button when `steps.length === 0`).
  - `fair-fly/src/components/Admin/Modals/ResourceModal/ResourceForm.jsx` (Added `isFormValid` checking document title and attached file; updated submit button `disabled={isLoading || isUploading || !isFormValid}`).
  - `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorForm.jsx` (Added `isFormValid` checking branch name, contact number, address, email, and password on create; updated submit button `disabled={isLoading || !isFormValid}`).
  - `fair-fly/src/components/Admin/Modals/AdminModal/AdminForm.jsx` (Added `isFormValid` checking username, email, and password; updated submit button `disabled={isLoading || !isFormValid}`).
  - `fair-fly/src/components/Admin/Modals/ClientEditModal/ClientEditForm.jsx` (Updated submit button `disabled={isLoading || !fullName.trim()}`).
  - `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkForm.jsx` (Added `isFormValid` checking title, URL, and category; updated submit button `disabled={isLoading || !isFormValid}`).
  - `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx` (Added validation to disable ticket creation button if branch operator is unassigned in admin view).
  - `fair-fly/src/components/Shared/Chatbot/Chatbot.jsx` (Updated send button `disabled={loading || !input.trim()}`).
  - `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx` (Hardened required fields check to reject whitespace-only strings).

### Summary of Changes
- **Proactive UX Gate**: Eliminated frustrating error toast popups caused by clicking enabled buttons on incomplete forms.
- **Dynamic File & Input Verification**: Multi-part forms like `ClientServiceRequestModal` now monitor dynamic text requirements and mandatory file/image attachments in real time, keeping the submit button disabled until all criteria are satisfied.
- **Global Consistency**: Ensured every form in the Client, Operator, and Admin interfaces enforces uniform disabled states and visual cues when mandatory fields are missing.

## [2026-09-03] Feature: Inquiry → Quotation → Custom Service Workflow Overhaul (SAF-01-002 & ADF-07-001)

### Files Created & Modified
- **Security & Backend API (`fly-api` & `firestore.rules`)**:
  - `Fairfly/firestore.rules` (Added `/inquiries/{inquiryId}` security rules granting read access to client owner and staff, create to authenticated clients, and update/delete to operator/admin).
  - `fly-api/src/controllers/inquiryController.js` (Updated `createInquiry` and `getInquiries` to handle `clientUid`, `servicesOffered` array, `specifiedRequirements`, `formNo: 'SAF-01-002'`, formatted `controlNo`, and client-scoped filtering).
  - `fly-api/src/controllers/quotationController.js` (Added `inquiryId` linkage and `clientUid` inheritance, auto-synced inquiry status on quotation creation/sending/acceptance, client role query filtering, and implemented `acceptQuotation` to initialize active Custom Service in `activeServices` with compiled sequential workflow milestones).
  - `fly-api/src/routes/quotationRoutes.js` (Mounted `POST /:id/accept`).
- **Official PDF Templates (`fair-fly`)**:
  - `fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx` (Re-engineered Inquiry export to exact layout of `SAF-01-002` with 6 services offered checkboxes, 4-row client info grid, Specified Requirements of Client, Remarks, and signatures; re-engineered Quotation export to exact layout of `ADF-07-001` with 2-column bordered table, requirements, tour dates, inclusions, exclusions, rates, prepared by block, and DOT accreditation footer).
  - `fair-fly/src/components/Shared/PdfDocument/pdf-document.css` (Added complete printable styling and `@media print` rules for both document formats).
- **Client Portal (`fair-fly`)**:
  - `fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx` **[NEW]** (Digital client intake modal matching `SAF-01-002` with 6 service checkboxes, Specified Requirements of Client textarea, and auto-populated profile).
  - `fair-fly/src/components/Client/ClientInquiryModal/client-inquiry-modal.css` **[NEW]** (Modal styles for digital client inquiry intake).
  - `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx` (Connected "Request Custom Service" button to `ClientInquiryModal`).
  - `fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx` (Implemented 2 tabs: "Ongoing Services" and "My Inquiries & Quotations" with real-time `onSnapshot` queries, PDF previews, and 1-click "Accept Quotation" action).
  - `fair-fly/src/pages/ClientSide/ClientTracking/client-tracking.css` (Added styling for 2-tab navigation, quotation proposal cards, and inquiry intake cards).
- **Operator Portal (`fair-fly`)**:
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx` (Updated on-site inquiry intake to mirror `SAF-01-002` fields without blocking on internal document uploads).
  - `fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx` **[NEW]** (Reusable quotation modal supporting pre-population from inquiry data, automatic totals calculation, and `ADF-07-001` fields).
  - `fair-fly/src/components/Operator/CreateQuotationModal/create-quotation-modal.css` **[NEW]** (Styling for quotation creator modal).
  - `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Refactored to import and use reusable `CreateQuotationModal`).
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx` (Updated to display Specified Requirements of Client prominently, added "Create Quotation" action pre-filled with inquiry data, "Export to PDF (SAF-01-002)", and cross-reference links).
  - `fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx` (Added "Accept on Behalf of Client (On-Site)" button calling `acceptQuotation`, "Send to Client", "Export to PDF (ADF-07-001)", and cross-reference banners).
  - `fair-fly/src/services/quotationService.js` (Exported `acceptQuotation`).
- **Admin Portal (`fair-fly`)**:
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx` (Updated to display Specified Requirements of Client, services offered badges, and "Export to PDF (SAF-01-002)").

### Summary of Changes
- **Conceptual Clarification**: The Inquiry Form (`SAF-01-002`) represents "What does the client want?" captured in "Specified Requirements of Client" and 6 service checkboxes (`NSO`, `Passport`, `VISA Assistance`, `Package Tour`, `Ticket`, `Others`).
- **Quotation Proposal Flow (`ADF-07-001`)**: Operators review client inquiries and generate official Quotations pre-filled from client requirements.
- **Custom Service Fulfillment**: Accepting a quotation (either by the client via the tracking portal or by the operator on behalf of walk-in clients) compiles sequential workflow milestones and instantiates the Custom Service in `activeServices`.
- **End-to-End Real-Time Linkage**: Inquiries, Quotations, and Ongoing Custom Services maintain two-way cross references with direct navigation links and status synchronizations across Client, Operator, and Admin interfaces.

## [2026-08-27] Feature: Quotation PDF Mirror, Dynamic Inquiries with Document Uploads & Confirmation Workflow, Admin Branch Inquiry History, Form Builder, and Storage Photo Diffing

### Files Created & Modified
- **Storage Photo Diffing (`fly-api`)**:
  - `fly-api/src/controllers/serviceController.js` (Implemented Firebase Storage photo diffing in `updateService`: compares existing URLs vs updated URLs and automatically deletes removed cover photos, carousel images, and requirement attachments from Firebase Storage via `deleteFilesFromStorage`).
- **Quotation Form & PDF Export (`fair-fly` & `fly-api`)**:
  - `fly-api/src/controllers/quotationController.js` (Extended `createQuotation` and `updateQuotation` to support structured fields matching official FairFly document: `contactPerson`, `requirements`, `tourDates`, `inclusions`, `exclusions`, `rateBreakdown`, `taxAmount`, `totalAmount`, `preparedByName`, `preparedByTitle`, `preparedByContact`, `quotationDate`, `branchUid`, `branchName`, `inquiryId`).
  - `fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx` **[NEW]** (Created A4 printable preview and 1-click PDF download component using `html2pdf.js`, perfectly rendering FairFly letterhead, quotation table, signatures, and DOT accreditation footer).
  - `fair-fly/src/components/Shared/PdfDocument/pdf-document.css` **[NEW]** (Responsive styling and `@media print` rules for PDF generation).
  - `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Updated `CreateQuotationModal` to dynamically fetch active services from catalog, auto-populate base rate directly from selected service schema without requiring manual input, auto-populate requirements, calculate rate breakdowns with optional custom tax/surcharges, compute totals, and collect sign-off information).
  - `fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx` (Added "Export to PDF" button and full inline editing and display of all PDF mirror fields).
- **Dynamic Services, Requirement Uploads & Confirmation Workflow (`fly-api` & `fair-fly`)**:
  - `fly-api/src/controllers/inquiryController.js` (Enhanced `createInquiry`, `getInquiries`, and implemented `confirmInquiry` which validates client document uploads, auto-generates a formatted Quotation in `quotations`, auto-initializes an ongoing active service in `activeServices` with compiled workflow step templates, and links cross references; implemented dynamic schema getter/setter).
  - `fly-api/src/routes/inquiryRoutes.js` (Mounted `/schema`, `/:id/confirm`, and RBAC routes).
  - `fair-fly/src/services/inquiryService.js` **[NEW]** (Centralized API service for inquiries CRUD, confirmation, file uploads, and dynamic schemas).
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx` (Replaced static services and requirements with dynamic catalog services, interactive requirement checklist dropzones for uploading client documents on their behalf via backend storage, and dynamic custom field support).
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/create-inquiry-form-modal.css` (Added requirement checklist and document upload styles).
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx` (Added "Confirm Inquiry" button with requirement gate, in-place document uploads, cross-reference links to created Quotation & Ongoing Active Service, and "Export to PDF").
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/inquiry-form-detail.css` (Added confirmation banner and requirement item card styling).
- **Admin Side Inquiry Requests History & Dynamic Form Builder (`fair-fly`)**:
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryHistory.jsx` (Configured `AdminProvider targetCollection="inquiries"` for live single-source-of-truth syncing).
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` (Replaced legacy franchise content with complete Inquiry Requests History table, branch categorization filter, status chips, KPIs, and form customizer button).
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx` **[NEW]** (Comprehensive inquiry record view with branch attribution, uploaded document links, and PDF export).
  - `fair-fly/src/components/Admin/Modals/InquiryFormBuilderModal/InquiryFormBuilderModal.jsx` **[NEW]** (Interactive drag/add/edit form builder for Admins to add/remove custom fields and dynamically configure inquiry intake forms without breaking existing data).
  - `fair-fly/src/components/Admin/Modals/InquiryFormBuilderModal/inquiry-form-builder.css` **[NEW]** (Styling for form builder).
  - `fair-fly/src/App.jsx` (Updated routing for `/admin/inquiry-history/:id` to `AdminInquiryDetailPage`).

### Summary of Changes
- **Firebase Storage Photo Diffing**: Services updated in Admin automatically diff image URLs and remove deleted photos from Firebase Storage.
- **Quotation Form Redesign**: Matches official FairFly document structure with 1-click client-side PDF export.
- **Dynamic Inquiry Intake**: Services and requirements are dynamically loaded from catalog, operators can upload requirement documents on behalf of clients, and confirming an inquiry automatically generates a linked Quotation and initializes an Ongoing Active Service with workflow steps.
- **Admin Inquiry History**: Single source of truth for all inquiries categorized by branch with branch filters, status filters, and search.
- **Dynamic Form Builder**: Admins can customize inquiry intake fields dynamically in real-time.

## [2026-08-27] Fix: Operator Quotation & Inquiry Form Page Vertical Spacing

### Files Modified
- **Operator Portal (`fair-fly`)**:
  - `fair-fly/src/pages/Operator/OperatorQuotations/operator-quotations.css` (Added `.operator-quotations-page` flex column container rule with `1.5rem` gap to provide vertical spacing between Breadcrumbs, PageHeader, and Quotations table card)
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/operator-inquiry-forms.css` (Added `.operator-inquiries-page` flex column container rule with `1.5rem` gap to provide vertical spacing between Breadcrumbs, PageHeader, and Inquiry forms container)
  - `fair-fly/src/pages/Operator/OperatorAppointments/operator-appointments.css` (Added `.operator-appointments-page` flex column container rule)
  - `fair-fly/src/pages/Operator/OperatorHistory/operator-history.css` (Added `.operator-history-page` flex column container rule)
  - `fair-fly/src/pages/Operator/OperatorQuickLinks/operator-quick-links.css` (Added `.operator-quick-links-page` flex column container rule)

### Summary of Changes
- Resolved the missing vertical spacing between the `PageHeader` and the table cards in the Operator Quotation and Inquiry Form pages by declaring the container class rules scoped strictly to their respective page stylesheets.
- Preserved existing layout structure of all other pages across the application.

## [2026-08-27] Feature: Admin Client Management System & Backend Registration Auth Migration

### Files Created & Modified
- **Backend API & Security (`fly-api`)**:
  - `fly-api/src/controllers/clientController.js` **[NEW]** (Implemented `getClients`, `getClientById` with related activity summary, `updateClient` with non-sensitive field protection, and `deleteClient` removing from Auth and Firestore with cache eviction)
  - `fly-api/src/routes/clientRoutes.js` **[NEW]** (Created `/api/clients` routes protected with `verifyFirebaseToken`, `requireRole('admin')`, `allowedFields`, and `apiRateLimiter`)
  - `fly-api/src/controllers/authController.js` (Implemented `registerClient` for public client registration on the backend, enforcing input validation, password complexity, hardcoded `role: 'client'`, and rollback on Firestore failure)
  - `fly-api/src/routes/authRoutes.js` (Added public rate-limited `POST /api/auth/register` endpoint)
  - `fly-api/src/routes/index.js` (Mounted `/clients` routes)
  - `firestore.rules` (Hardened `/users/{userId}` security rules: set `allow create: if false;`, ensuring all user creations pass through the backend API to prevent client-side privilege escalation; restricted `update` and `delete` to `isAdmin()`)
- **Frontend Services & Auth Context (`fair-fly`)**:
  - `fair-fly/src/services/authService.js` (Added `registerClient` using `ApiCaller` to track loading and handle callbacks)
  - `fair-fly/src/services/adminService.js` (Added `fetchClients`, `fetchClientById`, `updateClient`, and `deleteClient` using `ApiCaller`)
  - `fair-fly/src/pages/Index/Register/Register.jsx` (Migrated registration flow to backend `registerClient` via `ApiCaller`, removing client-side Firebase Auth user creation and Firestore writes)
  - `fair-fly/src/context/AuthContext.jsx` (Removed unused `isRegistering` / `setIsRegistering` state)
  - `fair-fly/src/App.jsx` (Cleaned up `isRegistering` and mounted `/admin/clients` routes)
- **Admin Frontend Portal (`fair-fly`)**:
  - `fair-fly/src/components/Admin/Modals/ClientEditModal/ClientEditModal.jsx` **[NEW]** (Created Client Edit Modal dialog)
  - `fair-fly/src/components/Admin/Modals/ClientEditModal/ClientEditForm.jsx` **[NEW]** (Created edit form allowing admins to modify `fullName`, `phone`, `status`, and `address`; strictly displaying email as read-only and disallowing password changes)
  - `fair-fly/src/pages/Admin/AdminClients/AdminClients.jsx` **[NEW]** (Created clean `<Outlet />` wrapper for client management)
  - `fair-fly/src/pages/Admin/AdminClients/ClientsContent.jsx` **[NEW]** (Created client accounts table view with horizontal KPI cards, debounce search, filter chips, DataTable, system-standard `icon-btn` action buttons matching Operators and Admins tables, status toggling, and deletion confirmation)
  - `fair-fly/src/pages/Admin/AdminClients/ClientDetailPage.jsx` **[NEW]** (Integrated standard `RecordDetailLayout` for graceful inner content loading without page shell reloading, displaying full profile, status badge, contact/address fields, and related activity stats)
  - `fair-fly/src/pages/Admin/AdminClients/admin-clients.css` **[NEW]** (Added responsive REM styling, avatar bubbles, and accessible status badges for client management)
  - `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Added "Clients" link with `fa-user-group` icon to Admin navigation sidebar)

### Summary of Changes
- Admins can now manage client accounts at `/admin/clients` (viewing details, editing contact information, activating/deactivating, and deleting accounts).
- Action buttons across the Client table are standardized with the system's `icon-btn` design (`view`, `edit`, `ban`/`check`, `delete`).
- `ClientDetailPage` now uses `RecordDetailLayout` so only the inner content loads rather than triggering a full page reload/shell unmount when viewing client profiles.
- Strict security constraints applied: Admins cannot change client emails or passwords.
- Client registration is migrated completely to the backend (`POST /api/auth/register`), preventing any client-side privilege escalation.
- Firestore security rules updated so that user creation directly from the client is disabled (`allow create: if false`).

## [2026-08-27] Feature: Terms & Privacy Modal, Admin Operator Tab Loading Fix, and Client Navbar Logo Fix

### Files Created & Modified
- **Legal & Privacy Center (`fair-fly`)**:
  - `fair-fly/src/components/Shared/TermsPrivacyModal/TermsPrivacyModal.jsx` **[NEW]** (Created reusable, tabbed modal dialog for Terms of Service and Privacy Policy adhering strictly to RA 10173 Data Privacy Act and FairFly travel/documentation franchise regulations; supports outside click closing, top/bottom close actions, and deep-linking to active tabs)
  - `fair-fly/src/components/Shared/TermsPrivacyModal/terms-privacy-modal.css` **[NEW]** (Added responsive REM styling, accessible contrasts, and sticky header controls)
  - `fair-fly/src/pages/Index/Login/login.jsx` & `login.css` (Transformed static footer text into interactive buttons linking to the Terms and Privacy Policy popup modal)
  - `fair-fly/src/pages/Index/Register/Register.jsx` & `register.css` (Transformed static footer text into interactive buttons linking to the Terms and Privacy Policy popup modal)
- **Admin Portal — Operators Tab Resilience (`fair-fly`)**:
  - `fair-fly/src/pages/Admin/AdminOperators/AdminOperators.jsx` (Simplified component to clean `<Outlet />` wrapper consistent with other admin feature outlets)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Migrated data fetching from client-side Firestore `useAdminContext` to backend `fetchOperators` via `adminService.js`, adding automatic state refresh on operator creation, edit, toggle status, and delete actions)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorDetailPage.jsx` (Migrated single operator retrieval to backend `fetchOperatorById` via `adminService.js`)
  - `fair-fly/src/context/AdminContext.jsx` (Added error handling to `onSnapshot` listener to prevent infinite loading lockups)
- **Client Portal — Navbar Branding (`fair-fly`)**:
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` (Corrected FairFly brand logo image asset source from `/fairfly_logo.png` to `/FairflyLogo.png` with `/favicon1.png` fallback)
  - `fair-fly/src/components/UI/AppNavbar/app-navbar.css` (Added explicit `.app-nav-brand` and `.app-nav-logo` dimensions, responsive height, and object-fit containment rules)

### Summary of Changes
- Users can now review the complete **Terms of Service** and **Privacy Policy** by clicking the links on the Login and Registration cards; the popup can be closed via backdrop click, top close button, or "I Understand" action.
- Resolved the issue where clicking the **Operators** tab in the Admin portal failed to load by shifting data retrieval to authenticated backend REST endpoints.
- Restored the FairFly logo rendering on the Client portal top navigation bar across desktop and mobile screens.
## [2026-08-27] Feature: Qualified Operator Services, Branch Exclusivity & Marketplace Branch Filtering

### Files Created & Modified
- **Backend Services & Qualification System (`fly-api`)**:
  - `fly-api/src/controllers/qualificationController.js` **[NEW]** (Implemented `submitQualificationApplication` for operators to apply, `getQualificationApplications`, `getQualificationApplicationById`, and `reviewQualificationApplication` for Super Admins to approve/reject and toggle `isQualified` on operator users with cache invalidation)
  - `fly-api/src/routes/qualificationRoutes.js` **[NEW]** (Created `/api/qualifications` routes with RBAC protection: operators submit, admins list, super admins review)
  - `fly-api/src/routes/index.js` (Mounted `/qualifications` routes)
  - `fly-api/src/controllers/serviceController.js` (Enforced operator qualification check on service creation, tagged operator-created services with `isBranchExclusive: true` and branch UID/name, enforced operator ownership on edit/delete, and added `branchUid` query filtering)
  - `fly-api/src/routes/serviceRoutes.js` (Allowed `operator` role on `POST`, `PUT`, `PATCH`, `DELETE` endpoints and updated `SERVICE_ALLOWED_FIELDS`)
  - `fly-api/src/controllers/operatorController.js` (Added `isQualified` support to operator creation and update endpoints, invalidated user cache on changes, and returned `isQualified` in `getBranches`)
  - `fly-api/src/routes/operatorRoutes.js` (Allowed `isQualified` in operator update payload)
  - `fly-api/src/controllers/activeServiceController.js` (Locked `branchUid` and `branchName` to the service's owning branch for branch-exclusive active service requests)
  - `firestore.rules` (Added security rules for `qualificationApplications` collection)
- **Admin Frontend Portal (`fair-fly`)**:
  - `fair-fly/src/pages/Admin/AdminQualifications/AdminQualifications.jsx` **[NEW]** (Created AdminProvider context wrapper for `qualificationApplications`)
  - `fair-fly/src/pages/Admin/AdminQualifications/QualificationsContent.jsx` **[NEW]** (Created qualification management interface with horizontal KPI stats flex grid, search, status filter chips, applications DataTable, and Super Admin review modal)
  - `fair-fly/src/pages/Admin/AdminQualifications/admin-qualifications.css` **[NEW]** (Added styles for qualifications management view including horizontal `.services-summary-grid`)
  - `fair-fly/src/index.css` (Added `.kpi-grid-4` alongside `.services-summary-grid` for responsive horizontal KPI cards flex layout)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorDetailPage.jsx` (Added Service Qualification badge and one-click "Grant Qualification" / "Revoke Qualification" action toggle button)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Added "Qualified" badge to operator table rows and "Qualified" filter chip)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Added "Branch Exclusive" badge with branch name to service rows and filter chip)
  - `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Added "Qualifications" navigation link to admin sidebar)
  - `fair-fly/src/App.jsx` (Mounted `/admin/qualifications` route)
- **Operator Frontend Portal (`fair-fly`)**:
  - `fair-fly/src/components/Operator/QualificationApplicationModal/QualificationApplicationModal.jsx` **[NEW]** (Created modal for non-qualified operators to submit qualification applications with justification details)
  - `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Added dynamic qualification status banner offering qualification application or direct navigation to branch service catalog)
  - `fair-fly/src/pages/Operator/OperatorServices/OperatorServices.jsx` **[NEW]** (AdminProvider wrapper for operator branch services)
  - `fair-fly/src/pages/Operator/OperatorServices/OperatorServicesContent.jsx` **[NEW]** (Created branch services catalog interface allowing qualified operators to create, edit, toggle status, and delete their own branch-exclusive services with media uploads)
  - `fair-fly/src/pages/Operator/OperatorServices/operator-services.css` **[NEW]** (Added styles for operator services management view)
  - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx` (Added "My Services" navigation link in operator sidebar)
  - `fair-fly/src/App.jsx` (Mounted `/operator/services` route)
- **Client Marketplace & Booking Enforcement (`fair-fly`)**:
  - `fair-fly/src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx` (Added Branch Location sidebar filter with dynamic branch options & service count badges, active filter pills, and "Branch Exclusive" badge on service cards)
  - `fair-fly/src/pages/ClientSide/ClientServiceItem/ServiceItemPage.jsx` (Added Branch Exclusivity Banner and passed locked branch props to booking modals)
  - `fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx` (Enforced branch locking on service request modal: automatically preselects and disables branch dropdown for branch-exclusive services with an explanatory note)
  - `fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx` (Enforced branch locking on appointment scheduling form: preselects and disables branch selection when booking for a branch-exclusive service)

### Summary of Changes
- Implemented an end-to-end Qualified Operator subsystem enabling operators to apply for qualification, Super Admins to review and approve/revoke qualifications, and qualified operators to publish branch-exclusive services.
- Added comprehensive Branch Location filtering in the Client Services Marketplace to allow clients to filter services by branch while clearly badging branch-exclusive offerings.
- Enforced strict branch booking and active service assignment on both client modals and backend controllers, guaranteeing client requests for branch-exclusive services are locked exclusively to the owning operator.

---

## [2026-08-26] Fix: Chat Attachment Upload Token Reference

### Files Modified
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Destructured `userToken` from `useAuthContext()` and added safe fallback to `user.getIdToken()` for chat attachment uploads)

### Summary of Changes
- Resolved `ReferenceError: userToken is not defined` when uploading files or images in the chat messaging module.
>>>>>>> 9db8a74c359953f71a219e1370975e552cfe86a7

---

## [2026-08-27] Feature: Centered Navbar Navigation with Active Highlighting & Client Password Reset Verification

### Files Created & Modified
- **Frontend Navigation & Password Reset (`fair-fly`)**:
  - `fair-fly/src/components/Shared/Navbar/Navbar.jsx` (Restructured desktop navbar into 3 sections: left brand logo, centered navigation links between Services and About (`Services`, `Business System`, `Guidelines`, `Model`, `About`), and right actions (`Login` beside `Apply for Franchise`); added scroll-spy with `IntersectionObserver` on `/home` and active highlight classes on click and scroll)
  - `fair-fly/src/components/Shared/Navbar/navbar.css` (Added styling for `.nav-left`, `.nav-center`, `.nav-right`, `.linkNav.active`, `.linkAbout.active`, `.linkLogin.active`, and mobile drawer `.nav-mobile-item.active`)
  - `fair-fly/src/pages/Index/Login/login.jsx` (Updated "Forgot password?" link to navigate to `/forgot-password`)
  - `fair-fly/src/pages/Index/ResetPassword/ResetPassword.jsx` **[NEW]** (Created dedicated password reset page strictly for Client accounts with live email format validation, client-only notice callout, and a verification confirmation view with a 60-second resend cooldown timer)
  - `fair-fly/src/pages/Index/ResetPassword/reset-password.css` **[NEW]** (Added modern SaaS styling using REM tokens, cards, and accessible focus states)
  - `fair-fly/src/services/authService.js` **[NEW]** (Added `requestClientPasswordReset` calling backend `/api/auth/client-forgot-password`)
  - `fair-fly/src/App.jsx` (Mounted `/forgot-password` and `/reset-password` unauthenticated routes)
- **Backend Authentication & Role Verification (`fly-api`)**:
  - `fly-api/src/controllers/authController.js` **[NEW]** (Implemented `requestClientPasswordReset` validating email format, verifying user existence in Firestore `users`, enforcing client-only role check rejecting non-client accounts with clear notices, and validating Firebase Auth credentials)
  - `fly-api/src/routes/authRoutes.js` **[NEW]** (Created `/client-forgot-password`, `/forgot-password`, and `/reset-password` route aliases protected with `publicRateLimiter`)
  - `fly-api/src/routes/index.js` (Mounted `/auth` routes)
  - Restarted `fly-api` server with `nodemon` to reload active in-memory routing table on port 5001.

### Summary of Changes
- Centered the main navigation buttons (`Services`, `Business System`, `Guidelines`, `Model`, `About`) in the navbar while positioning the `Login` button directly adjacent to the `Apply for Franchise` button.
- Implemented real-time active button highlighting when clicked, during route changes, and while scrolling down sections on the landing page via `IntersectionObserver`.
- Created a dedicated client-only Password Reset interface (`/forgot-password` and `/reset-password`) that enforces backend role validation to ensure only client accounts can request password resets, sending a verification email with a reset link.
- Resolved "Endpoint not found" error by restarting the `fly-api` server under `nodemon` and adding endpoint aliases.

---
<<<<<<< HEAD

=======
>>>>>>> 9db8a74c359953f71a219e1370975e552cfe86a7
## [2026-08-26] Fix: Chat Conversation Deduplication & Support Lead Navigation

### Files Modified
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Added local cache lookup to immediately switch to existing conversations before calling backend API, and cleared route navigation history state to prevent redundant conversation triggers)
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Prioritized existing admin conversation threads when resolving the assigned Support Lead card)
- `fly-api/src/controllers/chatController.js` (Enhanced `getOrCreateConversation` with bidirectional participant queries to ensure existing conversations are always retrieved and never duplicated)

### Summary of Changes
- Fixed issue where clicking "Message Support Lead" or selecting a contact created a new duplicate conversation instead of selecting the existing conversation thread.

---

## [2026-08-26] Fix: Missing Link Import in Operator Quotations

### Files Modified
- `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Imported `Link` from `react-router` for quotation detail navigation)

### Summary of Changes
- Resolved runtime crash on Operator Quotations page (`Uncaught ReferenceError: Link is not defined`).

---

## [2026-08-26] Security: Firestore & Storage Rules Configuration and Removal of makePublic

### Files Modified
- `firestore.rules` (Configured rules allowing public reads for catalog services, quick links, and branches; restricted internal resources and workflow templates strictly to Admins and Operators unless visibility is explicitly set to 'all'; enforced client/operator participant ownership on appointments, active services, chats, and tickets)
- `storage.rules` (Configured storage access rules permitting public access to public service media, restricting internal resource files and workflow documents to Admins/Operators, and scoping chat/requirement attachments to authenticated participants)
- `firebase.json` (Linked `firestore.rules` and `storage.rules` configurations)
- `fly-api/src/controllers/uploadController.js` (Removed legacy `makePublic` invocation in favor of secure token-based storage authentication)

### Summary of Changes
- Established fine-grained Firestore and Storage security rules enforcing the principle of least privilege, protecting internal operator and admin assets while leaving public service offerings accessible to clients.

---

## [2026-08-26] Enhancement: Unified Secure Backend Uploads with Access Tokens Across All Features

### Files Modified
- `fair-fly/src/components/Admin/Modals/ResourceModal/ResourceForm.jsx` (Migrated direct client-side Firebase storage uploads to `uploadFileToBackend` with authentication, increased upload limit to 25MB, and fixed permission access for operators and admins)
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Migrated chat attachments and image uploads from direct client Firebase storage to `uploadFileToBackend`)
- `fly-api/src/routes/uploadRoutes.js` (Increased multer upload limit from 10MB to 25MB to accommodate larger document and video resources)
- `fly-api/src/controllers/uploadController.js` (Updated backend size validation to 25MB and verified `firebaseStorageDownloadTokens` generation)

### Summary of Changes
- Replaced all legacy client-side `firebase/storage` uploads (`uploadBytesResumable`) in Admin Resource management and Shared Chat Messaging with the unified backend `/api/upload` endpoint.
- Ensured all uploaded materials (resources, documents, videos, chat images, workflow files) are stamped with `firebaseStorageDownloadTokens` metadata and return tokenized URLs, resolving permission errors when operators and admins access files.

---

## [2026-08-26] Fix: Undefined Function Reference in Operator Resources Hub

### Files Modified
- `fair-fly/src/pages/Operator/OperatorResources/OperatorResources.jsx` (Fixed `getFileTypeInfo` reference error by aliasing to `getFileMeta`, added `handlePreview` handler for quick document previewing in a new tab, and ensured proper list view CSS class binding)

### Summary of Changes
- Resolved runtime crash on the Operator Resources Hub page (`Uncaught ReferenceError: getFileTypeInfo is not defined`).

---

## [2026-08-26] Enhancement: Debouncing & Infinite Scroll Load More in Client Service Store

### Files Modified
- `fair-fly/src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx` (Added 300ms search debouncing, progressive 6-records-per-batch loading with IntersectionObserver infinite scroll on scroll down, progress indicator bar, manual load more button, and renamed "Service Fee" label to "Fee")
- `fair-fly/src/components/Client/ClientServicesMarketplace/client-services-marketplace.css` (Added styles for `.shopping-load-more-section`, progress bar track/fill, load more button, infinite sentinel, and end-reached badge)

### Summary of Changes
- Implemented responsive debounced search (300ms) and Facebook-style automatic infinite scroll loading for services in the Client Service Marketplace.
- Added catalog progress indicator displaying `Showing X of Y services` with a progress bar and manual load button fallback.
- Renamed the service card price label from "Service Fee" to "Fee".

---

## [2026-08-26] Enhancement: Service Thumbnail in Admin View Service Header

### Files Modified
- `fair-fly/src/components/UI/RecordDetailLayout/RecordDetailLayout.jsx` (Added `thumbnail` and `avatarIcon` props with image error handling and category fallback rendering)
- `fair-fly/src/components/UI/RecordDetailLayout/record-detail-layout.css` (Added styling for `.record-header-thumbnail-wrapper`, thumbnail image, and gradient fallback icon container)
- `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx` (Passed service cover image thumbnail and category icon to `RecordDetailLayout`)

### Summary of Changes
- Enhanced the Admin View Service page (`/admin/services/:id`) to display the service's cover thumbnail directly in the page header next to the service title and category badge, with graceful fallback to the category icon if no image is present.

---

## [2026-08-26] Fix: Firebase Storage Download Tokens & Resilient Image Fallbacks

### Files Modified
- `fly-api/src/controllers/uploadController.js` (Added `firebaseStorageDownloadTokens` UUID token generation and tokenized `&token=` download URLs to grant public access on buckets with uniform bucket-level access)
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Added graceful `onError` fallback on service table thumbnails)
- `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx` (Added graceful `onError` fallback on hero banner cover image)
- `fair-fly/src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx` (Added graceful `onError` fallback on marketplace product cards)
- `fair-fly/src/pages/ClientSide/ClientServiceItem/ServiceItemPage.jsx` (Added graceful `onError` fallback on product detail gallery images)

### Summary of Changes
- Fixed 403 Forbidden permissions on uploaded documents/images by generating standard Firebase Storage download tokens during Admin SDK upload.
- Added graceful `onError` fallback handling across all service card images, banners, and thumbnails so broken/legacy images seamlessly display category fallback icons rather than broken `alt` text.

---

## [2026-08-26] Fix: Cache Method Name in Admin Controller and Added `del` Alias

### Files Modified
- `fly-api/src/services/cacheService.js` (Added `.del()` method alias to the `Cache` class pointing to `.delete()`)
- `fly-api/src/controllers/adminController.js` (Updated cache invalidation calls to `userCache.delete(id)`)

### Summary of Changes
- Resolved runtime `userCache.del is not a function` error when updating administrator details or deleting accounts.

---

## [2026-08-26] Fix: Document Path Format in Admin Controller

### Files Modified
- `fly-api/src/controllers/adminController.js` (Corrected `updateToDatabase` and `deleteFromDatabase` path arguments from separated `(collection, id)` to full document path string `${COLLECTIONS.USERS}/${id}`)

### Summary of Changes
- Resolved 500 Internal Server Error when updating or deleting administrator accounts (`Value for argument "documentPath" must point to a document, but was "users"`).

---

## [2026-08-26] Enhancement: Debounced Search & Infinite Scroll for Assigned Branch Operators

### Files Modified
- `fair-fly/src/components/Admin/Modals/AdminModal/AdminForm.jsx` (Added 300ms search debouncing, 5-records-per-batch infinite scrolling on scroll down, load more indicator with manual trigger button, and clear search action)

### Summary of Changes
- Limited displayed operator records to 5 at a time with social-media-style infinite scroll loading when scrolling through the branch operators assignment list in the Admin modal, preserving all selection states across filters and paginated slices.

---

## [2026-08-26] Fix: Undefined `result` in Client Appointments Page Filter

### Files Modified
- `fair-fly/src/pages/ClientSide/ClientAppointments/ClientAppointmentsPage.jsx` (Fixed `ReferenceError: result is not defined` by restoring variable initialization and `activeTab` filter checks inside `useMemo`)

### Summary of Changes
- Resolved runtime crash on Client Appointments page when filtering or rendering appointments.

---

## [2026-08-26] Feature: Extended Admin-to-Operator Assignment Workflow

### Files Modified
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Added dynamic fetching and rendering of the Dedicated Support Contact Card for branch operators with direct chat action)
- `fair-fly/src/pages/Operator/OperatorDashboard/operator-dashboard.css` (Added responsive styling for `.op-support-lead-card`, avatars, online badges, and CTA button)
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Added deep-linking support for `location.state.partnerId` to automatically open or create direct conversation threads from external triggers)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Added "Ticket View Scope" filter chips to toggle between all branch tickets and tickets belonging specifically to the admin's assigned branch operators)
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Added "Operator View Scope" filter chips to filter the operators table, plus "Assigned to You" branch badges)
- `fair-fly/src/components/Shared/Messaging/NewChatModal/NewChatModal.jsx` (Prioritized assigned branch operators to the top of the contact list for admins and rendered dedicated "Assigned Branch" indicator badges)

### Summary of Changes
- Operators now have immediate visibility of their designated Head Office Support Lead directly on their dashboard with 1-click direct messaging.
- Admins with assigned branch operators can quickly isolate tickets, operators, and chat contacts scoped to their assigned franchises.

---

## [2026-08-23] Fix: Safe Input Type Fallback in Admin Service Detail Page

### Files Modified
- `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx` (Safely resolved requirement `inputType`, `type`, and attachment fields with resilient fallbacks before string capitalization; added support for updating carousel images on edit)

### Summary of Changes
- Resolved `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` when viewing services that have legacy requirements or undefined `inputType` values.

---

## [2026-08-23] Fix: Landing Page Navbar Responsiveness & Mobile Slide Drawer

### Files Modified
- `fair-fly/src/components/Shared/Navbar/Navbar.jsx` (Added mobile drawer toggle state, route-change auto-closing, body scroll lock, compact "Apply" action button, and hamburger toggle button with FontAwesome icons)
- `fair-fly/src/components/Shared/Navbar/navbar.css` (Added responsive layout rules for desktop vs tablet/mobile breakpoints `60rem`, styled `.nav-mobile-drawer`, `.nav-mobile-backdrop`, `.nav-mobile-links`, and smooth sliding transitions using REM tokens)

### Summary of Changes
- Resolved navbar overflow on smaller screens by transitioning desktop links into a slide-down mobile navigation drawer with backdrop blur.
- Provided convenient quick-access to Services, Business System, Guidelines, Business Model, About, Login, and Franchise Application modal across all screen sizes.

---

## [2026-08-23] Landing Page: Integrated Business System Presentation (DO-52-000)

### Files Created & Modified
- **New Modular Components & Styles (`fair-fly`)**:
  - `fair-fly/src/components/Landing/BusinessSystem/BusinessSystem.jsx` **[NEW]** & `business-system.css` **[NEW]** (Showcases ISO: 9001-2000 Ready Quality Management System standards, procedure manuals, online cloud database, virtual office capabilities, and scalable high-inquiry operations)
  - `fair-fly/src/components/Landing/ServiceGuidelines/ServiceGuidelines.jsx` **[NEW]** & `service-guidelines.css` **[NEW]** (Interactive tabbed fulfillment pipelines detailing step-by-step guidelines, pricing breakdowns, and operator profit margins for Passport Processing, PSA/NSO Documents, Airline Ticketing, and Tour Packages)
  - `fair-fly/src/components/Landing/BusinessModel/BusinessModel.jsx` **[NEW]** & `business-model.css` **[NEW]** (Illustrates the asset-light, zero-inventory business model, upfront cash-basis cashflow, skill-as-a-product philosophy ["Paper to Plane"], and FairFly modern office vs conventional retail comparison)
  - `fair-fly/src/components/Landing/TrainingComparison/TrainingComparison.jsx` **[NEW]** & `training-comparison.css` **[NEW]** (Highlights the FairFly Academy transferring 29 years of industry expertise into an intensive 2-month training program vs costly trial-and-error)
- **Landing Page & Navigation (`fair-fly`)**:
  - `fair-fly/src/pages/Index/Landing/Landing.jsx` & `landing.css` (Assembled presentation sections, enhanced hero section with trust badges and metric trust strip)
  - `fair-fly/src/components/FranchiseSection/FranchiseSection.jsx` (Enriched franchise value proposition, stats, and steps with ISO QMS and 2-month training academy highlights)
  - `fair-fly/src/components/Shared/Navbar/Navbar.jsx` & `navbar.css` (Added smooth-scroll navigation links for Services, Business System, and Guidelines)
  - `fair-fly/src/components/Shared/Services/Services.jsx` & `fair-fly/src/components/UI/FooterCard/FooterCard.jsx` (Converted class attributes to className)

### Summary of Changes
- Translated the entire 17-slide Business System Presentation into modern, responsive, and SEO-friendly landing page sections adhering strictly to `styleguide.md`.
- Maintained zero emojis across all newly created UI elements (using FontAwesome icons and REM spacing throughout).

---

## [2026-08-23] Fix: Aligned Frontend Service Endpoints with Backend Routes

### Files Modified
- `fair-fly/src/services/adminService.js` (Updated `/api/admin/admins` to `/api/admins`)
- `fair-fly/src/services/resourceService.js` (Updated `/api/services/resources` to `/api/resources`)
- `fly-api/src/routes/index.js` (Added backward compatibility alias mappings for `/api/admin/admins` and `/api/services/resources`)

### Summary of Changes
- Resolved 404 Not Found errors when fetching admins (`GET /api/admins`) and resource materials (`GET /api/resources`). Added dual-route aliases in Express router for robustness.

---

## [2026-08-23] Fix: Undefined `handleSubmitResource` Reference in Admin Resources Page

### Files Modified
- `fair-fly/src/pages/Admin/AdminResources/ResourcesContent.jsx` (Fixed `<ResourceModal onSubmit={handleFormSubmit} />` prop binding, restored `ResourceModal` import, and applied friendly error translation via `toFriendlyMessage`)

### Summary of Changes
- Resolved the runtime `ReferenceError: handleSubmitResource is not defined` error when opening or rendering the Admin Resources page by correctly passing the `handleFormSubmit` handler and using human-friendly error toasts.

---

## [2026-08-23] Service Store E-Commerce Product Page, Carousel Images, onSnapshot to GET Migration, Search Debouncing, and Friendly Toasts

### Files Modified & Created
- **Service & Product Page**:
  - `fair-fly/src/pages/ClientSide/ClientServiceItem/ServiceItemPage.jsx` (NEW: Created full e-commerce service details page with multi-image gallery carousel, turnaround badges, requirement checklists with download links, procedure steps roadmap, and booking action CTAs)
  - `fair-fly/src/pages/ClientSide/ClientServiceItem/service-item-page.css` (NEW: Added modern responsive styles for e-commerce product layout)
  - `fair-fly/src/App.jsx` (Added `/client/services/:serviceId` route)
  - `fair-fly/src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx` (Updated cards to link directly to the service item page and support quick request action)
  - `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceForm.jsx` (Added multi-image carousel upload manager supporting up to 5 photos with preview badges and individual deletion)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Integrated `service_carousel` file uploads to backend storage)
  - `fly-api/src/controllers/serviceController.js` & `fly-api/src/routes/serviceRoutes.js` (Added `GET /api/services/:id` and supported `carouselImages` array)
  - `fly-api/src/controllers/operatorController.js` & `fly-api/src/routes/operatorRoutes.js` (Added `GET /api/operators` and `GET /api/operators/:id`)

- **Services Layer & Firestore `onSnapshot` Migration**:
  - `fair-fly/src/services/` (Created `adminService.js`, `serviceService.js`, `ticketService.js`, `resourceService.js`, `appointmentService.js`, `quotationService.js`, `quickLinkService.js`, `workflowService.js`)
  - `fair-fly/src/pages/Admin/AdminAdmins/AdminsContent.jsx` & `AdminDetailPage.jsx` (Migrated from `onSnapshot` to `adminService` GET requests)
  - `fair-fly/src/pages/Admin/AdminResources/ResourcesContent.jsx` & `fair-fly/src/pages/Operator/OperatorResources/OperatorResources.jsx` (Migrated to `resourceService` GET requests)
  - `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` & `TicketDetailPage.jsx` (Migrated to `ticketService` GET requests)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` & `OperatorTicketDetailPage.jsx` (Migrated to `ticketService` GET requests)
  - `fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx` (Migrated catalog dropdown from `onSnapshot` to `fetchServices`)
  - `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx` (Migrated catalog listing from `onSnapshot` to `fetchServices`)
  - `fair-fly/src/pages/ClientSide/ClientAppointments/ClientAppointmentsPage.jsx` (Migrated appointments list from `onSnapshot` to `fetchAppointments`)
  - `fair-fly/src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx` (Migrated workflows selection from `onSnapshot` to `fetchWorkflowTemplates`)

- **Search Debouncing & Chat Infinite Scroll**:
  - `fair-fly/src/hooks/useDebounce.js` (NEW: Reusable 300ms debounce hook)
  - `fair-fly/src/components/Shared/Messaging/NewChatModal/NewChatModal.jsx` (Added debounced contact search and infinite scroll pagination on scroll down)
  - Applied search debouncing across `MessagesPage.jsx`, `ClientServicesMarketplace.jsx`, `OperatorTicketsContent.jsx`, `OperatorQuotations.jsx`, `OperatorAppointments.jsx`, `OperatorInquiryForms.jsx`, `OperatorsContent.jsx`, `ServiceContent.jsx`, `FranchiseContent.jsx`, `HistoryContent.jsx`, `QuickLinksContent.jsx`, and `AdminWorkflowTemplates.jsx`.

- **Friendly User-Facing Error Messages**:
  - `fair-fly/src/utils/friendlyErrors.js` (NEW: Maps technical Firebase auth and backend error codes into clear, polite messages)
  - Applied friendly toast messages across `login.jsx`, `Register.jsx`, `ClientServiceRequestModal.jsx`, `ClientAppointmentForm.jsx`, `OperatorTicketsContent.jsx`, `OperatorTicketDetailPage.jsx`, `OperatorQuotations.jsx`, `OperatorAppointments.jsx`, and `OperatorsContent.jsx`.

### Summary of Changes
- Implemented an e-commerce style Service Product Page (`/client/services/:serviceId`) with an interactive image gallery carousel and booking actions.
- Migrated all tabular and form catalog Firestore `onSnapshot` subscriptions to optimized REST GET endpoints while maintaining real-time listeners for live streams.
- Introduced a central `/services` API layer, search debouncing, infinite scroll pagination, and friendly error toasts throughout the platform.

---

### Files Modified
- `fair-fly/src/pages/ClientSide/ClientDashboard/client-dashboard.css` (Added vertical flex column with `2.25rem` gap to `.client-dashboard-page`, enlarged action cards padding and hover elevation, removed cramped margins)
- `fair-fly/src/pages/ClientSide/ClientLayout/client-layout.css` (Increased `.client-portal-main` padding to `1.75rem 1.75rem 4rem` and gap to `2rem`)
- `fair-fly/src/components/Client/ClientServicesMarketplace/client-services-marketplace.css` (Added clear section separation border-top and `1.75rem` padding-top for Travel Services Store)

### Summary of Changes
- Resolved cramped layout issues across the Client Portal by expanding vertical whitespace between the Welcome Hero header, Quick Action cards grid, and the Travel & Document Services Store catalog.

---

## [2026-08-23] Fix: "Perform Workflow Procedure" Button Styling in Operator Dashboard

### Files Modified
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Updated button className to `.op-perform-procedure-btn` with icon styling)
- `fair-fly/src/pages/Operator/OperatorDashboard/operator-dashboard.css` (Added dedicated gradient styling, padding, shadows, and hover animations for `.op-perform-procedure-btn`)
- `fair-fly/src/pages/Operator/OperatorResources/OperatorResources.jsx` (Renamed `.op-view-btn` to `.op-resources-view-btn` to prevent CSS class name collision)
- `fair-fly/src/pages/Operator/OperatorResources/operator-resources.css` (Scoped grid/list view button rules to `.op-resources-view-btn`)

### Summary of Changes
- Fixed a CSS class collision where `.op-view-btn` from `operator-resources.css` overrode and collapsed the "Perform Workflow Procedure" button into a 2rem square. The action button is now styled with a primary purple gradient, proper padding, and hover elevation.

---

## [2026-08-23] Fix: Modal Auto-Closing via ApiCaller Callbacks

### Files Modified
- `fair-fly/src/components/UI/ModalBase/BaseModal.jsx` (Enabled programmatic `closeModal()` invocations from callbacks while protecting overlay backdrop clicks during loading)
- `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` (Integrated `createModalRef.current.closeModal()` directly within `ApiCaller`'s `successCallback`)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Integrated `createModalRef.current.closeModal()` directly within `ApiCaller`'s `successCallback`)

### Summary of Changes
- Resolved the issue where ticket modals remained open after submission by utilizing `ApiCaller`'s native `successCallback`, `errorCallback`, and `setIsLoading` parameters.

---

## [2026-08-23] Operator Side Ticketing: Auto-Populate Operator UID & UI Refinements

### Files Modified
- `fly-api/src/controllers/ticketController.js` (Updated `createTicket` to resolve and store authentic operator account UIDs from `/users`, enriching tickets with real branch details from Firestore)
- `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx` (Removed manual Operator-ID and personal info fields on the operator side; added auto-populated Submitter Context banner displaying branch name, email, and UID badge; added registered operator dropdown for admins)
- `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` (Auto-filled `operatorId` from authenticated user UID and updated branch ticket filtering and search queries)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Subscribed to registered operators from Firestore `/users` and wired dropdown data to `CreateTicketModal`)
- `fair-fly/src/components/Admin/Tickets/TicketTable.jsx` (Refined Operator column to display branch name, initials avatar, and stylized monospaced UID badge with tooltip)
- `fair-fly/src/components/Admin/Tickets/TicketThread.jsx` (Updated thread metadata header to display Branch name and Firestore Operator UID code chip)
- `fair-fly/src/components/Admin/Tickets/tickets.css` (Added styles for `.operator-submitter-card`, `.ticket-op-uid-pill`, and `.ticket-uid-code`)

### Summary of Changes
- Streamlined operator ticket creation by eliminating manual ID entry and auto-populating tickets with the operator's authentic Firestore UID from `/users`.
- Modernized ticket tables, modals, and thread headers to display branch identity and account UIDs consistently.

---

## [2026-08-17] Breadcrumbs Navigation for Messages Page

### Files Modified
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Imported and integrated `<Breadcrumbs>` with role-aware path routing (`Dashboard > Direct Messages` or `Home > Direct Messages > Partner Name`))
- `fair-fly/src/pages/Shared/MessagesPage/messages-page.css` (Added layout spacing gap for the breadcrumb header)

### Summary of Changes
- Standardized navigation on the Messages page by adding breadcrumb navigation across Admin, Operator, and Client views.

---

## [2026-08-17] AppNavbar Logo Visibility: Client Portal Only

### Files Modified
- `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` (Restricted the FairFly logo and portal title brand rendering to the Client portal (`{isClient && ...}`), removing duplicate logo display from the Admin and Operator top navbars)
- `fair-fly/src/components/UI/AppNavbar/app-navbar.css` (Updated `.app-nav-brand` class selector rules)

### Summary of Changes
- Removed the FairFly brand logo and text from the top navbar in the Admin and Operator portals (which already display the brand in the primary sidebar), while keeping it clearly displayed in the Client portal navbar.

---

## [2026-08-17] Fix: Prevent Window Jump on Chat Selection (Removed autoFocus & scrollIntoView)

### Files Modified
- `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` (Removed `autoFocus` on the chat input field and removed `scrollIntoView` effects so browsers don't force-scroll the page down when opening a chat session)
- `fair-fly/src/pages/Shared/MessagesPage/messages-page.css` (Adjusted `.messages-page-wrapper` to `calc(100vh - 8rem)` so the messaging container fits cleanly within the dashboard layout without vertical scrollbar overflow)

### Summary of Changes
- Completely resolved the issue where selecting a chat session in the admin or operator side caused the browser window/page to scroll down.

---

## [2026-08-17] Fix: FilterChipGroup Event Handling & Case-Insensitive Status Filtering

### Files Modified
- `fair-fly/src/components/UI/FilterChipGroup/FilterChipGroup.jsx` (Added prop alias resilience for `activeChip`/`activeValue`/`value` and `onChipChange`/`onChange`/`onSelect`, plus automatic formatted `(count)` rendering when `count` property is provided on chip objects)
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Fixed `FilterChipGroup` prop bindings to `activeChip` and `onChipChange`, fixed case-sensitive mismatch between `"Active"`/`"Disabled"` chip values and lowercase state matching, and added page-reset `setCurrentPage(1)` on filter selection)
- `fair-fly/src/pages/Admin/AdminAdmins/AdminsContent.jsx` (Fixed `FilterChipGroup` prop bindings to `activeChip` and `onChipChange`, standardized case-insensitive filtering for status, and reset `currentPage` on chip click)

### Summary of Changes
- Resolved the issue where clicking filter chips on the Operators and Administrators tables failed to filter rows or update the active chip visual state.

---

## [2026-08-17] Operator Branch Assignment for Support Administrators

### Files Modified
- `fly-api/src/controllers/adminController.js` (Updated `createAdmin` and `updateAdmin` to parse and persist `assignedOperators` array of branch operator UIDs)
- `fair-fly/src/components/Admin/Modals/AdminModal/AdminForm.jsx` (Added interactive branch operator checkbox selector with live branch search filter, item count indicators, and "Select All" / "Clear All" bulk actions)
- `fair-fly/src/pages/Admin/AdminAdmins/AdminsContent.jsx` (Added "Assigned Branches" column with real-time branch name resolution and badge pills: `All Branches (Super Admin)`, branch name chips, or `None Assigned`)
- `fair-fly/src/pages/Admin/AdminAdmins/AdminDetailPage.jsx` (Added dedicated "Assigned Branch Operators" panel with branch cards, contact info, and one-click "Manage Assignments" edit trigger)
- `fair-fly/src/pages/Admin/AdminAdmins/admin-admins.css` (Added styling for operator assignment selector cards, pills, and detail view cards)

### Summary of Changes
- Super Admins can now assign specific branch operators to each Support Administrator during creation or profile edits.
- The Admins table and Admin Detail Page display the assigned branches clearly with real-time data sync from Firestore.

---

## [2026-08-17] Phase 4: 1-to-1 Messaging System (WhatsApp Web Style) & Head Office Announcements

### Files Created & Modified
- **Backend Messaging Layer (`fly-api`)**:
  - `fly-api/src/controllers/chatController.js` **[MODIFIED]** (Implemented `getContacts` with role permissions filtering, `getOrCreateConversation` enforcing allowed communication channels [Client<->Operator, Operator<->Admin, Admin<->Admin, blocking Client<->Admin], `getUserConversations`, `postMessage` with recipient in-app notifications, `markConversationRead`, `getAnnouncements`, and `postAnnouncement` restricted to Admins)
  - `fly-api/src/routes/chatRoutes.js` **[MODIFIED]** (Added `/contacts`, `/conversations`, `/conversations/:id/messages`, `/conversations/:id/read`, and `/announcements` routes)
  - `fly-api/src/services/notificationService.js` (Added `notifyAllOperators` helper for broadcasting announcement notifications)
- **Frontend Messaging & Modals (`fair-fly`)**:
  - `fair-fly/src/services/chatService.js` **[MODIFIED]** (Implemented `getEligibleContacts`, `getOrCreateDirectChat`, `sendDirectMessage`, `markChatAsRead`, `subscribeToConversations`, `subscribeToMessages`, `subscribeToAnnouncements`, and `postAnnouncement`)
  - `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` **[NEW]** & `messages-page.css` **[NEW]** (Full 2-pane WhatsApp Web-style messaging experience with conversation list, real-time unread badges, relative timestamps, search filter, message bubbles with check status, file attachments [5MB limit for images/PDFs/docs], enter-to-send, and clean empty state)
  - `fair-fly/src/components/Shared/Messaging/NewChatModal/NewChatModal.jsx` **[NEW]** & `new-chat-modal.css` **[NEW]** (Contact selector modal filtered by permissions with role badges and branch indicators)
  - `fair-fly/src/components/Shared/AnnouncementsModal/AnnouncementsModal.jsx` **[NEW]** & `announcements-modal.css` **[NEW]** (Rebranded Team Chat into broadcast Announcements: Admins can post with Priority tags and broadcast notifications; Operators have read-only feed)
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` (Replaced Team Chat with Announcements button and modal, added 4th NavLink for Messages in Client navbar and mobile drawer)
  - `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Added Messages link to Admin sidebar)
  - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx` (Added Messages link to Operator sidebar)
  - `fair-fly/src/App.jsx` (Mounted `/client/messages`, `/operator/messages`, and `/admin/messages` routes)

### Summary of Changes
- **Live 1-to-1 Messaging**: Built a 2-pane WhatsApp Web-style direct messaging portal across Client, Operator, and Admin interfaces with real-time sync, file sharing, and unread counters.
- **Strict Role-Based Communication**: Enforced communication boundaries: Clients talk only to Operators, Operators talk to Admins and Clients, Admins talk to Admins and Operators (Client-to-Admin direct messaging strictly forbidden).
- **Broadcast Announcements**: Transformed Team Chat into an administrative broadcast hub with priority badges (`Normal`, `Important`, `Urgent`) and automated operator notifications.

---

## [2026-08-17] Resources Layout Alignment & Standardization

### Files Modified
- `fair-fly/src/pages/Admin/AdminResources/ResourcesContent.jsx` (Standardized page hierarchy: `<main className="resources-page page-fade-in">` -> `<Breadcrumbs>` -> `<PageHeader>` -> `<section className="resources-summary-grid">` -> `<section className="card resources-table-card">`, added `Pagination` component and paginated list slicing)
- `fair-fly/src/pages/Admin/AdminResources/admin-resources.css` (Removed redundant `padding: 1.5rem` from root container, standardized spacing with `gap: 1.25rem`, aligned `.table-toolbar`, `.search-box`, and `.filter-select` controls with other Admin pages)
- `fair-fly/src/pages/Operator/OperatorResources/OperatorResources.jsx` (Added `<Breadcrumbs>` and `<PageHeader>`, wrapped in semantic `<main className="operator-resources-page page-fade-in">`)
- `fair-fly/src/pages/Operator/OperatorResources/operator-resources.css` (Removed redundant outer padding, standardized spacing)

### Summary of Changes
- Eliminated double padding on Admin and Operator Resources pages to perfectly match the standard layout padding from `AppLayout` (`1.25rem 2rem 2rem 2rem`).
- Enclosed the search bar, filter dropdowns, `DataTable`, and `Pagination` inside a standard `<section className="card resources-table-card">` with standard card padding.

---

## [2026-08-16] Phase 3: Resources System (Marketing, Documentation & Help Materials)

### Files Created & Modified
- **Backend Resource Layer (`fly-api`)**:
  - `fly-api/src/controllers/resourceController.js` **[NEW]** (Implemented `createResource`, `getResources`, `getResourceById`, `updateResource`, `deleteResource`, and `recordDownload` with automatic operator notification triggers upon new upload)
  - `fly-api/src/routes/resourceRoutes.js` **[NEW]** (Created `/api/resources` endpoints with role-based access control: Admin only for mutations, all authenticated users for reading and downloading)
  - `fly-api/src/routes/index.js` (Registered `/resources` route)
- **Admin Portal Components & Modals (`fair-fly`)**:
  - `fair-fly/src/components/Admin/Modals/ResourceModal/ResourceModal.jsx` **[NEW]** & `ResourceForm.jsx` **[NEW]** & `resource-modal.css` **[NEW]** (Interactive drag-and-drop file upload modal with Firebase Storage integration, progress indicator, file size limit guards [20MB for video, 10MB for documents], category dropdown, suggested tags `#Promo`, `#SocialMedia`, `#SOP`, `#Training`, and audience selector)
  - `fair-fly/src/pages/Admin/AdminResources/AdminResources.jsx` **[NEW]** & `ResourcesContent.jsx` **[NEW]** & `admin-resources.css` **[NEW]** (Admin resource management dashboard with real-time `onSnapshot` DataTable, 4 KPI cards [Total Materials, Marketing, Docs & Guides, Total Downloads], category/tag/search filters, and edit/delete actions)
  - `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Added **Resources** navigation link to Admin sidebar)
- **Operator Portal Resource Hub (`fair-fly`)**:
  - `fair-fly/src/pages/Operator/OperatorResources/OperatorResources.jsx` **[NEW]** & `operator-resources.css` **[NEW]** (Operator-facing materials library with category filter pills, count badges, keyword search, Grid/List view switcher, file type badge icons, tag chips, preview modal for PDFs and images, and direct download buttons with backend download counter tracking)
  - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx` (Added **Resources** navigation link to Operator sidebar)
  - `fair-fly/src/App.jsx` (Registered `/admin/resources` and `/operator/resources` routes)

### Summary of Changes
- **Admin Resource Publishing**: Administrators can upload and distribute marketing materials, operational SOPs, and help templates to operators with cloud storage upload and tag metadata.
- **Operator Material Library**: Franchise operators have access to an organized, searchable library with category pills, quick previews, and single-click downloads with download analytics tracking.

---

### Files Created & Modified
- **Backend Notification Layer (`fly-api`)**:
  - `fly-api/src/services/notificationService.js` **[NEW]** (Implemented `createNotification`, `notifyAdmins`, and `notifyBranchOperators` helpers dispatching structured notifications to Firestore `notifications` collection)
  - `fly-api/src/controllers/notificationController.js` **[NEW]** (Implemented `getNotifications`, `markAsRead`, `markAllAsRead`, and `deleteNotification` endpoints with user authorization checks)
  - `fly-api/src/routes/notificationRoutes.js` **[NEW]** (Created `/api/notifications` routes protected by `verifyFirebaseToken` and rate limiter)
  - `fly-api/src/routes/index.js` (Registered `/notifications` route)
  - `fly-api/src/controllers/appointmentController.js` (Integrated notifications on appointment creation and status update)
  - `fly-api/src/controllers/ticketController.js` (Integrated notifications on ticket creation and reply thread messages)
  - `fly-api/src/controllers/franchiseController.js` (Integrated notifications on new franchise applications)
- **Frontend Components & Real-time State (`fair-fly`)**:
  - `fair-fly/src/context/NotificationContext.jsx` **[NEW]** (Created real-time Firestore `onSnapshot` provider for current user's notifications, unread count tracking, and read/delete mutations)
  - `fair-fly/src/components/UI/NotificationBell/NotificationBell.jsx` **[NEW]** & `notification-bell.css` **[NEW]** (Built interactive bell button with animated unread badge, floating dropdown panel with `All` vs `Unread` tabs, "Mark all read" action, contextual type icons, human-readable time-ago formatting, click-to-navigate route routing, and dismissal actions)
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` (Mounted `<NotificationBell />` in the top right navbar for Admin, Operator, and Client portals)
  - `fair-fly/src/main.jsx` (Wrapped app root with `<NotificationProvider>`)
  - `fair-fly/src/index.css` (Enhanced `.status-pill` and `.icon-btn` color schemes and badge styling)

### Summary of Changes
- **Live Notifications Across Portals**: Admins, Operators, and Clients now receive instant in-app alerts when appointments are booked/updated, tickets are created/replied, and franchise applications are submitted.
- **Interactive Notification Center**: Bell icon in navbar provides a dropdown with unread badges, category filtering, unread status indicators, and direct navigation links.

---

### Files Created & Modified
- **Backend Admin Layer (`fly-api`)**:
  - `fly-api/src/controllers/adminController.js` **[NEW]** (Implemented `createAdmin`, `getAdmins`, `getAdminById`, `updateAdmin`, and `deleteAdmin` with Super Admin protection safeguards)
  - `fly-api/src/routes/adminRoutes.js` **[NEW]** (Created `/api/admins` routes protected by `verifyFirebaseToken` and `requireSuperAdmin`)
  - `fly-api/src/routes/index.js` (Registered `/admins` route)
  - `fly-api/src/middleware/auth.js` (Added `requireSuperAdmin` middleware checking `req.userDetails.isSuperAdmin === true` or `email === 'admin@gmail.com'`)
  - `fly-api/src/routes/operatorRoutes.js` (Restricted operator creation, bulk status, bulk delete, patch, and delete endpoints to Super Admin only)
- **Admin Portal Components & Pages (`fair-fly`)**:
  - `fair-fly/src/components/UI/AppSidebar/AppSidebar.jsx` (Differentiated `Super Administrator` vs `Support Administrator` role badge in sidebar profile footer)
  - `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Dynamically rendered `Admins` navigation tab exclusively for Super Admin)
  - `fair-fly/src/pages/Admin/AdminAdmins/AdminAdmins.jsx` **[NEW]** (Outlet wrapper for Admins management)
  - `fair-fly/src/pages/Admin/AdminAdmins/AdminsContent.jsx` **[NEW]** & `admin-admins.css` **[NEW]** (Real-time Firestore `onSnapshot` DataTable listing all administrators, Super Admin gold crown badge vs Support Admin badge, KPI summary cards, and search/filters)
  - `fair-fly/src/pages/Admin/AdminAdmins/AdminDetailPage.jsx` **[NEW]** (Detailed admin profile view, system access summary, activity audit overview, and status toggle/delete handlers)
  - `fair-fly/src/components/Admin/Modals/AdminModal/AdminModal.jsx` **[NEW]** & `AdminForm.jsx` **[NEW]** (Modal form for creating and updating Support Administrator accounts)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` & `OperatorDetailPage.jsx` (Restricted operator mutation buttons so regular Support Admins can view branches, but only Super Admin can create, enable/disable, or delete operators)
  - `fair-fly/src/App.jsx` (Registered `/admin/admins` and `/admin/admins/:id` routes)

### Summary of Changes
- **Super Admin vs Support Admin Distinction**: The primary administrator (`admin@gmail.com`) is designated as `isSuperAdmin: true`.
- **Privilege Separation**:
  - Super Admin can create, edit, disable, and delete Support Admins, as well as create and configure Operators.
  - Support Admins can view branch operators and handle day-to-day operations but cannot create/disable operators or manage other admins.
- **Dedicated Admins Management**: Super Admin has a dedicated **Admins** tab in the sidebar with live Firestore sync, profile view, and audit overview.

---

## [2026-08-16] Admin Service Catalog Enhancements & Client "Airbnb/Shopping UI" Marketplace

### Files Created & Modified
- **Backend Service Layer (`fly-api`)**:
  - `fly-api/src/routes/serviceRoutes.js` (Updated `SERVICE_ALLOWED_FIELDS` to allow `coverImage`, `coverPhoto`, `coverPhotoUrl`, `tags`, `category`, `description`, and `featured`)
  - `fly-api/src/controllers/serviceController.js` (Updated `createService` and `updateService` to properly sanitize and persist category, tags array, cover image URL, description, and featured boolean flag)
- **Admin Portal Components & Modals (`fair-fly`)**:
  - `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceForm.jsx` (Redesigned with Cover Photo file dropzone/preview with remove/change controls, Category select with custom input, interactive Tag chip input with suggested tags `#Visa`, `#Passport`, `#Express`, `#DFA`, etc., Description textarea, and Featured toggle switch)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Added batch upload for `pendingCoverFile` to Firebase Storage under `service_covers/`, updated DataTable columns to show thumbnail cover images, category pills, tags badges, and expanded multi-field search)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx` & `service-detail.css` (Redesigned the entire View Service Details page with high-res cover hero banner and fallback gradient graphic, category badge overlays, marketplace spotlight badge, 4-stat KPI quick metrics cards for Price, Turnaround, Required Inputs, and Workflow Steps, formatted description panel, requirement input cards with file icons and sample attachments, and full edit/disable/delete management lifecycle)
- **Client Portal 3-Page Architecture & Navigation (`fair-fly`)**:
  - `fair-fly/src/App.jsx` (Configured `/client`, `/client/services`, `/client/tracking`, and `/client/appointments` nested routes under `ClientLayout`)
  - `fair-fly/src/pages/ClientSide/ClientLayout/ClientLayout.jsx` **[NEW]** & `client-layout.css` **[NEW]** (Created dedicated layout wrapper with `AppNavbar` and responsive container)
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` & `app-navbar.css` (Added Client NavLinks with active pill styles for **Services Store**, **Track Requests**, and **Appointments**, with mobile sub-navigation drawer)
  - `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx` (Streamlined to focus exclusively on the **Services Shopping Catalog** with welcome hero, action links, and aside filter store)
  - `fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx` **[NEW]** & `client-tracking.css` **[NEW]** (Created dedicated Service Tracking & History page with real-time `onSnapshot()` sync, 3-stat KPI summary grid, status filter tabs, search, and expandable step milestones)
  - `fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx` & `service-tracker.css` (Enhanced tracker component with cover thumbnails, category icons, branch badges, tag chips, and submitted requirements viewer)
  - `fair-fly/src/pages/ClientSide/ClientAppointments/ClientAppointmentsPage.jsx` **[NEW]** & `client-appointments.css` **[NEW]** (Created dedicated Branch Appointments page with real-time `onSnapshot()` sync, 4-stat KPI grid, status filters, appointment cards, and new booking trigger)
  - `fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx` (Connected to `POST /api/appointments`, dynamically loaded active services & branch operators, prefilled client data, and added submission state handling)
- **Backend Service Layer (`fly-api`)**:
  - `fly-api/src/controllers/appointmentController.js` (Updated `createAppointment` and `getAppointments` to support `clientUid`, `branchUid`, `branchName`, and client-scoped appointment queries)

### Summary of Changes
- **Admin Service Form (Create & Update)**: Admins can now upload a Cover Photo, select from pre-configured travel categories (or provide custom ones), manage interactive tag chips, write descriptions, and toggle featured spotlight status.
- **Admin View Service Page**: Enhanced with a cover hero banner, KPI statistics grid, category icons, tag chips, detailed metadata, and requirement attachments.
- **Client 3-Page Portal Experience**:
  1. **Services Store** (`/client`): 2-column e-commerce store with aside filter checkboxes and dropdowns.
  2. **Track Requests** (`/client/tracking`): Step-by-step fulfillment tracking for submitted service requests with live Firestore sync.
  3. **Appointments** (`/client/appointments`): Schedule and manage branch visits with live status tracking.
- **Unified Client Navigation**: Integrated active NavLinks in the Navbar with full desktop and mobile support.
- **Strict Architecture Compliance**: Followed the "Don't trust the client" model where all CUD operations route through `fly-api` endpoints and files upload securely to Firebase Storage bucket. All frontend reads use real-time `onSnapshot()` listeners without polling.

---

## [2026-08-14] KPI Layout Flex-wrap Optimization & Record Detail View Pages

### Files Modified & Refactored
- **Global Theme Styles**:
  - `fair-fly/src/index.css` (Added global `.services-summary-grid` using flexbox display, `flex-wrap: wrap`, and a flexible child base width of `18rem` and `min-width: 15rem` to accommodate card counts not divisible by 4)
- **Local Layout Styles**:
  - `fair-fly/src/pages/Admin/AdminServices/admin-services.css` (Removed redundant local grid template column column definitions and responsive media queries)
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/admin-inquiry-history.css` (Removed redundant flexbox definition overrides)

### Files Created
- **Shared Layout Components**:
  - `fair-fly/src/components/UI/RecordDetailLayout/RecordDetailLayout.jsx` & `record-detail-layout.css` (Created a reusable detail view wrapper featuring breadcrumbs, animated transitions, unified back buttons, status badge formatting, loading/error states, and action headers)
- **Admin Portal Detail Pages**:
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorDetailPage.jsx` & `operator-detail.css` (Shows operator statistics, active status alert bars, and custom recent actions log timelines with placeholder mini-charts)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceDetailPage.jsx` & `service-detail.css` (Displays catalog data, required document input icons, and workflow checklist step pipelines)
  - `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseAppDetailPage.jsx` & `franchise-app-detail.css` (Reused detail component supporting pending review action approvals and inquiry historical tracking configurations)
  - `fair-fly/src/pages/Admin/AdminTickets/TicketDetailPage.jsx` & `ticket-detail.css` (Integrates support message thread timeline logs)
- **Operator Portal Detail Pages**:
  - `fair-fly/src/pages/Operator/OperatorAppointments/AppointmentDetailPage.jsx` & `appointment-detail.css` (Shows client profiles and consultation schedule purposes)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketDetailPage.jsx` & `operator-ticket-detail.css` (Displays communication logs with head office in real-time)
  - `fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx` & `quotation-detail.css` (Allows inline editing of client rates, inclusions, and exclusions directly on the page, with status adjustments and deletion)
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx` & `inquiry-form-detail.css` (Displays prospective client inquiry intakes)

### Files Modified
- **App Routes Configuration**:
  - `fair-fly/src/App.jsx` (Registered all index layout and `:id` sub-routes cleanly underneath their parent context providers)
- **Admin Wrapper Layouts**:
  - `fair-fly/src/pages/Admin/AdminOperators/AdminOperators.jsx` (Updated to render `Outlet` inside the provider wrapper)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Added a Link-based "View Details" eye icon to row actions)
  - `fair-fly/src/pages/Admin/AdminServices/AdminServices.jsx` (Updated to render `Outlet`)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Added Link-based "View Details" row actions)
  - `fair-fly/src/pages/Admin/AdminFranchiseApps/AdminFranchiseApps.jsx` (Updated to render `Outlet`)
  - `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx` (Updated card View buttons to route directly to detail page)
  - `fair-fly/src/pages/Admin/AdminTickets/AdminTickets.jsx` (Updated to render `Outlet`)
  - `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Purged inline thread selection layout in favor of detail sub-routing)
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryHistory.jsx` (Updated to render `Outlet`)
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` (Updated cards to route to inquiry details)
- **Operator Wrapper Layouts**:
  - `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx` (Exported content component and updated wrapper to render `Outlet`)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTickets.jsx` (Updated to render `Outlet`)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` (Purged inline support threads in favor of details sub-routing)
  - `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Exported content component and updated wrapper to render `Outlet`, added View button links)
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx` (Exported content component and updated wrapper to render `Outlet`, added View details button links)
- **Backend API Routes & Controllers**:
  - `fly-api/src/controllers/quotationController.js` (Added a generic `updateQuotation` method to patch data fields dynamically)
  - `fly-api/src/routes/quotationRoutes.js` (Registered `PATCH /:id` route for updating quotations)

### Summary of Changes
- **No Redundant Listeners**: Leveraged nested route outlets to share the same Firestore snapshot listeners (`AdminProvider`/`OperatorProvider`), ensuring real-time data syncs on the detail view with zero redundant subscriptions.
- **Inline Editing**: Added robust inline editing to Operator Quotation detail pages (client details, pricing rates, inclusions, and exclusions text blocks turn into inputs).
- **Responsive Layout Design**: Aligned detail layouts with strict human design rules (no emojis, REM spacing, FontAwesome icon integration, and visual hierarchies).

---

## [2026-08-13] System Modals Redesign Completed (Style Guide & Design System Compliance)

### Files Modified & Created
- **Core Modal Foundations & Styling**:
  - `fair-fly/src/components/Admin/Modals/modal.css` (Converted hardcoded hex colors `#ffffff`, `#5865f2`, `#00a651`, `#111827`, `#6b7280`, `#f9fafb`, `#e5e7eb` to CSS variables `var(--bg)`, `var(--card-bg)`, `var(--text-dark)`, `var(--text-mid)`, `var(--purple)`, `var(--complete-green)`, `var(--border-color)`, `var(--radius-md)`, and replaced pixel sizing with REM units)
  - `fair-fly/src/components/UI/ModalBase/base-modal.css` (Updated default modal width rules: form modals expand to large desktop view `width: 75vw`, `max-width: 56rem`, `max-height: 85vh`, while confirmation modals remain compact `max-width: 26.25rem`)
- **Admin System Modals**:
  - `fair-fly/src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx` (Removed inline hardcoded hex colors and raw `px` values, enforced compact width, and adopted system `.btn-secondary` and `.btn-primary` / `.btn-danger` classes)
  - `fair-fly/src/components/Admin/Modals/ApplicationModal/ApplicationModal.jsx` (Replaced button emoticons `✓` and `✗` with FontAwesome icons `<i className="fa-solid fa-check"></i>` and `<i className="fa-solid fa-xmark"></i>`, passed `isLoading` prop to `BaseModal`, and expanded width to 56rem)
  - `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorModal.jsx` & `OperatorForm.jsx` (Set desktop width to 56rem, used `.form-column` and `.form-grid-2` layout grid, replaced hardcoded disabled colors with `var(--bg)` and `var(--text-light)`)
  - `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx` & `QuickLinkForm.jsx` (Set desktop width to 56rem, standardized inputs and select controls with core form utility classes)
  - `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceModal.jsx` & `ServiceForm.jsx` (Set desktop width to 56rem, standardized processing time row and button layouts)
  - `fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx` (Removed emojis from requirement type select options `📷`, `📄`, `✏️`, `📅`, `🔢`, replacing them with clean text labels, set desktop width to 56rem)
  - `fair-fly/src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx` (Set desktop width to 56rem, standardized attached workflow card badges and save buttons)
  - `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx` & `WorkflowForm.jsx` (Set desktop width to 56rem, standardized form grid controls and action buttons)
  - `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx` (Converted all inline style attributes to standard form utility classes `.form-column`, `.form-grid-2`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`, `.btn-primary`, `.btn-secondary`, and set desktop width to 56rem)
- **Operator System Modals**:
  - `fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx` & `add-service-modal.css` (Set desktop width to 56rem, refactored CSS to consume design tokens and REM units)
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx` & `create-inquiry-form-modal.css` (Set desktop width to 56rem, refactored CSS to consume design tokens and REM units)
- **Client System Modals**:
  - `fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx` (Removed emojis in requirement type tags, replacing them with FontAwesome icons `<i className="fa-regular fa-image"></i>`, `<i className="fa-regular fa-file-lines"></i>`, `<i className="fa-solid fa-pen-to-square"></i>`, `<i className="fa-regular fa-calendar"></i>`, `<i className="fa-solid fa-hashtag"></i>`, set desktop width to 56rem)
- **Shared Modals**:
  - `fair-fly/src/components/Shared/TeamChatModal/TeamChatModal.jsx` (Set desktop width to 56rem)
  - `fair-fly/src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx` (Set desktop width to 56rem)
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` & `app-navbar.css` (Passed compact `maxWidth="26.25rem"` to `BaseModal` logout confirmation modal so it renders neatly compact without expanding to 75vw)

### Summary of Changes
- **Strict Design System Compliance**: Replaced all hardcoded hex colors across modal styles with CSS variable tokens (`var(--purple)`, `var(--purple-dark)`, `var(--bg)`, `var(--card-bg)`, `var(--text-dark)`, `var(--text-mid)`, `var(--border-color)`, `var(--radius-md)`) and converted raw pixel dimensions to REM units.
- **Form Modals vs Confirmation Modals Sizing**: Configured form modals across Admin, Operator, Client, and Shared modules to render large and spacious on desktop screens (~75vw width, `56rem` max-width, `85vh` max-height), while maintaining compact sizing for confirmation modals (`26.25rem` max-width).
- **Emoji / Emoticon Removal**: Completely purged all emojis/emoticons (`✓`, `✗`, `📷`, `📄`, `✏️`, `📅`, `🔢`) from modal buttons, dropdown options, and requirement tags, replacing them with clean text labels or FontAwesome icons.
- **BaseModal Foundation & Loading State**: Ensured all system modals derive from `BaseModal` and handle `isLoading` states (disabling controls and rendering spinning loader indicators).
- **Production Build Verification**: Executed `npm run build` with 0 errors across 2,555 transformed modules.

### Reason
- Fulfill user request to remake all system modals according to `style-guide-components.md` guidelines with spacious form modal dimensions on desktop.

### Breaking Changes
- None.

---

## [2026-08-13] Consistent Page Layouts, Div Optimization & Semantic SEO Enhancement

### Files Modified
- **Core UI Primitives & Navigation**:
  - `fair-fly/src/components/UI/WelcomeHero/WelcomeHero.jsx` (Converted root element to `<header className="welcome-hero card">`, added eager loading and async decoding attributes to illustrations)
  - `fair-fly/src/components/UI/PageHeader/PageHeader.jsx` (Converted root element to `<header className="page-header card">`, added eager loading and async decoding attributes to header illustrations)
  - `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` (Removed redundant logo wrapper `div`, added explicit width/height and eager loading attributes to brand logo `<img>`)
  - `fair-fly/src/components/UI/AppSidebar/AppSidebar.jsx` (Added explicit width/height and eager loading attributes to brand logo `<img>`)
  - `fair-fly/src/components/Admin/FranchiseeApplication/FranchiseeCard.jsx` (Converted root element to `<article className="franchise-card">`, added lazy loading and async decoding to franchisee avatars)
- **Admin Portal Pages**:
  - `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx` (Converted root container to `<main className="dashboard page-fade-in">`, activity rows to `<article>`, chart cards to `<article>`)
  - `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Converted root container to `<main>`, grid containers to `<section>`)
  - `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, converted table container to `<section>`)
  - `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, removed redundant `.franchise-cards-container` wrapper `div`)
  - `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, removed redundant `.tickets-table-container` wrapper `div`)
  - `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, removed redundant wrapper `div`)
  - `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, converted table container to `<section>`)
  - `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx` (Converted root container to `<main>`, table card container to `<section>`)
- **Operator Portal Pages**:
  - `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Converted root container to `<main>`, active services list container to `<section>`, service cards to `<article>`)
  - `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx` (Converted root container to `<main>`, appt container to `<section>`, appt cards to `<article>`)
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx` (Converted root container to `<main>`, form card container to `<section>`, inquiry cards to `<article>`)
  - `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Converted root container to `<main>`, quotations container to `<section>`, quotation cards to `<article>`)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` (Converted root container to `<main>`, added standard `<section className="services-summary-grid">` with `KpiCard`s, removed redundant `.op-tickets-table-container` wrapper `div`)
  - `fair-fly/src/pages/Operator/OperatorQuickLinks/OperatorQuickLinks.jsx` (Converted root container to `<main>`, quicklinks container to `<section>`)
  - `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx` (Converted root container to `<main>`, history container to `<section>`)
  - `fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx` (Converted root container to `<main>`, procedure page container to `<section>`, execution step cards to `<article>`)
- **Client Portal Pages**:
  - `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx` (Converted action cards to `<article className="card client-action-card">`, service tracker card to `<section className="card client-services-card">`)

### Summary of Changes
- **Standardized Top-to-Bottom Layout Hierarchy**: Enforced uniform structure across every single page across Admin, Operator, and Client portals: `Breadcrumbs` -> `PageHeader` / `WelcomeHero` (`<header>`) -> KPI Summary Grid (`<section className="services-summary-grid">`) -> Main Content/Table Card (`<section className="card ...">`).
- **Div Wrapper & Depth Optimization**: Reduced DOM node nesting and removed unneeded wrapper `div`s (e.g. `.tickets-table-container`, `.franchise-cards-container`, `.op-tickets-table-container`), improving layout render timings and eliminating Cumulative Layout Shift (CLS).
- **Semantic HTML for SEO & Accessibility**: Replaced generic root `div` wrappers with semantic `<main>` page tags, header sections with `<header>`, card containers with `<section>`, and individual list/grid cards with `<article>`.
- **Image Performance & Optimization**: Applied performance attributes across all images:
  - Top-of-page hero graphics & navigation logos: `loading="eager" decoding="async" alt="" aria-hidden="true"` with explicit `width`/`height` reservations.
  - Avatars & card content images: `loading="lazy" decoding="async"`.
- **Build Verification**: Verified production build using `npm run build` with 0 errors across 2,555 transformed modules.

### Reason
- Fulfill user request to make page layouts consistent, optimize div usage to reduce layout shifts, enhance semantic HTML structure for SEO, and optimize image loading.

### Breaking Changes
- None.

---

### Files Modified, Deleted & Created
- **Modified Pages**:
  - `fair-fly/src/pages/ClientSide/ClientDashboard/ClientDashboard.jsx` (Migrated navigation to `AppNavbar`, integrated `WelcomeHero`, and refactored action cards/services list layout)
  - `fair-fly/src/pages/ClientSide/ClientDashboard/client-dashboard.css` (Redesigned with card grid layouts, spacing variables, and hover properties)
- **Modified Components**:
  - `fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx` (Refactored to inherit `BaseModal` and use standard forms layout)
  - `fair-fly/src/components/Client/ClientAppointmentForm/client-appointment-form.css` (Cleared custom styles in favor of core form utility classes)
  - `fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx` (Refactored to inherit `BaseModal` and use standard forms layout)
  - `fair-fly/src/components/Client/ClientServiceRequestModal/client-service-request-modal.css` (Removed slide-up overlay animations, centered components, and styled dropzones)
  - `fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx` (Polished layout wrapper)
  - `fair-fly/src/components/Client/ClientServiceTracker/service-tracker.css` (Refactored using card shadow tokens and flat border highlights)
  - `fair-fly/src/components/Client/ClientServiceTracker/Steps/Steps.jsx` (Redesigned status icons representation: `in-progress` maps to Loader spinner, `todo` maps to Circle)
  - `fair-fly/src/components/Client/ClientServiceTracker/Steps/steps.css` (Refactored using card border/background variables and added CSS keyframe spinning loader animation)
- **Deleted Folders**:
  - `fair-fly/src/components/Client/ClientNavbar` (Retired folder deleted)

### Summary of Changes
- **Navbar & Hero Integration**: Migrated the Client dashboard to use the unified `AppNavbar` spanning the full width (no sidebar offset), and integrated `<WelcomeHero>` with `/pageImages/client/dashboard.png`.
- **Card Primitives & Layout Uniformity**: Refactored the dashboard action cards ("Request Service", "Book Appointment") and the "My Active Services" container to use flat `.card` layouts, removing gradients and transition lifts.
- **BaseModal Adoption**: Updated `ClientAppointmentForm` and `ClientServiceRequestModal` to use `<BaseModal>`, standardizing layout alignment, centering, backdrop shading, and closing actions.
- **Workflow Steps Refinement**: Improved progress icons in `Steps.jsx`, showing an empty grey circle for `todo` tasks, and a spinning purple Loader icon for the active `in-progress` step.
- **Retired Files Cleanup**: Deleted the legacy `ClientNavbar` component directory.

---

## [2026-08-13] Phase 2 — Operator Portal Redesign Completed

### Files Modified, Deleted & Created
- **Modified Pages**:
  - `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx` (Migrated to `AppLayout` and `KpiCard`)
  - `fair-fly/src/pages/Operator/OperatorLayout/operator-layout.css` (Cleared obsolete CSS declarations)
  - `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Integrated `WelcomeHero` and wrapper classes)
  - `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx` (Added `PageHeader`, `Breadcrumbs`, and fixed unclosed tags)
  - `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx` (Added `PageHeader` and `Breadcrumbs`)
  - `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` (Added `PageHeader`, `Breadcrumbs`, fixed unclosed tags, and restyled `CreateQuotationModal` form elements)
  - `fair-fly/src/pages/Operator/OperatorQuickLinks/OperatorQuickLinks.jsx` (Added `PageHeader` and `Breadcrumbs`)
  - `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx` (Added `PageHeader` and `Breadcrumbs`)
  - `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx` (Added `PageHeader` and `Breadcrumbs`)
  - `fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx` (Added `Breadcrumbs` and layout refinements)
- **Modified Components**:
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx` (Cleaned layout)
  - `fair-fly/src/components/Operator/CreateInquiryFormModal/create-inquiry-form-modal.css` (Updated inline colors to use index.css variables)
  - `fair-fly/src/pages/Operator/OperatorQuotations/operator-quotations.css` (Removed linear-gradients and translateY hover transforms, added grid layout helpers)
  - `fair-fly/src/pages/Operator/OperatorTickets/operator-tickets.css` (Removed duplicate page padding and responsive media query overrides)
- **Deleted Folders**:
  - `fair-fly/src/components/Operator/OperatorSidebar` (Retired folder deleted)
  - `fair-fly/src/components/Operator/OperatorNavbar` (Retired folder deleted)

### Summary of Changes
- **Layout Shell Migration**: Rewrote `OperatorLayout.jsx` to inherit the unified `AppLayout` framework, passing operator-specific navbar/sidebar links and dynamic statistics cards.
- **Header & Breadcrumbs Integration**: Unified all Operator subpages by adding `<Breadcrumbs>` navigation and `<PageHeader>` tags rendering travel-themed illustration graphics linked to `/pageImages/operator/{page}.png`.
- **Form Modal Uniformity**: Refactored inputs and submit buttons in `CreateQuotationModal` and `CreateInquiryFormModal` to replace inline styles and custom hex codes with core styling variables (e.g. `var(--purple)`, `var(--purple-dark)`, and `.form-input`).
- **Tickets Padding Alignment**: Resolved layout inconsistency by removing double padding margins on the Tickets page, aligning its spacing perfectly with the rest of the portal.
- **Retired Assets Cleanup**: Deleted the retired legacy Operator Sidebar and Navbar component directories.

---

## [2026-08-13] Universal Scrollbar Customization & Header Layout Enhancements

### Files Modified & Created
- `fair-fly/src/index.css` (Added universal custom scrollbar styles with white tracks and purple/indigo accents)
- `fair-fly/src/components/UI/WelcomeHero/welcome-hero.css` (Updated illustration layout to use flexbox stretch with negative margins to fit container height, adjusted width to 50%, and added a left fade mask to the image)
- `fair-fly/src/components/UI/PageHeader/page-header.css` (Updated illustration layout to use flexbox stretch with negative margins to fit container height, adjusted width to 50%, and added a left fade mask to the image)
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx` (Passed dynamic `/pageImages/admin/dashboard.png` path to `WelcomeHero`)
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Passed `/pageImages/admin/services.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` (Passed `/pageImages/admin/operators.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx` (Passed `/pageImages/admin/franchise-apps.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` (Passed `/pageImages/admin/tickets.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` (Passed `/pageImages/admin/inquiry-history.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx` (Passed `/pageImages/admin/quick-links.png` to `PageHeader`)
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx` (Passed `/pageImages/admin/workflow-templates.png` to `PageHeader`)

### Summary of Changes
- **Universal Custom Scrollbar**: Added custom scrollbar styles to `index.css` applying white background scrollbar tracks and purple/indigo accent highlights (`var(--purple-light)` and `var(--purple)` on hover) globally across all scrolling layouts. Supports both WebKit engines and Firefox.
- **Flexbox Stretched Layout for Illustrations**: Updated `welcome-hero.css` and `page-header.css` to use `align-items: stretch` on flex container rows, stretching the illustration items vertically. Used negative margins on `.welcome-hero-illustration` and `.page-header-illustration` to counteract padding, causing the images to fill the parent container height naturally.
- **Fade Masks & Sizing**: Configured the illustration wrappers to take 50% width (`flex: 0 0 50%`), and applied a horizontal fade mask (`mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 100%)`) to make the illustration blend smoothly into the content area.
- **Prepared Illustration Layouts**: Linked the page illustrations dynamically under the `public/pageImages/` directory for all Admin dashboard and page headers, preparing the frontend layouts to load them seamlessly when available.
- **Created Illustration Prompts Checklist**: Delivered `illustration_prompts.md` detailing file names and highly optimized DALL-E/Midjourney image prompts for all portals.

### Reason
- Fulfill user request to prepare image layouts and prompts.

### Breaking Changes
- None.

---

## [2026-08-13] Removed Animations and Vertical Transforms from Containers

### Files Modified & Created
- `fair-fly/src/index.css` (Removed `fadeInUp` animation from `.page-fade-in` utility)
- `fair-fly/src/components/UI/KpiCard/kpi-card.css` (Removed `translateY` hover transform and transform transitions from `.kpi-card`)
- `fair-fly/src/components/Admin/StatCards/stat-cards.css` (Removed `translateY` hover transform, transform transitions, and staggered `fadeInUp` render animations from `.stat-card`)
- `fair-fly/src/pages/Admin/AdminDashboard/admin-dashboard.css` (Removed `translateY` hover transform and `fadeInUp` animation from `.activity-row`)
- `fair-fly/src/components/UI/ServiceCard/service-card.css` (Removed `translateY` hover transform from `.card`)
- `fair-fly/src/components/Shared/Services/services.css` (Removed `translateY` hover transform from `.card`)

### Summary of Changes
- **Animation and Transform Removal**: Completely disabled the container fade-in and slide-up animations globally. Removed all `translateY` vertical translations (both on page load and on mouse hover) across KPI cards, activity rows, services list cards, and other container elements to ensure a flat, stable layout presentation.

### Reason
- Fulfill user requests to completely remove all container animations and vertical hover translations.

### Breaking Changes
- None.

---

## [2026-08-13] Implemented Admin Portal Redesign (Phase 1)

### Files Modified & Created
- `fair-fly/src/components/Admin/StatCards/StatCards.jsx` (Re-exported `KpiCard` for backward compatibility)
- `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx` (Replaced legacy sidebar/navbar with standard layout primitives)
- `fair-fly/src/pages/Admin/AdminLayout/admin-layout.css` (Cleaned up sidebar layout styling, leaving only overrides)
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx` & `admin-dashboard.css` (Integrated `WelcomeHero` and wrapper classes)
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` & `admin-services.css` (Integrated `PageHeader`, `Breadcrumbs`, summary stats KPI grid, and wrapper card classes)
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx` & `admin-operators.css` (Integrated `PageHeader`, `Breadcrumbs`, and card wrappers)
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx` & `admin-franchise-apps.css` (Restyled header markup and cleaned up layout styles)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` & `admin-tickets.css` (Integrated `PageHeader`, `Breadcrumbs`, and card wrappers)
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx` & `admin-inquiry-history.css` (Integrated `PageHeader`, `Breadcrumbs`, and card wrappers)
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx` & `admin-quick-links.css` (Integrated `PageHeader`, `Breadcrumbs`, and card wrappers)
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx` & `admin-workflow-templates.css` (Integrated `PageHeader`, `Breadcrumbs`, and card wrappers)
- `fair-fly/src/components/Admin/AdminSidebar` **[DELETED]** (Removed old sidebar folder)
- `fair-fly/src/components/Admin/AdminNavbar` **[DELETED]** (Removed old navbar folder)

### Summary of Changes
- **Standardized Layout & Navigation**: Adopted `AppLayout` across the admin portal to wrap dashboards and subpages under a responsive, collapsible sidebar layout.
- **Unified UI Component Adoption**: Restyled all admin subpages to use the shared UI primitives (`Breadcrumbs`, `PageHeader`, `WelcomeHero`, `KpiCard`) in strict compliance with the style guide constraints (no emojis, flat colors, REM-based spacing).
- **CSS Cleanup & Deduplication**: Removed old padding and custom title styles from admin CSS files, relying on global utility classes and table wrappers.

### Reason
- Complete the visual layout redesign for the Admin Portal (Phase 1) under the system-wide redesign specification.

### Breaking Changes
- None.

---

## [2026-08-13] Implemented Shared UI Foundation (Phase 0) for UI Redesign

### Files Modified & Created
- `fair-fly/src/components/UI/AppSidebar/AppSidebar.jsx` **[NEW]** (Unified sidebar navigation supporting dynamic portals and theme metrics)
- `fair-fly/src/components/UI/AppSidebar/app-sidebar.css` **[NEW]** (Sidebar CSS variables-driven styling)
- `fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx` **[NEW]** (Unified top navigation bar wrapping Team Chat and Firebase authentication sign-out actions)
- `fair-fly/src/components/UI/AppNavbar/app-navbar.css` **[NEW]** (Navbar layout styling with responsive media queries)
- `fair-fly/src/components/UI/AppLayout/AppLayout.jsx` **[NEW]** (Unified shell wrapper for sidebars, navbars, and main content views)
- `fair-fly/src/components/UI/AppLayout/app-layout.css` **[NEW]** (Layout styling grid and desktop responsive widths offsets)
- `fair-fly/src/components/UI/WelcomeHero/WelcomeHero.jsx` **[NEW]** (Dashboard greeting card displaying dates and illustrations)
- `fair-fly/src/components/UI/WelcomeHero/welcome-hero.css` **[NEW]** (Welcome banner CSS styles with left brand border accents)
- `fair-fly/src/components/UI/Breadcrumbs/Breadcrumbs.jsx` **[NEW]** (Breadcrumb path trail with chevron delimiters)
- `fair-fly/src/components/UI/Breadcrumbs/breadcrumbs.css` **[NEW]** (Breadcrumbs trail layout)
- `fair-fly/src/components/UI/PageHeader/PageHeader.jsx` **[NEW]** (Descriptive table header layout wrapper with actions)
- `fair-fly/src/components/UI/PageHeader/page-header.css` **[NEW]** (PageHeader CSS formatting)
- `fair-fly/src/components/UI/KpiCard/KpiCard.jsx` **[NEW]** (Enriched metrics card displaying values, trend pointers, and badges)
- `fair-fly/src/components/UI/KpiCard/kpi-card.css` **[NEW]** (KPI card colors and status badges styling)
- `fair-fly/src/index.css` (Added global primary/secondary button classes and standard form input utilities)

### Summary of Changes
- **Shared UI foundation layout primitives**: Scaffolded all shared UI components required for modern SaaS look-and-feel.
- **Strict guidelines enforcement**: Built components to consume CSS variables from `index.css` exclusively (no hardcoded hexadecimal colors) and completely eliminated emoticons/emojis.
- **Button and form field utility standardization**: Created `.btn-*` and `.form-*` CSS patterns to ease page redesigns.

### Reason
- Set up reusable foundations (Phase 0) for the portal-wide UI/UX redesign of the Fairfly system.

### Breaking Changes
- None.

---

## [2026-08-06] Implemented Admin Support Ticketing System with Forum Threads

### Files Modified & Created
- `fly-api/src/controllers/ticketController.js` **[NEW]** (Backend API controller for ticket creation, listing, status updates, thread replies, and forum thread closing)
- `fly-api/src/routes/ticketRoutes.js` **[NEW]** (Express routes for support ticket endpoints)
- `fly-api/src/routes/index.js` (Mounted `/tickets` routes)
- `fair-fly/src/components/Admin/AdminSidebar/AdminSidebar.jsx` (Added "Tickets" tab to Admin navigation)
- `fair-fly/src/App.jsx` (Added `/admin/tickets` route)
- `fair-fly/src/pages/Admin/AdminTickets/AdminTickets.jsx` **[NEW]** (Admin page container wrapping content in `<AdminProvider targetCollection="tickets">`)
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx` **[NEW]** (Page component managing search, filters [Pending, Ongoing, Closed, All], pagination, AlertBar, and switching between Table view and Forum Thread view)
- `fair-fly/src/pages/Admin/AdminTickets/admin-tickets.css` **[NEW]** (Page styling following Franchise Application aesthetics)
- `fair-fly/src/components/Admin/Tickets/TicketTable.jsx` **[NEW]** (Table component displaying support tickets akin to Franchise Application with status badges, Operator ID, and actions)
- `fair-fly/src/components/Admin/Tickets/TicketThread.jsx` **[NEW]** (Forum-style thread component displaying discussion timeline with role badges [Admin / Operator], reply form, and Close Forum button)
- `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx` **[NEW]** (Modal component for Admin ticket creation)
- `fair-fly/src/components/Admin/Tickets/tickets.css` **[NEW]** (Component styles for TicketTable, TicketThread, badges, and forum timeline)
- `fair-fly/src/pages/Operator/OperatorServiceProcedure/operator-service-procedure.css` (Added missing CSS rules for `.swm-btn-complete`, `.swm-btn-portal`, `.swm-btn-file-attach`, `.swm-overall-badge`, `.swm-step-status-pill`, and `.op-priority` badge styling on the Operator Procedure view)

### Summary of Changes
- **Operator Procedure UI Styling Fix**: Added complete CSS definitions for step action buttons (**Mark Step Completed**, **Toggle Ongoing**, **Open Portal Link**, **Attached Reference File**), overall status pill, and individual step status badges on the Operator Service Procedure page.

### Reason
- Fix missing styles for step action buttons and status pills on the Operator Service Procedure execution page.

### Breaking Changes
- None.

---
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Updated "Perform Workflow Procedure" action buttons to navigate directly to the new dedicated `/operator/services/:id/procedure` page)
- `fair-fly/src/App.jsx` (Registered `/operator/services/:id/procedure` route under Operator routes)

### Summary of Changes
- **Dedicated Service Procedure Page**: Replaced the modal-based procedure view with a dedicated, spacious full page (`/operator/services/:id/procedure`).
- **Enhanced Spacing & Layout**: Features a split-grid layout providing comprehensive space for detailed step instructions, timestamps, attached file viewers, portal link openers, completion progress metrics, and Admin requirement checklists.

### Reason
- Fulfill user request to convert the Operator Service Procedure into a dedicated page for better spacing, readability, and detailed information display.

### Breaking Changes
- None.

---
- `fly-api/src/controllers/activeServiceController.js` (Preserved attached file objects `step.file` and custom portal links `step.thirdPartyLink` when compiling workflow steps from Admin templates)

### Summary of Changes
- **Workflow Step Attached Files & Links UI**: Operators can now directly view and download step document attachments (e.g. `DFA_Passport_Requirements_Guide.pdf`) via paperclip attachment buttons, as well as open step links/portals (e.g. `Official DFA Passport Booking Portal`) directly inside `ServiceWorkflowModal`.
- **Seeded Test Record**: Seeded active service record `Gideon Alvarez — Passport Renewal` into Firestore with attached PDF documents and custom booking portal links for live testing.

### Reason
- Fulfill user request to provide UI elements for Operators to view and open attached files and links within workflow steps.

### Breaking Changes
- None.

---
- `fly-api/src/controllers/activeServiceController.js` (Updated `compileWorkflowStepsForService` helper to resolve attached workflow template steps from `workflowTemplates` collection linked by Admin in `services.workflowIds`)
- `fair-fly/src/components/Operator/ServiceWorkflowModal/ServiceWorkflowModal.jsx` (Updated `ServiceWorkflowModal` to render Admin configured service requirements checklist, step descriptions, and third-party portal shortcuts alongside strict sequential step completion)

### Summary of Changes
- **Admin Services & Workflows Integration**: Realigned the Operator service procedure so it directly follows the Admin Services Catalog (`services` collection) and their attached Workflow Templates (`workflowTemplates` collection).
- **Dynamic Step Compilation**: When an Operator initializes an active service record, the backend resolves the workflow template steps attached by the Admin to that service in Firestore.
- **Seeded Test Record**: Seeded an Admin-linked active service record (`Ramon Bautista` — `PSA BIRTH?` linked to Admin service `MlT2WA8MMTM21WKut042` and workflow template `sk0nPPQPaOOZhERYtvKZ`) with requirements and steps into Firestore for testing.

### Reason
- Fulfill user request to align Operator service fulfillment procedures strictly with Admin created services and attached workflow templates.

### Breaking Changes
- None.

---
- `fly-api/src/controllers/activeServiceController.js` & `activeServiceRoutes.js` **[NEW]** (Backend API controller and routes for `activeServices` collection with strict sequential step validation `PATCH /api/services/active/:id/step`)
- `fly-api/src/routes/serviceRoutes.js` (Mounted `/active` routes under `/api/services/active`)
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` (Updated to wrap content in `<OperatorProvider targetCollection="activeServices">` for real-time Firestore `onSnapshot()` reads, with interactive `Perform Workflow Procedure` action buttons triggering `ServiceWorkflowModal`)
- `fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx` (Connected to backend `POST /api/services/active` endpoint for initializing new active service records with procedure steps)
- `fair-fly/src/components/Operator/OperatorSidebar/OperatorSidebar.jsx` (Removed standalone "Workflows" item from operator sidebar per specs)
- `fair-fly/src/App.jsx` (Redirected legacy `/operator/workflows` route to main `/operator` dashboard)

### Summary of Changes
- **Service Procedures & Workflows Integration**: Removed standalone Workflows page from Operator sidebar and integrated step-by-step workflow procedures directly into active client service fulfillment cards on the Operator Dashboard.
- **Strict Sequential Step Rule**: Enforced strict ordering rules in both frontend (`ServiceWorkflowModal`) and backend (`activeServiceController`). Operators must complete steps in order (Step N cannot be marked Completed until Step N-1 is finished). Each step supports statuses: **Completed**, **Currently Processing**, **Ongoing**, **Pending/Locked**.
- **Firestore Seeding**: Seeded detailed active service records (`activeServices` collection) with multi-step workflows into Firestore for live testing.

### Reason
- Fulfill user request to attach workflow procedure execution directly under requested active client services with strict ordered step completion and Firestore test records.

### Breaking Changes
- None.

---
- `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx` (Fixed `activeLink` prop resolution so `initialData` prop passed from `QuickLinksContent.jsx` correctly pre-fills form fields when editing)
- `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkForm.jsx` (Added category normalization helper for pre-filling dropdown options when editing an existing Quick Link)
- `fair-fly/src/components/Operator/OperatorSidebar/OperatorSidebar.jsx` & `operator-sidebar.css` **[NEW DESIGN]** (Restructured OperatorSidebar into a full-height fixed sidebar matching Admin sidebar layout, including brand header, profile avatar box, mobile close button, and new "Tickets" tab)
- `fair-fly/src/components/Operator/OperatorNavbar/OperatorNavbar.jsx` & `operator-navbar.css` (Added mobile hamburger menu toggle, logo brand display for mobile, logout modal, and left margin offset matching Admin layout)
- `fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx` & `operator-layout.css` (Updated Operator layout to mirror Admin layout structure with fixed sidebar offset, top navbar, stat cards row, and main content area)
- `fly-api/src/controllers/inquiryController.js` & `inquiryRoutes.js` **[NEW]** (Backend API controller and endpoints for client inquiries)
- `fly-api/src/controllers/quotationController.js` & `quotationRoutes.js` **[NEW]** (Backend API controller and endpoints for quotation forms)
- `fly-api/src/controllers/appointmentController.js` & `appointmentRoutes.js` **[NEW]** (Backend API controller and endpoints for face-to-face appointments)
- `fly-api/src/routes/index.js` (Mounted `/inquiries`, `/quotations`, `/appointments` routes)
- `fair-fly/src/context/OperatorContext.jsx` **[NEW]** (Created `OperatorProvider` for real-time Firestore `onSnapshot()` reads across operator collections)
- `fair-fly/src/pages/Operator/OperatorTickets/OperatorTickets.jsx` & `OperatorTicketsContent.jsx` **[NEW]** (Operator-side Support Ticketing System with real-time `onSnapshot()` ticket thread listing, filters, support thread conversation, and backend ticket creation/messaging)
- `fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx` **[NEW]** (Quotation Forms Management page with real-time `onSnapshot()` reads and backend CUD quotation generation)
- `fair-fly/src/pages/Operator/OperatorInquiryForms/OperatorInquiryForms.jsx` (Updated to use real-time `onSnapshot()` reads and backend CUD inquiry form creation)
- `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx` (Updated to use real-time `onSnapshot()` reads and backend CUD appointment confirmation/cancellation)
- `fair-fly/src/pages/Operator/OperatorWorkflows/OperatorWorkflows.jsx` (Updated template-driven booking workflows with real-time `onSnapshot()` reads on `workflowTemplates`)
- `fair-fly/src/pages/Operator/OperatorQuickLinks/OperatorQuickLinks.jsx` (Updated to use real-time `onSnapshot()` reads on `quickLinks`)
- `fair-fly/src/App.jsx` (Registered `/operator/tickets` and `/operator/quotations` routes)

### Summary of Changes
- **Fixed Operator UI & Sidebar Layout**: Made `OperatorSidebar` a full-height fixed sidebar matching `AdminSidebar` (250px width, brand header, mobile overlay, user avatar box, and responsive toggle).
- **Backend-Only CUD & Real-Time onSnapshot Reads**: Enforced real-time `onSnapshot()` listeners via `<OperatorProvider>` for all operator reads (`tickets`, `inquiries`, `quotations`, `appointments`, `workflowTemplates`, `quickLinks`). All CUD operations execute via Express backend API routes in `fly-api`.
- **Operator Support Ticketing System (`/operator/tickets`)**: Integrated support ticket creation, list filtering (**Pending**, **Ongoing**, **Closed**, **All**), and forum-style thread communication with Head Office.
- **Capstone Specification Alignment**: Implemented Operator Quotations, Inquiry Forms, Appointments, Workflow steps, and Quick Links matching Capstone Paper specifications.

### Reason
- Fulfill user request to implement the Franchise Operator module with aligned Admin sidebar layout, real-time `onSnapshot()` reads, backend CUD API endpoints, and integrated support ticketing system.

### Breaking Changes
- None.

---

### Summary of Changes
- **Admin Navigation**: Added dedicated "Tickets" tab in the Admin sidebar with icon `fa-solid fa-ticket`.
- **Firestore onSnapshot Reads & Backend CUD**: Frontend uses Firestore's real-time `onSnapshot()` listener via `<AdminProvider targetCollection="tickets">` for instant UI updates. All Create, Update, and Delete (CUD) operations are handled exclusively through the backend API (`fly-api`) to enforce the "Don't trust the Client" security model.
- **Table View Akin to Franchise Applications**: Created `TicketTable.jsx` with search, filter chips for **Pending**, **Ongoing**, **Closed**, and **All**, pagination, and status badges.
- **Operator ID & Ticket Metadata**: Each ticket object holds `operatorId`, `operatorName`, `operatorEmail`, `title`, `category`, `priority`, `status`, and `messages` thread array.
- **Forum-Style Thread View**: Opening a ticket renders `TicketThread.jsx` featuring original operator request, response timeline with role tags (ADMIN / OPERATOR), timestamps, reply input, and a **"Close Forum"** button.
- **Closing Forum Thread**: Admins can close the forum thread, which updates ticket status to `Closed`, locks the reply box, and records `closedAt` timestamp and `closedBy` user name.
- **Modular & Readable Code**: Components placed cleanly under `components/Admin/Tickets/` and `pages/Admin/AdminTickets/`.

### Reason
- Fulfill user request to implement a support ticketing system between Individual Operator Accounts and Admins with forum-like support threads.

### Breaking Changes
- None.

---

### Files Modified & Created
- `fly-api/src/services/storageService.js` **[NEW]** (Modular helper for parsing and deleting files from Firebase Storage)
- `fly-api/src/controllers/serviceController.js` (Integrated storage cleanup into `deleteService` and `bulkDeleteServices`)
- `fly-api/src/controllers/workflowController.js` (Integrated storage cleanup into `deleteTemplate` and `bulkDeleteTemplates`)

### Summary of Changes
- **Modular Storage Cleanup Utility (`storageService.js`)**: Created helper methods:
  - `parseStoragePath(urlOrPath)`: Extracts storage paths from Firebase Storage HTTP URLs or raw paths.
  - `deleteFileFromStorage(urlOrPath)`: Deletes individual files from Firebase Storage.
  - `deleteFilesFromStorage(urlsOrPaths)`: Deletes multiple files from Firebase Storage in parallel.
  - `extractStorageUrls(obj)`: Recursively scans any record object or array to extract all embedded Firebase Storage URLs/paths.
  - `deleteRecordStorageFiles(recordData)`: Universal helper that scans any record(s) and automatically deletes attached storage files.
- **Service Deletion Integration**: Integrated `deleteRecordStorageFiles` in `deleteService` and `bulkDeleteServices` to remove requirement attachment files when services are deleted.
- **Workflow Deletion Integration**: Integrated `deleteRecordStorageFiles` in `deleteTemplate` and `bulkDeleteTemplates` to remove step attachment files when workflow templates are deleted.

### Reason
- Automatically reclaim storage space on Firebase Storage whenever records containing file attachments are deleted.

### Breaking Changes
- None.

---

## [2026-08-04] Added Automatic Cascade Removal of Deleted Workflows from Services

### Files Modified
- `fly-api/src/controllers/workflowController.js`

### Summary of Changes
- **Cascade Removal Helper (`cascadeRemoveWorkflowFromServices`)**: Implemented automatic scanning and batch updates in `workflowController.js`. When a workflow template is deleted (individually via `DELETE /api/workflow/templates/:id` or in bulk via `POST /api/workflow/templates/bulk-delete`), the backend automatically queries all services referencing the deleted workflow ID (`workflowIds`) and removes the ID from their `workflowIds` arrays.
- **Data Integrity & Consistency**: Guarantees database referential integrity, eliminating stale or dangling workflow references across services without requiring manual service editing.

### Reason
- Fulfill user requirement to clean up workflow references across all affected services immediately upon workflow deletion.

### Breaking Changes
- None.

---

## [2026-08-04] Enforced Disabled & Loading States on `WorkflowForm`

### Files Modified
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowForm.jsx`

### Summary of Changes
- **Passed `isLoading` Prop**: Added `isLoading = false` parameter to `WorkflowForm` signature.
- **Disabled Controls During API Processing**: Disabled text inputs (`name`, `description`, `type`), the "Edit / Reorder Steps" button, "Create/Update Workflow" submit button, and "Cancel" button while `isLoading` is true.
- **Visual Processing Feedback**: Rendered a spinning loader icon (`fa-spinner fa-spin`) and `"Processing..."` label on the submit button with reduced opacity (`0.6`) and `cursor: not-allowed` when `isLoading` is true.

### Reason
- Prevent form re-submission, duplicate backend API calls, or accidental modal dismissal while the backend API is processing workflow template creation or updates.

### Breaking Changes
- None.

---

## [2026-08-04] Updated Firebase Storage Bucket Configuration to `fairfly-1e83b.firebasestorage.app`

### Files Modified
- `fly-api/src/config/firebase.js`
- `fly-api/.env`

### Summary of Changes
- **Updated Storage Bucket Target**: Set `FIREBASE_STORAGE_BUCKET=fairfly-1e83b.firebasestorage.app` in `fly-api/.env` and updated `fly-api/src/config/firebase.js` to default to `fairfly-1e83b.firebasestorage.app` (handling any `gs://` protocol prefixes automatically).
- **Restarted Backend API**: `fly-api` dev server reinitialized cleanly with bucket `fairfly-1e83b.firebasestorage.app`.

### Reason
- Ensure backend file upload endpoint target matches the active Firebase Storage bucket domain.

### Breaking Changes
- None.

---

## [2026-08-04] Fixed Workflow Page Button Styling & Edit Form Pre-population

### Files Modified
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowForm.jsx`

### Summary of Changes
- **Fixed Button Styling**: Changed `className="workflow-template-btn"` to `className="workflow-btn"` in `AdminWorkflowTemplates.jsx` so the "New Template" button matches the `.workflow-btn` rule in `admin-workflow-templates.css` with purple background, hover elevation, and proper padding.
- **Fixed Edit Form Pre-population**: Updated `WorkflowModal.jsx` to correctly pass `activeTemplate` from `initialData` or `editingTemplate` props down to `WorkflowForm`. Added `useEffect` in `WorkflowForm.jsx` to pre-fill template fields (`name`, `description`, `type`/`serviceType`, and `steps`) when editing an existing workflow template.

### Reason
- Fix unstyled button on the workflow template page and resolve bug where editing a workflow template did not pre-fill existing data into the modal form.

### Breaking Changes
- None.

---

## [2026-08-04] Migrated File Uploads to Backend API (`fly-api`) & Removed `firebaseutils.js`

### Files Modified & Created
- `fly-api/src/config/firebase.js` (Configured Firebase Admin Storage bucket)
- `fly-api/src/controllers/uploadController.js` **[NEW]** (Backend file upload handler to Firebase Storage)
- `fly-api/src/routes/uploadRoutes.js` **[NEW]** (`POST /api/upload` endpoint using `multer`)
- `fly-api/src/routes/index.js` (Mounted `/api/upload` route)
- `fair-fly/src/utils/fileUploadApi.js` **[NEW]** (Frontend helper sending files via `FormData` to `/api/upload`)
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx` (Switched from client SDK to `uploadFileToBackend`)
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx` (Switched to `uploadFileToBackend`)
- `fair-fly/src/services/chatService.js` (Switched file message upload to `uploadFileToBackend`)
- `fair-fly/src/pages/Index/Register/Register.jsx` (Replaced `setToDatabase` from `firebaseutils` with native Firestore `setDoc`)
- `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx` (Refactored to `ApiCaller` hitting `POST /api/franchise/applications`)
- `fair-fly/src/context/AuthContext.jsx` & `fair-fly/src/App.jsx` (Removed unused `firebaseutils` imports)
- `fair-fly/src/utils/firebaseutils.js` **[DELETED]** (Completely removed frontend `firebaseutils.js` utility)

### Summary of Changes
- **Backend File Upload Endpoint (`POST /api/upload`)**: Built a secure express file upload route in `fly-api` using `multer.memoryStorage()`. Files are uploaded directly to Firebase Storage via `firebase-admin` (`bucket.file().save()`), returning the public download URL (`https://firebasestorage.googleapis.com/...`).
- **Eliminated Client-Side Firebase Storage Direct Uploads**: Frontend no longer uses client Firebase Web SDK for uploads or database mutations. All mutations route through `fly-api` endpoints.
- **Removed `firebaseutils.js`**: Cleaned up all legacy imports and deleted `firebaseutils.js` from `fair-fly`.

### Reason
- Fulfill user request to route all file uploads through the backend API (`fly-api`) and remove `firebaseutils.js` from the frontend codebase.

### Breaking Changes
- None.

---

## [2026-08-04] Deferred Firebase Storage File Uploads to Workflow/Service Create/Update Submit

### Files Modified
- `fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowForm.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`

### Summary of Changes
- **In-Memory Pending Files during Sub-Modal Actions**: Updated `ServiceRequirementsModal` and `WorkflowStepsModal` (`WorkflowForm`) so that adding steps/requirements stores the selected `File` object in memory (`pendingFile`) instantly without making any premature Firebase Storage network requests.
- **Batch Upload on Create/Update Submit**: Integrated `processPendingFilesForService` and `processPendingFilesForWorkflow` into `ServiceContent.jsx` and `AdminWorkflowTemplates.jsx`. When the user clicks "Create Service" / "Update Service" or "Create Workflow" / "Update Workflow", all attached `pendingFile` objects are uploaded in batch to Firebase Storage.
- **Download URL Reference Payload**: Once uploaded, the generated download URLs (`https://firebasestorage.googleapis.com/...`) replace `pendingFile` in the payload before calling `ApiCaller`.
- **Security & UX**: Preserved 10MB size limits and executable file blocking (`.exe`, `.bat`, `.sh`, etc.) during file picking.

### Reason
- Fulfill user request to avoid premature file uploads when adding steps/requirements in sub-modals, uploading files only when the user submits the main Create/Update form.

### Breaking Changes
- None.

---

## [2026-08-03] Permanent Bulk Action Bar Design to Eliminate Layout Shifts

### Files Modified
- `fair-fly/src/components/UI/DataTable/DataTable.jsx`
- `fair-fly/src/components/UI/DataTable/data-table.css`

### Summary of Changes
- **Permanent Container & Zero Layout Shift**: Updated `<DataTable />` so that the bulk action bar is permanently mounted at a fixed height (`min-height: 48px`) whenever `selectable={true}`, completely eliminating vertical content jumping/layout shifts when checking or unchecking table rows.
- **Neutral State (`0 selected items`)**: Styled the bar in a clean neutral gray (`#f8fafc` background with slate `#64748b` text and `#cbd5e1` count badge). Bulk action buttons (Enable, Disable, Delete) are disabled and visually grayed out (`opacity: 0.4`, `filter: grayscale(80%)`).
- **Active State (`1+ items selected`)**: Smoothly transitions (`0.2s ease`) to a light purple background (`#f5f3ff`), vibrant purple badge (`#7c3aed`), and active interactive bulk action buttons with clear selection count (`"N items selected"`).

### Reason
- Fulfill user request under `/frontend-design` to make the bulk bar permanently visible with a neutral state to prevent disruptive UX layout shifts.

### Breaking Changes
- None.

---

## [2026-08-03] Enforced ApiCaller Loading States & Modal Close Prevention

### Files Modified
- `fair-fly/src/components/UI/ModalBase/BaseModal.jsx`
- `fair-fly/src/components/UI/DataTable/DataTable.jsx`
- `fair-fly/src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx`
- `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorModal.jsx`
- `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorForm.jsx`
- `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceModal.jsx`
- `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`

### Summary of Changes
- **Modal Close Prevention During API Processing**: Updated `BaseModal` to accept an `isLoading` prop that blocks backdrop overlay clicks and close button actions while API calls are executing via `ApiCaller`. Modals now only close inside `ApiCaller`'s `successCallback`.
- **Disabled Buttons Across UI**: Passed `disabled` prop to `DataTable` (disabling all header/row checkboxes, bulk action buttons, and clear buttons) and all form inputs/submit/cancel/row action buttons during `isSubmitting` / `isConfirmLoading` / `isDeleting` states to prevent click spamming.
- **Awaited ApiCaller Calls**: Updated handler functions (`handleConfirm`, `handleCreate*`, `handleEdit*`, `handleDelete*`, `handleBulk*`) across admin pages to return and await `ApiCaller` Promises properly.

### Reason
- Fulfill user request to utilize `ApiCaller`'s `setIsLoading` state to disable all buttons and keep modals open until API responses complete, preventing double-submits and user click spamming.

### Breaking Changes
- None.

---

## [2026-08-03] Fixed Hook Ordering & Added RESTful Backend Bulk Action Endpoints

### Files Created/Modified
- `fair-fly/src/components/UI/DataTable/DataTable.jsx`
- `fair-fly/src/components/UI/DataTable/data-table.css`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`
- `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx`
- `fair-fly/src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx`
- `fly-api/src/controllers/operatorController.js`
- `fly-api/src/controllers/serviceController.js`
- `fly-api/src/controllers/workflowController.js`
- `fly-api/src/routes/operatorRoutes.js`
- `fly-api/src/routes/serviceRoutes.js`
- `fly-api/src/routes/workflowRoutes.js`
- `fly-api/src/routes/index.js`

### Summary of Changes
- **Fixed React Hook Ordering Bug**: Moved all `useMemo` hooks (including `columns` definitions) above early `if (loading) return` statements across `AdminWorkflowTemplates`, `OperatorsContent`, `ServiceContent`, and `QuickLinksContent`, resolving the conditional hook execution error (`Rendered more hooks than during the previous render`).
- **Added RESTful Backend Bulk Action Endpoints (`fly-api`)**:
  - `POST /api/operators/bulk-status` & `POST /api/operators/bulk-delete`
  - `POST /api/services/bulk-status` & `POST /api/services/bulk-delete`
  - `POST /api/services/quicklinks/bulk-delete`
  - `POST /api/workflow/templates/bulk-delete`
- **Updated Frontend Bulk Operations**: Updated frontend pages to execute single bulk API calls via `ApiCaller` instead of issuing repetitive per-item API loops.
- **ConfirmationModal Fix**: Fixed CSS interpolation when `BtnColor` uses CSS variable names (e.g. `var(--orange)`).

### Reason
- Eliminate React runtime crashes during data loading and streamline bulk row actions into single REST API calls following standard API design principles.

### Breaking Changes
- None.

---

## [2026-08-02] Combined AdminLayout Users Listener with `where('role', 'in', [...])`

### Files Modified
- `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx`

### Summary of Changes
- Combined separate operator and client user listeners into a single query: `query(collection(firestore, 'users'), where('role', 'in', ['operator', 'client']))`.
- Categorizes operators (active vs disabled) and counts clients within the single listener snapshot callback.

### Reason
- Reduces the active snapshot listener count from 4 down to 3 while still avoiding unnecessary non-operator/non-client user document fetches.

---

## [2026-08-02] Admin Sidebar Redesign — Fixed Panel with Mobile Drawer

### Files Modified
- `fair-fly/src/components/Admin/AdminSidebar/AdminSidebar.jsx`
- `fair-fly/src/components/Admin/AdminSidebar/admin-sidebar.css`
- `fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx`
- `fair-fly/src/pages/Admin/AdminLayout/admin-layout.css`
- `fair-fly/src/components/Admin/AdminNavbar/AdminNavbar.jsx`
- `fair-fly/src/components/Admin/AdminNavbar/admin-navbar.css`

### Summary of Changes
- Transformed the admin sidebar from an in-flow `.card` grid element to a **fixed left panel** spanning the full viewport height.
- Sidebar now includes a **brand section** (logo + "Fairfly Admin / Management Portal") at the top and a **user profile section** (avatar initials, email, role) at the bottom.
- Active link uses a left accent bar + tinted background instead of the previous purple filled pill.
- On **mobile** (≤ 768px), the sidebar is hidden off-screen and slides in as a **drawer overlay** with a backdrop, toggled by a hamburger button in the navbar.
- AdminLayout restructured: removed the flex-based `layout-container` wrapper; content areas now use `margin-left` offset to account for the fixed sidebar.
- Navbar hides its redundant brand section on desktop (sidebar handles it); shows brand on mobile where the sidebar is collapsed.
- Added resize handler that auto-closes the mobile drawer when viewport exceeds mobile breakpoint.

### Reason
- The sidebar looked like a content card rather than a navigation panel. The fixed panel approach gives it a distinct visual identity and improves space utilization.
- Mobile needed a proper toggle mechanism instead of the horizontal scroll strip.

### Breaking Changes
- None.

---

## [2026-08-01] Extracted Standalone Reusable FilterChipGroup & SearchBar Components

### Files Created/Modified
- `fair-fly/src/components/UI/FilterChipGroup/FilterChipGroup.jsx` *(new)*
- `fair-fly/src/components/UI/FilterChipGroup/filter-chip-group.css` *(new)*
- `fair-fly/src/components/UI/SearchBar/SearchBar.jsx`
- `fair-fly/src/components/UI/SearchBar/search-bar.css`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`
- `fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseContent.jsx`
- `fair-fly/src/pages/Admin/AdminInquiryHistory/HistoryContent.jsx`
- `fair-fly/src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx`
- `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx`
- `fair-fly/src/pages/Operator/OperatorAppointments/OperatorAppointments.jsx`

### Summary of Changes
- Extracted inline filter chip button lists into a standalone, reusable `FilterChipGroup` component (`src/components/UI/FilterChipGroup/FilterChipGroup.jsx`).
- Enhanced `SearchBar` component with icon, clear search button, and flexible placeholder/debounce props.
- Replaced inline filter chip rendering across all Admin and Operator pages and modal dialogs with `<FilterChipGroup />`.

### Reason
- Eliminate code duplication, improve UI modularity, and standardize filter chip button behavior and styling across the system.

### Breaking Changes
- None.

## [2026-08-01] Standardized System Modals with BaseModal & Folder Organization

### Files Created/Modified
- `fair-fly/src/components/UI/ModalBase/BaseModal.jsx`
- `fair-fly/src/components/UI/ModalBase/base-modal.css`
- `fair-fly/src/components/Admin/Modals/ApplicationModal/ApplicationModal.jsx`
- `fair-fly/src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx`
- `fair-fly/src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx`
- `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorModal.jsx` & `OperatorForm.jsx`
- `fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx` & `QuickLinkForm.jsx`
- `fair-fly/src/components/Admin/Modals/ServiceModal/ServiceModal.jsx` & `ServiceForm.jsx`
- `fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx`
- `fair-fly/src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx`
- `fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx` & `WorkflowForm.jsx`
- `fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx`
- `fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx`
- `fair-fly/src/components/Shared/TeamChatModal/TeamChatModal.jsx`
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx`
- `fair-fly/src/pages/Admin/AdminOperators/OperatorsContent.jsx`
- `fair-fly/src/pages/Admin/AdminQuickLinks/QuickLinksContent.jsx`
- `fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx`
- `fair-fly/src/pages/Admin/AdminWorkflowTemplates/AdminWorkflowTemplates.jsx`

### Summary of Changes
- Enhanced `BaseModal` to support both controlled (`isOpen` prop) and uncontrolled (`ref`) operational modes seamlessly, subtitle rendering, render function children, custom max-widths, and backdrop animations.
- Refactored `ApplicationModal` and all Admin, Operator, and Shared modals across the system to use `BaseModal`.
- Restructured all modals in `src/components/Admin/Modals/` into dedicated component subfolders (`ComponentName/ComponentName.jsx`), matching `ApplicationModal` folder conventions.
- Updated import references in all Admin pages and cleaned up deprecated flat modal files.

### Reason
- Standardize modal visual design, backdrop behavior, overlay styling, and animation system-wide, while improving maintainability and clean code practices.

### Breaking Changes
- None (API contracts and props preserved).

## [2026-08-01] Added Customizable `maxWidth` & `width` Props to `ModalWrapper`

### Files Modified
- `fair-fly/src/components/Admin/Modals/ModalWrapper.jsx`
- `fair-fly/src/components/Admin/Modals/AdminLogsModal.jsx`

### Summary of Changes
- Updated `ModalWrapper.jsx` to accept `maxWidth` (defaulting to `'480px'`) and optional `width` props to allow custom sizing per modal instance.
- Applied `maxWidth="750px"` on `AdminLogsModal.jsx` to provide a wider, more spacious view for the admin action logs table.

### Reason
- User requested customizable width on `ModalWrapper` to fix the logs modal being too narrow.

### Breaking Changes
- None (existing modals retain their default `480px` max-width).



## [2026-08-01] Extracted Standalone `AdminLogsModal` Component

### Files Modified
- `fair-fly/src/components/Admin/Modals/AdminLogsModal.jsx` *(new)*
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx`

### Summary of Changes
- Created a standalone modal component `AdminLogsModal.jsx` in `src/components/Admin/Modals/`.
- Encapsulated `ModalWrapper`, log search filtering, action type filters, pagination, and log row rendering inside `AdminLogsModal`.
- Updated `AdminDashboard.jsx` to render `<AdminLogsModal>` instead of defining the modal structure inline.

### Reason
- User requested that all modals using `ModalWrapper` be structured as standalone component files in `components/Admin/Modals/` rather than inline page layouts.

### Breaking Changes
- None.



## [2026-08-01] Refactored Admin Dashboard Helpers & Utils (Separation of Concerns)

### Files Modified
- `fair-fly/src/pages/Admin/AdminDashboard/dashboardUtils.js` *(new)*
- `fair-fly/src/pages/Admin/AdminDashboard/AdminDashboard.jsx`

### Summary of Changes
- Separated helper functions, action metadata definitions, formatters, and chart data out of `AdminDashboard.jsx` into `dashboardUtils.js`.
- Moved constants & functions:
  - `ACTION_META`
  - `relativeTime`
  - `humanResourceType`
  - `formatLogLine`
  - `revenueData`
  - `servicesCompletedData`
- Imported all helpers into `AdminDashboard.jsx`, resulting in a cleaner and more maintainable component.

### Reason
- User requested separation of concerns to keep `AdminDashboard.jsx` modular and focused on rendering components and managing state.

### Breaking Changes
- None.



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

---

## [2026-09-17] Self-Pruning Caching Architecture with CacheCollection and Cache

### Files Modified
- `fly-api/src/services/cacheService.js`

### Summary of Changes
- **Self-Pruning Architecture**: Replaced the interval-based polling cleanup (`setInterval`) with an event-driven `CacheCollection` and `Cache` architecture.
- **`CacheCollection`**: Created central static registry with `caches` Map, `set`, `get`, `update`, `prune`, `delete`, `has`, `clear`, `size`, and `createKey` methods.
- **`Cache`**: Created individual entry lifecycle class taking `(ttl, uid, data)` that sets a discrete `setTimeout` self-pruning timer and automatically cleans up via V8 garbage collection upon expiration.
- **Sliding Expiration**: Implemented touch-on-read sliding TTL in `CacheCollection.get(key, touch = true)` to keep frequently viewed items warm.
- **Stale Record In-Place Update**: Added `CacheCollection.update(key, newData, newTtl)` to replace cached database records with fresh values and reset timers upon DB mutations.
- **Explicit Deletion**: Enhanced `delete` / `prune` to cancel active timers immediately, eliminating timer memory leaks and race conditions.
- **Process Lifecycle Protection**: Added `timer.unref()` to prevent open cache timers from blocking clean Node.js process termination.
- **Backward Compatibility**: Provided namespace adapters `userCache` and `staticDataCache` ensuring zero-regression compatibility with existing controllers and auth middleware.

### Reason
- Fulfill user request to replace interval pruning with a 2-class (`CacheCollection`, `Cache`) self-pruning caching system with sliding expiration, cache updates on DB mutation, and automated timer cleanup.

### Breaking Changes
- None. Fully backward-compatible with existing `userCache` and `staticDataCache` callers.
