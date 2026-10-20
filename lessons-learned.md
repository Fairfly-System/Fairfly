# Lessons Learned
# A File for Agents to write their mistakes so that next runs can prevent doing the same thing (Automatic Improvement)

## [2026-10-19] Cross-Origin Ignored HTML `download` Attribute Leading to Tab Navigation
- **Problem**: In the Operator and Admin Resources pages, clicking the "Download" button on materials/files did not download the file to the user's computer; instead, it opened the file in a new browser tab.
- **Root Cause**:
  1. The code previously generated dynamic anchor tags pointing directly to Firebase Storage: `<a href={resource.fileUrl} target="_blank" download={resource.fileName}>`.
  2. According to the HTML5 specification, the `download` attribute is strictly ignored by browsers for cross-origin URLs (e.g. from `fairfly-1e83b.web.app` to `firebasestorage.googleapis.com`).
  3. Consequently, the anchor tag fell back to standard link navigation behavior, opening the resource inline in a new tab because `target="_blank"` was set.
- **Prevention**:
  1. Never rely on `<a href={crossOriginUrl} download>` for downloading files from external CDNs, Firebase Storage, or Google Cloud Storage.
  2. Provide an authenticated backend streaming endpoint (e.g. `GET /api/resources/:id/file`) that sets `Content-Disposition: attachment; filename="..."` and streams the file binary.
  3. On the frontend, fetch the file binary as a Blob (`await response.blob()`), generate a same-origin Blob URL (`window.URL.createObjectURL(blob)`), and trigger download via anchor click. Because Blob URLs are same-origin, browsers honor the `download` attribute and save the file directly to the user's Downloads folder without opening new tabs.

---


## [2026-10-19] Missing React Hook Import (`useMemo`) Leading to Runtime ReferenceError
- **Problem**: In `ClientAppointmentForm.jsx`, adding `useMemo` to memoize filtered branch options for branch-exclusive services caused a runtime exception `ReferenceError: useMemo is not defined` when the appointment form modal opened.
- **Root Cause**:
  1. The hook `useMemo` was added to component body logic (`const displayedBranches = useMemo(...)`), but the top-level React import remained `import React, { useState, useEffect } from 'react';`.
  2. Because the build was performed with standard Vite/Rolldown minification without strict linter gates on undeclared global variables, the undeclared variable slipped past bundling and triggered a runtime error upon modal instantiation.
- **Prevention**:
  1. Whenever introducing a React hook (`useMemo`, `useCallback`, `useRef`, etc.) into an existing component, immediately verify that the hook is explicitly named in the top-level `import React, { ... } from 'react';` statement.
  2. Perform an automated static scan across the project after modifying components to ensure all used hooks are declared and imported from `'react'`.

---


## [2026-10-18] CSS Grid Intrinsic Content Width Blowout on Dual File Upload Slots
- **Problem**: When a user selected an ID image on the registration page (`/register`) or ID re-upload page (`/reupload-id`), the uploaded slot (Front Side) expanded horizontally to take up ~75% of the form width, crushing the second upload slot (Back Side) down into a narrow sliver where helper text wrapped into 7 lines.
- **Root Cause**:
  1. **CSS Grid `1fr` Default Track Sizing**: In CSS Grid, track sizing specified as `1fr` is implicitly `minmax(auto, 1fr)`. If a child element contains wide intrinsic content (such as long file names or horizontal flex rows), `minmax(auto, 1fr)` allows intrinsic content to expand the track beyond equal 50% distribution.
  2. **Missing `min-width: 0` on Grid Items**: In flex/grid layouts, children default to `min-width: auto`. Without `min-width: 0`, flex child text truncators (`overflow: hidden; text-overflow: ellipsis;`) cannot trigger text truncation because the flex container never shrinks below its content width.
  3. **Horizontal Layout in Narrow Column**: The uploaded card component attempted a 3-column horizontal row (`[thumbnail] [filename/status] [action buttons]`) inside a narrow ~210px container, which forced minimum width expansion.
- **Prevention**:
  1. Always declare CSS Grid columns with explicit zero-minimum tracks: `grid-template-columns: repeat(2, minmax(0, 1fr));` instead of plain `grid-template-columns: 1fr 1fr;`.
  2. Always add `min-width: 0; box-sizing: border-box;` to all direct children of CSS Grid tracks to ensure text ellipsis and truncation work as expected.
  3. For compact split file uploads, use an ID-card aspect ratio with vertical layering (overlaying status badge, action buttons, and filename scrim on top of an absolute background preview image) rather than wide horizontal row layouts.
  4. Ensure the empty dropzone and uploaded card share the exact same fixed height (`7.75rem` / `124px`) to guarantee zero vertical or horizontal layout shifts when files are selected or removed.

## [2026-10-18] Substring Matching Collision in Payment Channel Detection ('gcash' contains 'cash')
- **Problem**: When clients or operators completed an online payment through PayMongo using GCash, the Official E-Receipt PDF ribbon displayed `Payment Channel: Direct Cash (Counter Receipt)` and the Operator Payment History table badge displayed `Cash (Counter)` with a green paper money icon instead of the electronic `GCash (PayMongo)` badge.
- **Root Cause**:
  1. The receipt data normalization logic (`PdfDocumentView.jsx`) and payment history table (`OperatorHistory.jsx`) evaluated `rawMethod.toLowerCase().includes('cash')` to identify direct counter cash payments.
  2. Because the word `'cash'` is a direct substring of the mobile wallet brand `'gcash'` (`g` + `cash`), `'gcash'.toLowerCase().includes('cash')` evaluated to `true`.
  3. Consequently, any payment processed through the Philippines' most popular mobile wallet (GCash) was erroneously categorized and rendered as physical direct cash.
- **Prevention**:
  1. Never use naive substring checks like `.includes('cash')` on payment method or channel strings.
  2. Implement an explicit negative guard: if `method.toLowerCase().includes('gcash')`, immediately return false for cash checks before inspecting cash patterns.
  3. Use dedicated, shared payment channel formatting utilities (`formatPaymentChannel`, `isCashPayment`, `formatPaymentMethodPill`) that map specific channel codes (`gcash`, `paymaya`, `card`, `qrph`, `grab_pay`, `billease`, `dob`) to authoritative labels (`GCash (PayMongo)`, `Maya (PayMongo)`, `QR Ph (PayMongo)`, etc.).

## [2026-10-18] Allowed Fields Whitelist Synchronization Between Split-Field Frontend Forms and Zero-Trust Middleware
- **Problem**: New clients attempting to register on the deployed site (`/register`) encountered a blocking toast error: `Bad Request: Invalid fields in request body (firstName, middleInitial, lastName)` triggered by `POST /api/auth/register-initiate 400 (Bad Request)`.
- **Root Cause**:
  1. The client signup form (`Register.jsx`) submits granular name fields (`firstName`, `middleInitial`, `lastName`, `fullName`) so user profiles in Firestore store individual name parts alongside the combined display name.
  2. While the backend verification controller (`verificationService.js`) had already implemented support for `firstName`, `middleInitial`, and `lastName`, the route definition in `authRoutes.js` guarded the route using `allowedFields(REGISTER_ALLOWED_FIELDS)`.
  3. `REGISTER_ALLOWED_FIELDS` previously only whitelisted `fullName`, causing the strict zero-trust middleware to immediately block the request with HTTP 400 before the controller could process it.
- **Prevention**:
  1. When decomposing composite inputs (such as names, addresses, or identification parts) into granular subfields on frontend intake forms, always verify and synchronize the backend `allowedFields` whitelist on all entry routes (`/register`, `/register-initiate`).
  2. Keep route authorization and allowed-field declarations strictly isolated per user role (`operatorRoutes.js`, `adminRoutes.js`, `authRoutes.js`) so that adjusting client registration payload fields never introduces side effects or regressions into administrative user creation flows.

## [2026-10-18] Operational Lifecycle vs Financial Transaction Ledger Disconnect
- **Problem**: Operators attempting to reconcile their branch Total Revenue by summing rows in Service History found a discrepancy. When ongoing services were still in progress on the dashboard, their revenue was counted in the branch KPI card but their rows were not yet present in Service History. Because recent in-progress services were paid in cash, this created the illusion that cash payments were excluded from history.
- **Root Cause**:
  1. Conflating **Operational Service Fulfillment Lifecycle** (In-Progress vs Completed vs Cancelled) with **Financial Transaction Settlement** (Payment Received vs Refunded).
  2. Payments are recognized immediately upon payment confirmation (Cash or QR), but services only move to Service History once all checklist steps are completed.
  3. The Operator portal previously lacked a dedicated Payment / Transaction History tab, forcing operators to look at Service History as an impromptu financial ledger.
- **Prevention**:
  1. Always provide a dedicated, first-class Financial Payment History tab whenever financial KPIs (such as Total Revenue) are displayed in the portal.
  2. Enable direct reconciliation by showing receipt numbers, payment methods (Cash vs Electronic), amounts, and 1-click official E-Receipts.
  3. Keep Service History focused on operational fulfillment quality, procedure completion dates, and client file attachments.

---

## [2026-10-18] Strict File Input Filtering, Regional Function Routing, and Safe Response Parsing on 503s
- **Problem**: When clients or operators submitted service requirements with mixed data types (Document, Image, Text, Number, Date), the Document file picker displayed images instead of exclusively showing documents. Additionally, during multi-file uploads, users intermittently hit `503 Service Unavailable`, which caused unhandled `SyntaxError: Unexpected token 'S', "Service Unavailable" is not valid JSON` crashes. Furthermore, console warnings alerted about deprecated `THREE.Clock` and `THREE.PCFSoftShadowMap`.
- **Root Cause**:
  1. **Permissive Fallback Accept String**: `QuotationAttachRequirementsModal.jsx` had a fallback accept string containing both document formats AND image formats (`image/*, .jpg, .jpeg, ...`). Consequently, the OS File Explorer allowed users to select images for Document fields.
  2. **Firebase Hosting Regional Rewrite Mismatch**: The `/api/**` rewrite in `firebase.json` was missing `"region": "asia-southeast1"`. Edge hosting proxies defaulted to `us-central1`, intermittently causing 503 gateway errors during serverless function invocations.
  3. **Blind `response.json()` Parsing**: `uploadFileViaApi` called `await response.json()` without inspecting the response `Content-Type` or status code, crashing on HTML/plain-text error pages returned by Cloud Functions or proxies during cold starts.
  4. **Parallel Stream Bursts**: Dispatching simultaneous multipart uploads via `Promise.all` overwhelmed single-instance cold starts on serverless functions.
- **Prevention**:
  1. Strictly isolate `accept` attributes by requirement datatype: Document inputs must exclusively accept `.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx` and never include `image/*`. Photo inputs must exclusively accept `.jpg, .jpeg, .png, .webp, .gif`.
  2. Always declare `"region": "<region>"` on Cloud Function rewrites in `firebase.json` whenever functions are deployed outside `us-central1`.
  3. Never call `response.json()` without validating that `response.ok` or checking `response.headers.get('content-type')?.includes('application/json')`. Fall back cleanly to `response.text()` with descriptive error formatting.
  4. Use sequential uploads or bounded concurrency pools for multi-file form uploads rather than unconstrained `Promise.all`.

---

## [2026-10-18] Revenue Aggregation Desync: Refund Decrements, Map Dot-Notation in `.set()`, and Secondary Counters
- **Problem**: Admin System KPI Card showed ₱47,988, Admin Operator Detail Analytics showed ₱45,688, and the Operator Portal showed ₱62,388, causing user confusion and audit discrepancies across three portals.
- **Root Cause**:
  1. **Missing Refund Decrement**: When a service was cancelled and refunded (`cancelActiveService`), `payment.status` was updated to `'REFUNDED'`, but `system_stats/revenue.totalRevenue` and `paidCount` were never decremented. The refunded ₱2,300 remained in the pre-aggregated system total ($45,688 + 2,300 = 47,988$).
  2. **Firestore `.set(..., { merge: true })` Literal Dot Keys**: `paymentController` used string keys with dots (`operators.${id}.totalRevenue`) inside `.set(ref, data, { merge: true })`. Firestore does not parse dots into nested maps when passed to `.set()`; it creates literal root fields with dots in their names. Dot-notation field path parsing only applies to `.update()`.
  3. **Duplicate / Secondary Metric Counter Drift**: `activeServiceController` incremented `user.totalRevenue` upon procedure checklist completion, while `paymentController` also tracked revenue from payments. Historical test executions accumulated in the operator user document (`completedServicesCount: 6`, `totalRevenue: 62388`) and were never cleaned up when orphaned payments and active services were purged.
- **Prevention**:
  1. Every state transition that reverts or refunds money must atomically decrement financial aggregation documents and operator counters with the exact negative refund amount (`admin.firestore.FieldValue.increment(-refundAmount)`).
  2. Use `transaction.update(ref, { ['path.to.field']: increment(...) })` rather than `.set()` when updating nested document paths via string notation in Firestore.
  3. Maintain a single source of truth for revenue across the entire platform. Operator layouts should subscribe to the same authoritative aggregation document (`system_stats/revenue.operators[uid]`) rather than un-audited mutable counters on the user document.
  4. Cleanup scripts that purge test or orphaned records must audit and resync all dependent tables and counters (`users`, `system_stats`), not just the primary collection.

## [2026-10-18] Undeclared JSX Variables & Identifier ReferenceErrors Causing React Blank Screen Crashes
- **Problem**: Navigating to an inquiry in the Admin Portal (e.g. `/admin/inquiry-history/INQ-...`) rendered a completely blank white screen.
- **Root Cause**: In [`AdminInquiryDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx), the JSX evaluated `{isConfirmed && !isArchived && (`, but `isConfirmed` had never been declared in component scope or imported. This threw an uncaught `ReferenceError: isConfirmed is not defined` during render. Because React 18 unmounts the component tree on unhandled render errors, the entire viewport went blank.
- **Prevention**:
  1. Always verify that all identifiers evaluated in JSX expressions (flags, helper functions, state variables) are explicitly declared, typed, and memoized in component scope.
  2. Implement route-level Error Boundaries (`ErrorBoundary`) around detail views so that runtime rendering glitches display a friendly retry/error fallback UI instead of crashing the entire page to a blank screen.
  3. Support flexible entity ID lookups in document subscribers (e.g. both direct document auto-ID and prefixed/control-number variants like `INQ-...`) with fallback queries so valid links always resolve.

## [2026-10-18] Production URL Sanitation: Never Rely on Localhost Default Fallbacks for Redirects & QR Codes
- **Problem**: Default fallback logic across backend controllers (`paymentController.js`, `clientController.js`, `receiptService.js`) and frontend configs fell back to `http://localhost:5173` or `http://localhost:5001` when environment variables were missing or evaluated. If triggered, PayMongo checkout redirects, client approval verification emails, and QR code tracking links directed users to localhost.
- **Root Cause**: Fallback expressions like `process.env.FRONTEND_URL || 'http://localhost:5173'` were left over from initial local development templates. Additionally, comma-separated lists in `.env` variables break URL constructors (`new URL(rawUrl)`) and downstream redirect headers.
- **Prevention**:
  1. Production configuration fallbacks must always default to the official deployed production domains (`https://fairfly-1e83b.web.app`), never `localhost`.
  2. Maintain strictly a single clean URL per environment variable (`FRONTEND_URL`, `CLIENT_BASE_URL`, `VITE_API_BASE_URL`) without comma-delimited strings.



## [2026-10-18] Status Bar and KPI Metrics Wiping on Table Filter Selection
- **Problem**: In the Admin Client Management module, when administrators clicked filter chips (e.g. "All Accounts", "Pending Approval", "Active", "Deactivated"), the Status Bar (`AlertBar`) reset and flickered to "Loading client records...", KPI summary cards reset to 0 or only reflected the filtered slice, and filter chip badges changed inappropriately.
- **Root Cause**:
  1. `alertBarProps` in [`ClientsContent.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminClients/ClientsContent.jsx) had an unconditional `if (loading) return { message: 'Loading client records...', type: 'info' };`. Because `statusFilter` was passed to `loadClients` which called `setLoading(true)`, selecting any filter immediately wiped the AlertBar.
  2. The counts used for `alertBarProps`, `KpiCard`s, and `FilterChipGroup` were derived from `clients` (the paginated/filtered response of the active filter) instead of persistent global counts across all statuses. Clicking "Active" caused `pendingClients` to drop to 0, clearing the high-priority pending verification warning from the status bar.
  3. `<KpiCard>` components bound their `isLoading` state to the transient table loading state, causing them to flicker and flash skeleton placeholders during filter switches.
- **Prevention**:
  1. Decouple top-level system status bars and KPI metrics from transient table filter and page states. Top-level status banners should reflect overall system health / account state, not mirror the filtered table subset.
  2. Maintain a separate `counts` state aggregated globally (via Firestore `getCountFromServer` or backend server aggregation counts in `getClients`).
  3. Separate initial page load state (`initialLoading`) from table row query state (`tableLoading`), ensuring KPI cards and status banners stay stable while the table updates.

## [2026-10-18] Tenant Branch Identity Governance: Branch Names Must Be Immutable to Operators and Admin-Exclusive
- **Problem**: Operators were previously able to edit their assigned branch name in the Operator Profile View, creating the risk of unauthorized branch rebranding, naming drift, and desynchronization with official franchise records and client receipts.
- **Root Cause**:
  1. Frontend profile edit form ([`ProfileEditModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/ProfileEditModal/ProfileEditModal.jsx)) provided an editable text input for `branchName` to operators and required it on submission.
  2. Backend profile endpoint ([`authController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/authController.js)) blindly processed `branchName` and `name` from `updates` without checking if the acting user was an operator.
- **Prevention**:
  1. Tenant/franchise identity attributes (such as `branchName`) must be strictly immutable to tenant operators. Only Head Office Super Administrators may alter branch names via administrative operator management endpoints ([`operatorController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/operatorController.js) `PATCH /api/operators/:id`).
  2. Enforce zero-trust guards on self-service profile endpoints: if an operator attempts to submit `branchName` or `name`, reject immediately with `403 Forbidden`.
  3. Render immutable governance attributes in the UI as strictly `readOnly` and `disabled`, complete with visual lock pills and explanatory helper captions informing users that branch names are assigned exclusively by Head Office.
  4. Separate authorized representative details (`fullName`) from organizational branch identity (`branchName`), allowing operators to update their designated contact person without altering branch naming.

## [2026-10-12] Orphaned Mutation Records & Firestore Map Staling in Aggregation Documents
- **Problem**: Total Revenue KPI card in the Admin Header displayed ₱59,188 while the Performance Overview card in the Analytics tab displayed ₱40,388, causing a discrepancy in reported revenue.
- **Root Cause**:
  1. The `payments` and `activeServices` collections contained orphaned test records referencing an obsolete operator (`USR-OPR-hLtV3RFWzgPtuIM2C9Wn`, Branch "Test") whose account had been purged from the `users` collection.
  2. The analytics engine correctly calculated operator metrics based on registered operators in `users` (2 operators: Baliuag with ₱40,388 and Apalit with ₱0), whereas `system_stats/revenue` previously accumulated the orphaned payment. Additionally, updating `system_stats/revenue` with `{ merge: true }` caused deleted operator keys in the `operators` map to persist indefinitely.
- **Prevention**:
  1. Always ensure data integrity by auditing foreign references: records in `payments` and `activeServices` must strictly belong to active, registered operators in `users`.
  2. When pruning or recalculating aggregation documents (`system_stats/revenue`), do not use `{ merge: true }` without explicitly deleting stale keys (`admin.firestore.FieldValue.delete()`), or overwrite the document cleanly so obsolete operator IDs are completely removed.
  3. Ensure cleanup scripts cross-reference the canonical `users` table to detect and delete orphaned records across related collections (`payments`, `activeServices`, `receipts`).

## [2026-10-12] Firestore Real-Time Metric Scaling: Dedicated Aggregation Document vs Collection Scanning
- **Problem**: Querying or subscribing with `onSnapshot` to an entire collection (e.g. `payments` where `status == 'PAID'`) to compute a single dashboard scalar KPI (e.g. `totalRevenue`) transfers all $N$ documents over the network on every load, consuming excessive bandwidth, compute, and Firestore document read quotas.
- **Root Cause**: Real-time push listeners on collections download all matching documents to compute sums client-side because Firestore does not support reactive `sum()` stream queries across collection snapshots.
- **Prevention**: For platform-level scalar metrics and KPIs, maintain a dedicated aggregation/counter document (e.g. `system_stats/revenue`). Use server-side ACID transactions (`admin.firestore.FieldValue.increment`) on payment mutations in the backend to keep it perfectly updated, and have frontend layout listeners subscribe strictly to that single document (1 document read, instant real-time push).

## [2026-10-06] Client Requirements File State Wiping & File Input Value Persistence
- **Problem**: In `QuotationAttachRequirementsModal`, when a client selected a file for a mandatory requirement, the selection would intermittently be wiped out / reset to `null` before submission, and re-selecting the same file after removing it failed to trigger the input `onChange` handler.
- **Root Cause**:
  1. `useEffect` with `[requirementItems, existingSubmitted]` dependency blindly reset `inputs` state with `{ file: null }` whenever `existingSubmitted` finished loading or updated, overwriting any freshly selected `File` object in state.
  2. When removing or replacing a file, the `<input type="file">` DOM element's `.value` was not cleared, preventing the browser from firing an `onChange` event if the user chose the same file again.
  3. The `accept` filter attribute omitted valid document formats (`.xls`, `.xlsx`, `.ppt`, `.pptx`, `.webp`, `.gif`) supported by the backend file upload pipeline.
- **Prevention**:
  1. Always use functional state updates (`setInputs(prev => ...)`) that preserve user-selected `file` objects and text values when pre-filling or syncing external asynchronous data.
  2. Explicitly clear the native `<input type="file">` element's `.value = ''` upon removal or error so that `onChange` reliably triggers on every file selection.
  3. Ensure file input `accept` attributes consistently match the full whitelist in `fileSecurity.js`.

## [2026-10-06] Modal Stacking Context Viewport Clipping & Incomplete Receipt Data Normalization
- **Problem**: When opening the Official E-Receipt preview modal on the public landing page, the top toolbar (title, Print, Download PDF, and Close buttons) was partially clipped/tucked under the sticky navigation header. Additionally, the "BILLED & ISSUED TO" section only displayed placeholder text ("Valued Client") and missing quotation/payment references ("N/A", "PAY-CONFIRMED").
- **Root Cause**:
  1. `PdfDocumentView` was rendered inline within the component hierarchy without `createPortal(..., document.body)` and used flexbox `align-items: center` with `max-height: 90vh`. When rendered on pages with sticky headers or ancestor stacking contexts, tall A4 documents were pushed upward and clipped off the top of the viewport.
  2. The public tracking controller endpoint constructed an abbreviated `receiptSummary` payload that omitted `clientName`, `contactPerson`, `quoteNo`, `quotationId`, `paymentId`, and itemization fields, causing the client-side receipt normalizer to fall back to generic defaults.
- **Prevention**:
  1. Always render full-screen document preview and PDF export modals directly onto `document.body` using `ReactDOM.createPortal`.
  2. Use `align-items: flex-start`, top padding (e.g. `3rem`), `overflow-y: auto`, and sticky header toolbars (`position: sticky; top: 0; z-index: 20`) on modal containers so top actions are never unreachable or cut off on smaller screens.
  3. Ensure backend tracking summaries and public document endpoints return complete client and transaction metadata while preserving privacy masking standards.

## [2026-10-04] Misclassifying Client's Service Intake Specifications as Agency Document Requirements
- **Problem**: When a client submitted a service inquiry (`SAF-01-002`), the backend synthesized a fake document requirement `{ name: 'Specified Requirements of Client', value: specifiedRequirements }` in the `submitted_requirements` collection. This caused the client's desired service description to be rendered in document attachment grids and quotation requirement checklists as an unfulfilled file requirement rather than the client's service specifications.
- **Root Cause**: In `fly-api/src/controllers/inquiryController.js`, `createInquiry` contained a fallback: `resolvedSpecReqs ? [{ name: 'Specified Requirements of Client', value: resolvedSpecReqs, required: false }] : []`. This conflated "Specified Requirements of Client" (what the client needs/wants from the agency's service) with agency document requirements (documents/files the agency needs from the client, such as Valid ID or Birth Certificate).
- **Prevention**: Never store client-facing service specifications or intake notes as entries in document requirement collections (`submitted_requirements`). Keep `specifiedRequirements` strictly as an intake specification string on the inquiry document. Only instantiate `submitted_requirements` records when actual document checklist items or uploaded files are provided. Always filter out pseudo-requirement names across controllers, modals, and PDF generators.

## [2026-10-02] Undeclared 'now' Timestamp Variable Causing 500 Internal Server Error in Appointment Creation
- **Problem**: When a client or operator attempted to schedule a branch appointment via `POST /api/appointments`, the request failed with HTTP `500 (Internal Server Error)`.
- **Root Cause**: In `fly-api/src/controllers/appointmentController.js`, `createAppointment` constructed the `newAppointment` payload with `createdAt: now` and `updatedAt: now`, but `const now = new Date().toISOString();` had not been declared in the function scope. This triggered an unhandled `ReferenceError: now is not defined`, throwing into the catch block and returning a 500 response.
- **Prevention**: Always declare timestamp variables (`const now = new Date().toISOString();`) before referencing them in model constructions, or use inline timestamp generators (`new Date().toISOString()`). Run automated static analysis or scope checkers across controllers to verify that identifiers like `now` are never referenced out of scope.


## [2026-09-30] Over-Pruning Operational 'remarks' Field as Redundant During Normalization
- **Problem**: During Firestore data normalization on `inquiries`, the `remarks` field was erroneously treated as a duplicate alias of `notes` and slated for deletion, breaking operator workflow and contradicting the audit summary table.
- **Root Cause**:
  1. The normalization audit's summary table only flagged duplicate contact aliases (`fullName` vs `clientName`, `cellphone` vs `phoneNumber`), but Section 5 of the audit artifact included an exploratory row proposing to merge `remarks` into `notes`.
  2. In FairFly, `notes` historically captured raw client intake notes or specified requirements, whereas `remarks` is an active operational feature (used for operator remarks, review notes, special instructions on form `SAF-01-002`, modals, and PDFs). Treating them as synonymous was a false positive.
- **Prevention**:
  1. Never delete or merge fields based solely on textual similarity without checking their semantic role in UI forms, modals, PDF templates, and user workflows.
  2. Always strictly align field removal actions with the approved scope in the audit summary table.
  3. Formally protect active operational commentary fields (such as `remarks`) from automated pruning by codifying their retention in repository rules (`normalization-guidelines.md`).

## [2026-09-30] Operator Walk-In Intake Misattributed clientUid to Operator Account
- **Problem**: When an operator created an inquiry for a walk-in client and subsequently generated a quotation, the quotation and inquiry never appeared in the client's account portal even though the client had a registered account in the system.
- **Root Cause**: `createInquiry` used `const effectiveClientUid = req.user?.uid || clientUid || null;`. When an operator submitted the request, their own JWT token `req.user.uid` took precedence, tagging the operator's UID as the `clientUid`. The quotation inherited this corrupted UID. In `ClientTrackingPage`, queries filter by `where('clientUid', '==', user.uid)`, returning 0 results, and Firestore rules prevented unauthorized access.
- **Prevention**: Never default `clientUid` to `req.user.uid` when the caller is staff (`operator`, `branch_operator`, `admin`). When recording walk-in client intakes, perform authoritative server-side user resolution by checking the `users` collection for `where('role', '==', 'client')` and matching the client's registered email address. Also discard staff UIDs if mistakenly passed as `clientUid` in downstream quotation workflows.

## [2026-08-23] Undefined Function Reference in Resource Modal Handler
- **Problem**: Runtime `ReferenceError: handleSubmitResource is not defined` occurred in `<ResourcesContent>` component when rendering `ResourceModal`.
- **Root Cause**: During refactoring of `ResourcesContent.jsx` to the new service layer (`resourceService.js`), the handler was renamed to `handleFormSubmit`, but the JSX prop `<ResourceModal onSubmit={handleSubmitResource} />` was not updated to match the new handler name.
- **Prevention**: Always perform a complete reference cross-check across all JSX props, callbacks, and handler bindings within the component after renaming functions or refactoring API submission methods.

## [2026-08-23] Unsafe String Method Calls on Dynamic / Heterogeneous Firestore Data
- **Problem**: `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` in `ServiceDetailPage.jsx` when mapping service requirements.
- **Root Cause**: Requirements in Firestore can be strings or objects with varying field naming conventions (`inputType`, `type`, or omitted altogether). Calling `.toUpperCase()` directly on `req.inputType` without a fallback default caused the crash when `req.inputType` was undefined.
- **Prevention**: Always sanitize and provide safe fallbacks for nested object properties before invoking string transformation methods (e.g. `String(req.inputType || req.type || 'text').toUpperCase()`).

## [2026-08-26] Undefined Result Variable in Component Filter Memoization
- **Problem**: `ReferenceError: result is not defined` in `ClientAppointmentsPage.jsx` when filtering appointments.
- **Root Cause**: During the search debouncing refactor, the initial assignment `let result = appointments || [];` and the `activeTab` filter check were accidentally truncated in the `useMemo` body.
- **Prevention**: Always verify variable declarations inside `useMemo` hooks and ensure test builds cover client-side rendering pathways.

## [2026-08-26] Incorrect Arguments Passed to Firebase Service Document Helpers
- **Problem**: 500 Internal Server Error `Value for argument "documentPath" must point to a document, but was "users". Your path does not contain an even number of components.` when updating an administrator.
- **Root Cause**: `updateToDatabase` and `deleteFromDatabase` in `firebaseService.js` expect a full document path string `(path, data)` where `path = `${collection}/${id}``. In `adminController.js`, `updateToDatabase` was called with 3 separate arguments `(COLLECTIONS.USERS, id, data)`, causing `path` to be evaluated as `'users'`.
- **Prevention**: Always verify the helper signature in `firebaseService.js`. Use template literals `${collection}/${id}` when calling single-path document update/delete operations.

## [2026-08-26] Custom Cache Method Naming Mismatch
- **Problem**: `userCache.del is not a function` in `adminController.js`.
- **Root Cause**: The custom `Cache` implementation defined `.delete(key)` based on the native ES6 `Map.prototype.delete`, but Node-Cache/Redis convention `.del(key)` was called in `adminController.js`.
- **Prevention**: Provide explicit aliases on custom utility classes (e.g. `del` aliasing `delete`) to ensure compatibility with standard idioms.

## [2026-08-26] Firebase Storage Upload Permissions & Image Display Failures
- **Problem**: Uploaded files/images returned 403 Forbidden ("no perms") and service images failed to render (displaying only broken alt text).
- **Root Cause**: When uploading through Firebase Admin SDK on buckets with Uniform Bucket-Level Access enabled, `makePublic()` is blocked, and generating a media URL without a `firebaseStorageDownloadTokens` metadata token results in access denied errors for public clients.
- **Prevention**: Always generate a UUID `downloadToken` (via `crypto.randomUUID()`) and attach it to the file's custom metadata `metadata: { firebaseStorageDownloadTokens: downloadToken }` when saving to the bucket, and include `&token=${downloadToken}` in the returned download URL. Additionally, always equip frontend `<img>` tags with `onError` handlers that swap broken image elements for semantic category fallback containers.

## [2026-08-26] Undefined Helper Function in Resource Card Mapping
- **Problem**: `ReferenceError: getFileTypeInfo is not defined` in `OperatorResources.jsx`.
- **Root Cause**: The helper was defined as `getFileMeta`, but invoked as `getFileTypeInfo` within the card rendering loop. Additionally, `handlePreview` was referenced in the preview button onClick without an implementation.
- **Prevention**: Ensure all component-level helper functions and action handlers referenced in JSX render callbacks are defined in the module scope and have matching identifiers.

## [2026-08-27] Stale Express Server Instance Serving Old Routing Table
- **Problem**: Frontend returned 404 `Endpoint not found` when sending requests to new endpoints (`/api/auth/client-forgot-password`).
- **Root Cause**: The Express backend (`fly-api`) was running via a static `node server.js` process started prior to adding the new routes, which did not hot-reload new route modules.
- **Prevention**: Always verify that the API server is actively running with `nodemon` (e.g. `npm run dev`) or restart the running background process when adding or modifying backend controllers and routes. Also provide route aliases for common path variations.

## [2026-08-26] Missing Component Import in Routing Element
- **Problem**: `ReferenceError: Link is not defined` in `OperatorQuotations.jsx`.
- **Root Cause**: `Link` was used in the card view action button, but only `Outlet` was imported from `react-router`.
- **Prevention**: Verify all router components (`Link`, `NavLink`, `Outlet`, `useNavigate`) used in JSX are explicitly included in module imports.

## [2026-08-26] Chat Conversation Deduplication & Route State Persistence
- **Problem**: Starting a conversation with an existing contact or support lead opened a duplicate conversation instead of selecting the existing conversation thread.
- **Root Cause**: Route navigation with `location.state` left `partnerId` in browser history without clearing it, causing repeated creation calls; and frontend creation/selection did not check the loaded `conversations` list first before requesting a new conversation from the backend API.
- **Prevention**: Always perform client-side cache lookups against loaded conversations before invoking creation APIs, clear one-time navigation state using `navigate(location.pathname, { replace: true, state: {} })`, and enhance backend lookup queries to search bidirectional array containment.

## [2026-08-27] React Hook Call Order Violation Caused by Early Conditional Return
- **Problem**: `Error: Rendered more hooks than during the previous render` in `OperatorsContent.jsx`.
- **Root Cause**: `useMemo` hooks for calculating KPI counts were placed below an early conditional return `if (operatorLoading) return (...)`, violating the Rules of Hooks by running different numbers of hooks depending on the loading state.
- **Prevention**: Strictly declare all React hooks (`useState`, `useMemo`, `useEffect`, `useCallback`, etc.) at the very top of the functional component before any conditional returns or branching logic.

## [2026-08-27] Rendering Heterogeneous / Legacy Inquiry Data and String Concatenation
- **Problem**: In Admin / Operator Inquiry Detail pages, "Service Requirements & Uploaded Attachments" and "Remarks & Internal Notes" displayed `[object Object]` or duplicate concatenated text like `Stuffs | Remarks: none`.
- **Root Cause**: 
  1. Older inquiry records in Firestore stored `requirements`, `notes`, or `remarks` as raw Objects or Arrays of objects. When JSX evaluated `{inquiry.notes}` or `{inquiry.remarks}`, rendering an object resulted in `[object Object]`.
  2. Legacy versions of `CreateInquiryFormModal.jsx` concatenated user input into a single `notes: form.requirements + ' | Remarks: ' + form.remarks` string. When either field fell back to `notes`, both cards showed the identical concatenated string `Stuffs | Remarks: none`.
- **Prevention**: Always pass heterogeneous/legacy document fields through a centralized parser (like `parseInquiryData`) that inspects types, safely extracts text from objects/arrays, parses legacy delimiter strings (` | Remarks: `), and never renders raw objects directly in JSX.

## [2026-09-03] Stale Identifier Reference in RecordDetailLayout Prop
- **Problem**: `Uncaught ReferenceError: isConfirmed is not defined at InquiryFormDetailPage (InquiryFormDetailPage.jsx:233:19)`.
- **Root Cause**: During the Inquiry $\to$ Quotation workflow overhaul, the old confirmation state logic was replaced by dynamic status badge mapping (`getStatusBadgeType()`), but the prop `statusType={isConfirmed ? 'success' : 'warning'}` on `<RecordDetailLayout>` was left referencing the retired variable `isConfirmed`.
- **Prevention**: When replacing an older state or workflow pattern with a newer one, search the entire file for any remaining occurrences of the retired variable or function names before shipping.

## [2026-09-03] Unscoped Constant Mapping in Refactored Modal Form
- **Problem**: `Uncaught ReferenceError: PRIORITIES is not defined at CreateTicketModal (CreateTicketModal.jsx:234:18)`.
- **Root Cause**: During inline CSS refactoring and component cleanup, `<select name="priority">` was rewritten to map over `PRIORITIES.map(...)`, but `PRIORITIES` was not defined at the top of `CreateTicketModal.jsx`.
- **Prevention**: Whenever mapping options over an array constant in JSX, verify that the constant is explicitly exported/imported or defined at the module level in the same file. Always test the modal trigger or verify imports across JSX templates.

## [2026-09-26] Flawed Conditional Fallback In Multi-Tenant Operator Scoping
- **Problem**: In Operator Dashboard and Layout, active service fulfillments were shared across all operators when an operator had no assigned services. Furthermore, when an operator or client accepted a quotation, the operator's active procedures suddenly displayed only that specific quotation and all other active services were removed from the view.
- **Root Cause**: 
  1. `OperatorDashboard.jsx` implemented a conditional fallback: `if (assigned.length > 0) list = assigned;`. If an operator had zero assigned services (`assigned.length === 0`), `list` fell back to `dbServices` (the global array containing every operator's active services).
  2. The moment a quotation was accepted for that operator, `assigned.length` became 1, so the condition became true and `list` switched to only that single quotation record, causing all other previously visible services to vanish.
  3. `OperatorLayout.jsx` had a matching `userHasScoped` check that leaked total system counts to operators who had no records assigned to their branch.
  4. Backend controller queries did not enforce role-based ownership on operator GET requests, and intake forms risked assigning the submitting client's UID as the operator when branch selections were absent.
- **Prevention**: Never use `if (filtered.length > 0)` as a fallback for user/tenant scoping. If a tenant or operator has 0 assigned records, the collection MUST evaluate to an empty list `[]` and show an appropriate empty state, never falling back to global data. Always enforce tenant/operator scoping at both the frontend useMemo level and the backend API controller level.

## [2026-09-26] Firebase Auth SCRYPT Hash Import Requires Project-Specific Signer Key
- **Problem**: Users were unable to log in with their existing passwords after migrating Firebase Auth accounts using `auth.importUsers()`, receiving `INVALID_LOGIN_CREDENTIALS` / `auth/invalid-credential`.
- **Root Cause**: Firebase Auth uses a project-specific SCRYPT configuration including a secret `signerKey` and `saltSeparator`. When importing users, passing empty dummy values (`Buffer.from('')`) caused Firebase to register the password hashes under an empty key. When users subsequently attempted to log in, Firebase evaluated the password with the project's real signer key, causing hash mismatches and login rejections.
- **Prevention**: When migrating or importing Firebase Auth password hashes, always retrieve the official project hash configuration via Google Cloud Identity Toolkit API (`https://identitytoolkit.googleapis.com/admin/v2/projects/{projectId}/config`) to obtain the exact base64 `signerKey` and `saltSeparator`. Never import SCRYPT hashes with blank dummy keys.

## [2026-09-26] Missing Rules for Client-Read Collections in Firestore Security Rules
- **Problem**: Runtime `Error in subscribeToAnnouncements: FirebaseError: Missing or insufficient permissions` occurred when subscribing to announcements via `chatService.js`.
- **Root Cause**:
  1. The `announcements` collection was subscribed to client-side via `onSnapshot`, but had no match block in `firestore.rules`. Firestore defaults to denying all reads and writes for unmatched collections.
  2. Simply saving a local `firestore.rules` file in the repository does not push changes to the live cloud project until deployed.
- **Prevention**:
  1. Whenever a collection is read or written directly on the frontend via Firestore client SDK (`onSnapshot`, `getDocs`, `setDoc`), ensure explicit match rules are declared in `firestore.rules` with strict role and authentication guards.
  2. Deploy security rules to the live project using the Firebase Rules API (`https://firebaserules.googleapis.com/v1/projects/{projectId}/rulesets` and `/releases/cloud.firestore`) using the project's service account credentials or Firebase CLI.

## [2026-09-27] Unmemoized Default Object/Array Arguments in Custom Hooks Causing Rapid Query Infinite Loops
- **Problem**: Navigating to Admin Quick Links (`/admin/quick-links`) caused the browser tab to lag severely, freeze, and crash due to repeated, nonstop network queries.
- **Root Cause**:
  1. In `useFirestorePagination.js`, parameter defaults like `filters = []` evaluated to a fresh array reference on every single component render when omitted by the consuming component (e.g. `QuickLinksContent.jsx`).
  2. `fetchCount` was wrapped in `useCallback(..., [..., filters])`, causing `fetchCount` to change identity every render.
  3. A `useEffect` invoked `fetchCount()`, which executed `getCountFromServer` and called `setTotalItems()`.
  4. State mutation triggered a component re-render, repeating the cycle hundreds of times per second.
  5. Consuming components also declared duplicate `getCountFromServer` effects, multiplying the request barrage.
- **Prevention**:
  1. Never use inline object/array literals as hook parameter defaults without module-level constants (e.g. `const EMPTY_FILTERS = []`).
  2. Store complex non-primitive parameters (`filters`, callback functions) in React `useRef` to decouple effect triggers from object identity changes.
  3. Restrict `useEffect` dependency arrays strictly to primitive, stable identifiers (`collectionName`, `filterKey`, `pageSize`, `currentPage`, `searchTerm`).
  4. Return centralized counts (`totalItems`, `unfilteredTotal`, `refetchCount`) from the hook to eliminate duplicate count fetches in components.

## [2026-09-27] Destructured Array Identifier Mismatch in Subordinate useMemo Hooks
- **Problem**: Runtime `Uncaught ReferenceError: service is not defined at ServiceContent (ServiceContent.jsx:387:7)` crashed the Admin Services page.
- **Root Cause**: When refactoring `ServiceContent.jsx` to `useFirestorePagination`, the returned data array was renamed to `data: services` (plural), but a downstream `alertBarProps` memoization block was referencing `service` (singular).
- **Prevention**: Whenever renaming or aliasing destructured hook return values, conduct a project/file-wide audit of all references to the previous identifier, and utilize TypeScript/ESLint checks to catch undeclared variables before deployment.

## [2026-09-27] allowedFields Middleware Omission of Client Submitted Requirements & Source
- **Problem**: Submitting a service request from the client-side Service Store modal (`ClientServiceRequestModal.jsx`) failed with HTTP 400 `Invalid fields in request body`.
- **Root Cause**: The route `POST /api/services/active` in `activeServiceRoutes.js` guarded the request with `allowedFields(ACTIVE_SERVICE_ALLOWED_FIELDS)`, but omitted `submittedRequirements` and `source` from the allowed array, causing Express middleware to reject the valid client request payload.
- **Prevention**: When defining route-level `allowedFields` whitelists, cross-reference all frontend components that POST to that route (`ClientServiceRequestModal.jsx`, `AddServiceModal.jsx`) and include all supported schema fields (`submittedRequirements`, `source`, etc.) in the whitelist.

## [2026-10-02] Incomplete allowedFields Whitelist on Admin Account Creation Route
- **Problem**: Creating a new Support Administrator from the Admin portal (`AdminForm.jsx`) failed with HTTP 400 Bad Request ("Invalid fields").
- **Root Cause**: The route `POST /api/admins` in `adminRoutes.js` guarded payloads with `allowedFields(['email', 'password', 'username', 'fullName', 'phone', 'assignedOperators'])`. However, `AdminForm.jsx` included `name` (to support display name fallbacks) and `status` (`'Active' | 'Inactive'`), which were omitted from the whitelist, triggering an immediate 400 rejection before reaching the controller.
- **Prevention**: Whenever adding or modifying form fields in frontend modals, always verify that the corresponding backend route whitelist (`allowedFields`) and controller handlers permit the exact fields sent. Additionally, configure `allowedFields` middleware to return the rejected field names in the error response for rapid root cause diagnosis.

## [2026-10-02] allowedFields Middleware Omission of type and serviceType on Workflow Template Routes
- **Problem**: Creating or editing workflow templates from the Admin Portal (`/admin/workflows`) failed with HTTP 400 Bad Request ("Invalid fields in request body: type, serviceType").
- **Root Cause**: `WORKFLOW_TEMPLATE_FIELDS` in `workflowRoutes.js` omitted `type` and `serviceType`, even though `WorkflowForm.jsx` submits both to categorize process workflows (e.g., PSA, Visa, Passport).
- **Prevention**: Ensure data dictionary and route schemas define all metadata/classification fields (`type`, `serviceType`, `category`) that UI forms provide for catalog and workflow entities.

## [2026-10-02] Incomplete allowedFields Whitelist on Ticket Creation & Obsolete Flex Wrapper Divs
- **Problem**: 
  1. Creating a support ticket from the Admin portal (`CreateTicketModal.jsx`) failed with HTTP 400 Bad Request ("Invalid fields in request body: operatorId, operatorName, operatorEmail").
  2. The Admin Tickets page (`TicketsContent.jsx`) displayed zero margin spacing between the KPI metrics cards and the table card.
- **Root Cause**: 
  1. `TICKET_ALLOWED_FIELDS` in `ticketRoutes.js` only included `['title', 'category', 'priority', 'initialMessage']`, omitting the operator identity fields sent when creating tickets on behalf of branches.
  2. `TicketsContent.jsx` retained retired `<div className="tickets-layout-single"><section className="tickets-left-pane">` wrapper elements with no flex gap or margin styling, breaking the layout cascade from the parent `.tickets-page`.
- **Prevention**: 
  1. When forms allow cross-account actions (like admin-on-behalf-of-branch creation), ensure foreign key and profile fields (`operatorId`, `operatorName`, `operatorEmail`) are included in route whitelists.
  2. Avoid unstyled intermediate wrapper `<div>` and `<section>` tags between flex parents and child cards; adhere to the top-level standard structure (`page-fade-in` > `services-summary-grid` > `card`).

## [2026-10-02] Redundant Embedded User Details and Status Fields in Firestore Documents
- **Problem**: Ticket documents and their embedded `messages` array stored redundant copies of `operatorName`, `operatorEmail`, `senderName`, `senderRole`, and duplicate closing indicators (`closedBy` alongside `closedAt`). This bloated Firestore document sizes and resulted in 400 Bad Request errors when forms submitted extraneous identity fields instead of deriving them from foreign keys (`operatorId`, `senderId`).
- **Root Cause**: Denormalizing display names and roles directly into every nested message item without utilizing state caching or relational user lookups, and storing redundant closing metadata (`closedBy` and `closedAt`) simultaneously.
- **Prevention**: Store only primary foreign keys (`operatorId`, `senderId`) and essential content (`id`, `message`, `createdAt`) in database records and thread messages. Resolve participant display details (`name`, `role`, `email`) once on the backend or cache them in frontend component state (`participants` map in `TicketThread.jsx`), eliminating repetitive Firestore lookups and document bloat. Standardize terminal states on a single timestamp field (`closedAt`).

## [2026-10-02] Minified React Error #310 from Modal Hook Order and Unmounted Modal Lifecycles
- **Problem**: Clicking 'View Files' in the Service History table crashed the React application with `Uncaught Error: Minified React error #310` ("Rendered more hooks than during the previous render") at `useSubmittedRequirements` in `HistoryDetailModal`.
- **Root Cause**: 
  1. `HistoryDetailModal` had an early return `if (!isOpen || !data) return null;` placed before downstream custom hook invocations in an earlier revision, causing the hook count to change between when the modal was closed (`isOpen=false`) and opened (`isOpen=true`).
  2. The parent page (`OperatorHistory.jsx`) mounted `<HistoryDetailModal>` continuously in the DOM even when closed, causing it to participate in every render pass with fluctuating parameters.
  3. Extraneous fallback parameters and checks (`submittedRequirements`, `requirements`) bloated the query logic instead of relying on a clean single foreign key (`submittedRequirementsId`).
- **Prevention**:
  1. Never place early returns before hook calls. All hooks (`useLightbox`, `useSubmittedRequirements`, `useMemo`) must be invoked unconditionally at the very top level of functional components.
  2. Conditionally mount modals in parent components (`{isModalOpen && selectedRecord && <HistoryDetailModal ... />}`), ensuring the child only mounts when active and completely unmounts when closed.
  3. Keep requirement queries lean: look up by `submittedRequirementsId` directly, and show the empty state simply when `!submittedDocs || submittedDocs.length === 0`.

## [2026-10-18] Omission of Terminal & Commercial Statuses from UI Badge Color Class Mappings
- **Problem**: In the Operator Inquiry Forms module, inquiries with status `'paid'` were displayed with an amber/yellow pending warning badge on the list view and a completely colorless/washed-out gray badge on the detail view. Statuses such as `'quotation_created'` and `'quotation_sent'` were rendered with raw snake_case underscores (`quotation_created`).
- **Root Cause**: 
  1. Frontend status mappers only matched a subset of positive lifecycle states (`accepted`, `confirmed`, `completed`, `active`), omitting `'paid'` and `'fulfilled'`. Any unmatched status fell back to `'status-pill-pending'` (yellow) on list views or `'neutral'` (gray) on detail layouts.
  2. Status strings were displayed raw (`form.status`) without string sanitation or underscore replacement.
- **Prevention**: Always build centralized or comprehensive status mapper utilities that account for the full entity lifecycle (`submitted`, `quotation_created`, `quotation_sent`, `accepted`, `paid`, `completed`, `fulfilled`, `rejected`, `cancelled`, `archived`). Sanitize display strings with `.replace(/_/g, ' ')` before rendering in badges.

## [2026-10-18] Hardcoded Mock Fallbacks Causing Cross-Portal Data Mismatches & Tab Count Bleed
- **Problem**: 
  1. Operator QuickLinks displayed four links under Visa ("US Embassy Manila", "VFS Global", "BLS International", "Japan Visa") that did not exist in Firestore or on the Admin QuickLinks management page.
  2. When switching tabs in the Operator QuickLinks or Workflows tab strip, the `(n)` count badge on ALL tab headers changed simultaneously to mirror whichever tab was currently open.
- **Root Cause**:
  1. `OperatorQuickLinks.jsx` defined a hardcoded mock object `DEFAULT_LINKS` and fell back to it whenever a category had 0 database documents (`if (filtered.length > 0) ... return DEFAULT_LINKS[active]`). This created "phantom" records on the operator side that the Admin could neither view, edit, nor delete in Firestore.
  2. The tab strip rendered `{tab} ({activeCategoryLinks.length})` inside the `TABS.map(...)` iteration. This referenced the item count of the *active* tab across every button, rather than computing counts per tab category independently.
- **Prevention**:
## [2026-10-19] Allowed Fields Rejection During Record Duplication (Destructuring Full Database Objects)
- **Problem**: When operators or admins attempted to duplicate a workflow template (from either their own branch, other branches, or Head Office global templates), the operation failed with `Bad Request: Invalid fields in request body (createdBy, createdByRole, branchUid)`.
- **Root Cause**:
  1. **Full Database Object Forwarding**: The frontend `handleDuplicate` function used destructuring (`const { id, createdAt, updatedAt, version, status, ...rest } = tmpl;`) and sent `{ ...rest, name: `${tmpl.name} (Copy)` }` directly to `POST /api/workflow/templates`.
  2. Because `tmpl` originated from Firestore, it retained system-managed ownership metadata (`createdBy`, `createdByRole`, `branchUid`, `branchName`).
  3. The zero-trust `allowedFields(WORKFLOW_TEMPLATE_FIELDS)` middleware strictly rejected these untrusted ownership fields before reaching the controller.
- **Prevention**:
  1. **Dedicated Backend Duplication Endpoints**: Implement dedicated duplication endpoints (`POST /api/workflows/:id/duplicate`) that fetch source records directly from the database server-side, clone the content, and assign ownership authoritatively to the acting user's session without exposing or accepting client-spoofed foreign keys.
  2. **Strict Payload Construction on Frontend**: Never use wide spread destructuring (`{ ...rest }`) on database entity objects when creating new records. Explicitly construct payloads containing only valid schema-whitelisted specification fields (`name`, `description`, `serviceType`, `steps`, `status`).


