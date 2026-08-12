# Update Logs

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
