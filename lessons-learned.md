# Lessons Learned
# A File for Agents to write their mistakes so that next runs can prevent doing the same thing (Automatic Improvement)

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

