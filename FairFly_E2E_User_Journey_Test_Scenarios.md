# FairFly End-to-End Black-Box User Journey Test Strategy & Scenarios

**Document Version:** 1.0.0  
**Role:** Senior QA Architect and Software Test Strategist  
**Target System:** FairFly Travel & Visa Processing Platform (`fair-fly` React SPA & `fly-api` Express / Cloud Firestore Backend)  
**Date:** 2026-09-29  

---

## 1. Codebase Exploration & Architecture Discovery

### 1.1 Architecture & Integration Topology
The FairFly system is architected as a modular single-page React application (`fair-fly`) backed by a centralized Node.js/Express REST API (`fly-api`) and Google Cloud Firestore.
- **Client Read Engine:** UI data feeds, active trackers, direct messaging, and status updates consume Firestore directly via `onSnapshot()` listeners for real-time reactivity and optimized bandwidth.
- **Server Mutation Engine:** All Create, Update, Delete (CUD) operations, token issuance, cryptographic verification, role checks, and financial state transitions are strictly processed server-side via `fly-api` under a strict *"Never Trust the Client"* design model.
- **Security & RBAC Enforcement:**
  - Token verification via Firebase Admin SDK (`verifyFirebaseToken`).
  - Strict Role-Based Access Control (`requireRole(['client', 'operator', 'admin'])`).
  - Super Admin elevation barriers (`requireSuperAdmin`) for operator creation, administrative privilege assignment, operator qualifications, and operator password resets.
  - Strict input whitelisting via `allowedFields([...])`.
  - Rate limiting via sliding-window middleware (`publicRateLimiter`, `apiRateLimiter`).
  - Immutable audit logging for administrative mutations via `adminLogger.js` (`adminAuditLogs`).

### 1.2 Core Domain Modules
1. **Authentication, Onboarding & Identity KYC:** Client registration with Philippine government ID upload, 6-character email code verification, Admin KYC appraisal (approval/rejection), and tokenized ID re-upload.
2. **Franchise Acquisition & Operator Account Provisioning:** Public franchise application with Philippine Standard Geographic Code (PSGC Cloud API) cascading addresses, custom dynamic schema fields, administrative evaluation, and Super Admin operator account provisioning.
3. **Service Catalog & Workflow Template Governance:** Global travel/visa catalog management, reusable multi-step workflow templates, and branch-exclusive service procedure customization.
4. **Client Inquiry, Quotation Generation & Acceptance:** Client customized service inquiries with requirement attachments, branch operator itemized quotation drafting, quotation dispatch, and client acceptance.
5. **Payment Processing & Atomic Service Activation:** PayMongo hosted checkout integration (GCash, Credit Card, Maya), cryptographic HMAC-SHA256 webhook validation, client redirect verification, and ACID-compliant atomic transaction creating active service fulfillment.
6. **Active Service Execution, Step Progression & Fulfillment Tracking:** Milestone-by-milestone step state progression, verification checklists, client real-time tracker reflection, and cancellation/refund handling.
7. **Branch Appointments & Consultation Scheduling:** In-branch consultation booking, operator slot confirmation, rescheduling, and physical visit completion.
8. **Communications, Support Ticketing & Direct Messaging:** Real-time direct chat between clients and operators, escalated operator-to-admin support ticket threading, system announcements, and automated AI chatbot assistance.
9. **Operator Qualification Tiers & Super Admin Governance:** Branch operator qualification applications, accreditation document verification, and Super Admin tier elevation.

### 1.3 Key User Personas & Roles
- **Guest / Prospective Franchisee:** Unauthenticated visitor exploring public catalog services, booking consultation inquiries, or submitting branch franchise applications.
- **Unverified / Pending Client:** User who completed registration and submitted government ID, awaiting 6-character email code verification or central Admin KYC document review.
- **Verified Client (Customer):** KYC-approved consumer entitled to book services, upload compliance requirements, approve quotations, execute digital payments, monitor real-time tracking, book branch visits, and message operators.
- **Branch Operator (`operator` / `branch_operator`):** Franchisee operator handling assigned branch inquiries, issuing formal quotations, advancing workflow milestones, coordinating branch appointments, messaging clients, and submitting support tickets to FairFly Admin.
- **Administrator (`admin`):** Central operations staff approving client KYC, reviewing franchise applications, authoring global service catalog items and workflow templates, triaging support tickets, and broadcasting announcements.
- **Super Administrator:** Root operational authority with exclusive rights to provision operator accounts, create admin accounts, approve operator qualification upgrades, and process operator password reset review queues.

---

## 2. Module-by-Module User Journey Extraction

---

### Module: Authentication, Onboarding & Identity KYC
**Module Purpose:** Governs client self-registration with government ID upload, 6-character email code verification, session authentication, Admin KYC review (Approve/Reject), and token-gated ID re-upload.  
**Key Code Components/Routes:** `fair-fly/src/pages/Index/Register/Register.jsx`, `VerifyEmail.jsx`, `ReuploadId.jsx`, `Login.jsx`, `ResetPassword.jsx`, `AdminClients.jsx`, `ClientDetailPage.jsx`, `fly-api/src/routes/authRoutes.js`, `clientRoutes.js`, `passwordResetRoutes.js`, `authController.js`, `clientController.js`.

#### Journey AUTH-01: Unverified Client - New Client Registration and Email Verification Flow
- **Persona / Role:** Guest $\to$ Unverified Client
- **Journey Type:** Happy Path
- **Prerequisites:** Clean browser session; unique email address and phone number; valid government ID scan (PNG/JPG/PDF).
- **Journey Steps & Touchpoints:**
  1. **Registration Form (`/register` $\to$ `Register.jsx`):** User inputs personal details (`fullName`, `email`, `phone`, `password`), selects Philippine ID type (`idType`), uploads front/back ID images, and clicks "Submit Registration". -> System executes file upload to Firebase Storage, then dispatches `POST /api/auth/register-initiate` with whitelisted fields. System creates a pending user record in Firestore `users/{uid}` with `status: "PENDING_VERIFICATION"` and generates a 6-character numeric OTP.
  2. **Email Verification Code Entry (`/verify-email` $\to$ `VerifyEmail.jsx`):** System redirects user to verification screen. User inputs the 6-character verification code received via transactional email and clicks "Verify Email". -> Component sends `POST /api/auth/register-verify` (`{ email, code }`).
  3. **Verification Confirmation & Auto-Login (`/login` $\to$ `Login.jsx`):** API verifies OTP, promotes user account status to `status: "PENDING_KYC"` (`idVerified: false`), and returns success response. -> Frontend navigates user to `/login` with success banner indicating account is awaiting admin ID review.
- **Cross-Module Handoffs:** Writes pending record to `users` collection; dispatches transactional email service; flags client record into Admin KYC review queue (`/admin/clients`).
- **Verification / Success Criteria:** User exists in Firebase Auth and Firestore `users` collection with `emailVerified: true`, `status: "PENDING_KYC"`. Client can log in but encounters limited KYC-pending dashboard view.

#### Journey AUTH-02: Administrator - Client KYC Review, Rejection & Secure ID Re-upload
- **Persona / Role:** Administrator & Unverified Client
- **Journey Type:** Exception Path
- **Prerequisites:** A registered client account exists with `status: "PENDING_KYC"` and blurry/unreadable uploaded ID documents.
- **Journey Steps & Touchpoints:**
  1. **Admin KYC Queue Inspection (`/admin/clients` $\to$ `ClientDetailPage.jsx`):** Admin navigates to Client Management, filters by "Pending Verification", and opens the unverified client profile. -> System loads client record via `GET /api/clients/:id` with embedded ID document URLs.
  2. **Admin ID Rejection (`ClientDetailPage.jsx`):** Admin inspects ID images, clicks "Reject ID", inputs rejection reason *"Front ID is unreadable and corners are cropped"*, and confirms. -> Frontend executes `POST /api/clients/:id/reject` with `{ reason }`. Backend updates client document to `status: "ID_REJECTED"` and sends a secure re-upload link containing a single-use JWT/token to the client's email.
  3. **Client ID Re-upload (`/reupload-id?token=...` $\to$ `ReuploadId.jsx`):** Client clicks the email link, arriving at `/reupload-id`. Form pre-populates email from verified token and displays Admin rejection remarks. Client uploads fresh high-resolution ID files and submits. -> Dispatches `POST /api/auth/reupload-id` (`{ email, token, idType, idFrontUrl, idBackUrl }`).
  4. **Admin Re-inspection & Final Approval (`ClientDetailPage.jsx`):** Admin reopens the client's profile in `/admin/clients/:id`, verifies the updated ID scans, and clicks "Approve Account". -> Dispatches `POST /api/clients/:id/approve`.
- **Cross-Module Handoffs:** Emits real-time notification to client; logs administrative action via `adminLogger.js` to `adminAuditLogs` collection.
- **Verification / Success Criteria:** Client document in Firestore `users/{uid}` updates to `status: "ACTIVE"`, `idVerified: true`. Client gains full access to Service Catalog booking, Quotations, and Appointments.

#### Journey AUTH-03: Branch Operator - Super Admin Queued Password Reset Request
- **Persona / Role:** Branch Operator $\to$ Super Administrator
- **Journey Type:** Edge Path (Privilege Escalation Prevention)
- **Prerequisites:** Active Branch Operator forgot credentials; unable to access email inbox directly or requires verified administrative credential reset.
- **Journey Steps & Touchpoints:**
  1. **Operator Reset Request (`/forgot-password` $\to$ `ResetPassword.jsx`):** Operator selects "Operator Account", enters branch email, branch name, and reason for reset, then submits. -> Frontend posts to `POST /api/auth/operator-forgot-password`. System routes request into a privileged review collection `passwordResets/{id}` with `status: "PENDING"`.
  2. **Super Admin Review Queue (`/admin/admins` or `/admin/password-resets`):** Super Admin logs in, navigates to Security / Password Resets queue, and inspects pending operator reset requests via `GET /api/admin/password-resets`. -> Super Admin validates branch legitimacy and clicks "Approve Reset".
  3. **Super Admin Approval Execution:** Dispatches `POST /api/admin/password-resets/:id/approve` (guarded by `requireSuperAdmin`). -> Backend generates a Firebase Auth password reset action link and dispatches secure reset instructions to the operator's registered recovery address.
- **Cross-Module Handoffs:** Intercepted by `requireSuperAdmin` middleware; logs administrative action to audit log.
- **Verification / Success Criteria:** Firestore document `passwordResets/{id}` reflects `status: "APPROVED"`, `approvedBy: superAdminUid`. Standard Admins attempting `POST /api/admin/password-resets/:id/approve` receive `403 Forbidden`.

---

### Module: Franchise Acquisition & Operator Account Provisioning
**Module Purpose:** Manages dynamic multi-step franchise applications from prospective entrepreneurs (incorporating PSGC Cloud Philippine geographic data), administrative application appraisal, and Super Admin provisioning of branch operator accounts.  
**Key Code Components/Routes:** `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`, `AdminFranchiseApps.jsx`, `FranchiseAppDetailPage.jsx`, `AdminOperators.jsx`, `OperatorForm.jsx`, `fly-api/src/routes/franchiseRoutes.js`, `operatorRoutes.js`, `franchiseController.js`, `operatorController.js`.

#### Journey FRAN-01: Prospective Franchisee - End-to-End Application Submission & PSGC Geographic Cascading
- **Persona / Role:** Guest (Prospective Franchisee)
- **Journey Type:** Happy Path
- **Prerequisites:** Public visitor on FairFly Landing page (`/home`); valid contact information, business profile, and preferred location details.
- **Journey Steps & Touchpoints:**
  1. **Franchise Modal Launch (`/home` $\to$ `Landing.jsx`):** User clicks "Be a Franchise Partner". -> System fetches active schema via `GET /api/franchise/application-schema` and opens `FranchiseApplicationForm`.
  2. **Applicant & Business Background Input:** User fills split legal name (`firstName`, `middleInitial`, `lastName`), email, contact number, investment budget, and business experience.
  3. **PSGC Cloud Address Cascading:** User selects Region (e.g., NCR or Region IV-A) $\to$ triggers PSGC Cloud API call populating Province dropdown $\to$ user selects Province $\to$ triggers Municipality dropdown $\to$ user selects Barangay and enters specific building/street address.
  4. **Dynamic Custom Fields & Submission:** User fills any dynamic custom fields configured by Admin and submits. -> Dispatches `POST /api/franchise/applications` guarded by `publicRateLimiter` and `allowedFields(FRANCHISE_ALLOWED_FIELDS)`.
- **Cross-Module Handoffs:** Creates record in Firestore `franchiseApplications/{id}` with `status: "PENDING"`; queues in-app and email notification to all central Admins.
- **Verification / Success Criteria:** API responds with `201 Created` and application ID (e.g., `FRAN-...`). Application appears immediately in Admin Franchise Applications dashboard via Firestore `onSnapshot`.

#### Journey FRAN-02: Super Administrator - Franchise Approval & Branch Operator Account Provisioning
- **Persona / Role:** Administrator & Super Administrator
- **Journey Type:** Happy Path
- **Prerequisites:** Pending franchise application exists; Super Admin credentials available.
- **Journey Steps & Touchpoints:**
  1. **Application Review (`/admin/franchise-apps/:id` $\to$ `FranchiseAppDetailPage.jsx`):** Admin reviews applicant financial background, meeting notes, and preferred location. Admin sets status to "Under Review", conducts meeting, then transitions status to "Approved". -> Dispatches `PATCH /api/franchise/applications/:id/status` with `{ status: "Approved" }`.
  2. **Operator Provisioning Initiation (`/admin/operators` $\to$ `AdminOperators.jsx`):** Super Admin opens "Add New Operator" modal (`OperatorForm.jsx`), enters branch name (e.g., *"FairFly Travel - Cebu Branch"*), official branch email, initial password, assigned address, and contact number.
  3. **Super Admin Creation Submission:** Form submits `POST /api/operators` with whitelisted fields (`['branchName', 'email', 'password', 'address', 'contactNumber', 'isQualified']`). -> Middleware `requireSuperAdmin` verifies privileges. Backend creates user in Firebase Auth with `role: "operator"`, creates Firestore document in `operators/{uid}` and `users/{uid}`, and assigns operational branch scope.
- **Cross-Module Handoffs:** Sets up brand new branch namespace in `operators` collection; logs creation event via `adminLogger.js`.
- **Verification / Success Criteria:** Standard admin attempting to create operator receives `403 Forbidden: Super Administrator access required`. When executed by Super Admin, new Operator can authenticate at `/login` and is redirected to `/operator` dashboard.

---

### Module: Service Catalog & Workflow Template Governance
**Module Purpose:** Enables central Admins to define standardized travel/visa service packages and lifecycle workflow templates, while allowing Branch Operators to author branch-exclusive services and customize procedural steps.  
**Key Code Components/Routes:** `fair-fly/src/pages/Admin/AdminServices/AdminServices.jsx`, `ServiceDetailPage.jsx`, `AdminWorkflowTemplates/index.jsx`, `OperatorServices.jsx`, `OperatorServiceProcedure.jsx`, `fly-api/src/routes/serviceRoutes.js`, `workflowRoutes.js`, `serviceController.js`, `workflowController.js`.

#### Journey SERV-01: Admin & Operator - Global Service Template Authoring to Branch Procedure Customization
- **Persona / Role:** Administrator $\to$ Branch Operator
- **Journey Type:** Happy Path
- **Prerequisites:** Admin and Operator credentials active; global categories established.
- **Journey Steps & Touchpoints:**
  1. **Admin Workflow Template Construction (`/admin/workflow-templates`):** Admin defines a reusable multi-step template (e.g., *"Schengen Visa Processing"*), configuring steps: 1. Document Intake, 2. Financial Assessment, 3. Embassy Appointment, 4. Biometrics Confirmation, 5. Visa Release. -> Submits `POST /api/workflow/templates`.
  2. **Admin Service Creation (`/admin/services` $\to$ `AdminServices.jsx`):** Admin creates a new service *"Comprehensive Schengen Tourist Package"*, specifying base price, processing duration, file requirements, and links it to the newly created workflow template ID. -> Submits `POST /api/services` with whitelisted `SERVICE_ALLOWED_FIELDS`.
  3. **Operator Service Procedure Customization (`/operator/services/:id/procedure` $\to$ `OperatorServiceProcedure.jsx`):** Branch Operator navigates to services catalog, selects the service, and adds branch-specific requirements (e.g., *"Branch Notarization Form"*). -> Dispatches `PUT /api/services/:id` scoped to their branch.
- **Cross-Module Handoffs:** Workflow template is published to global catalog; available for selection during client service inquiries and quotation fulfillment.
- **Verification / Success Criteria:** Service appears in Client-facing catalog (`/client/services`) with correct base pricing, requirements checklist, and workflow step outline.

#### Journey SERV-02: Non-Admin User - Tamper Attempt on Global Service Catalog
- **Persona / Role:** Client or Unprivileged Operator
- **Journey Type:** Exception Path
- **Prerequisites:** Client or non-super operator authenticated session token.
- **Journey Steps & Touchpoints:**
  1. **Direct API Tampering Trigger:** Malicious client attempts direct HTTP request `DELETE /api/services/GLOBAL-SCHENGEN-001` or `POST /api/services/bulk-delete` with raw Firebase ID token.
  2. **Backend RBAC Interception:** Request hits `fly-api/src/routes/serviceRoutes.js`. Middleware `verifyFirebaseToken` decodes UID, queries user cache/Firestore, and identifies `role: "client"`.
  3. **Privilege Guard Execution:** Middleware `requireRole(['admin', 'operator'])` or `requireRole('admin')` rejects the request.
- **Cross-Module Handoffs:** Execution halts before reaching database controllers; unauthorized attempt logged.
- **Verification / Success Criteria:** Backend responds with `403 Forbidden: Insufficient privileges`. Database records remain completely untouched.

---

### Module: Client Inquiry, Quotation Generation & Acceptance
**Module Purpose:** Manages client service customization requests, dynamic inquiry forms with requirement uploads, branch operator quotation estimation/itemization, and client review/acceptance.  
**Key Code Components/Routes:** `fair-fly/src/pages/ClientSide/ClientServiceItem/ServiceItemPage.jsx`, `InquiryDetailModal.jsx`, `OperatorInquiryForms.jsx`, `InquiryFormDetailPage.jsx`, `OperatorQuotations.jsx`, `QuotationDetailPage.jsx`, `QuotationDetailModal.jsx`, `fly-api/src/routes/inquiryRoutes.js`, `quotationRoutes.js`, `inquiryController.js`, `quotationController.js`.

#### Journey INQ-01: Verified Client to Operator - Service Inquiry to Formal Quotation Acceptance
- **Persona / Role:** Verified Client $\to$ Branch Operator
- **Journey Type:** Happy Path
- **Prerequisites:** Client KYC is `ACTIVE`; desired service exists in catalog with assigned branch operator.
- **Journey Steps & Touchpoints:**
  1. **Client Inquiry Submission (`/client/services/:serviceId` $\to$ `ServiceItemPage.jsx`):** Client selects preferred branch location, fills travel dates, passenger count, notes, and uploads required initial documents (Passport scan, Certificate of Employment). Clicks "Submit Booking Inquiry". -> Dispatches `POST /api/inquiries` with whitelisted `INQUIRY_ALLOWED_FIELDS`. Record created in Firestore `inquiries/{id}` with `status: "pending"`.
  2. **Operator Inquiry Confirmation (`/operator/inquiry-forms/:id` $\to$ `InquiryFormDetailPage.jsx`):** Operator opens inquiry, inspects uploaded requirements via download preview links, validates passenger details, and clicks "Confirm Inquiry & Generate Quotation". -> Dispatches `POST /api/inquiries/:id/confirm`. Backend automatically drafts a corresponding record in `quotations/{id}` with `status: "Draft"`, linking `inquiryId`.
  3. **Operator Itemization & Quotation Dispatch (`/operator/quotations/:id` $\to$ `QuotationDetailPage.jsx`):** Operator fills itemized rate breakdown (Embassy fee, Service fee, Insurance), specifies payment terms and validity, then clicks "Send Quotation to Client". -> Dispatches `PATCH /api/quotations/:id` (`status: "Pending Client Approval"`).
  4. **Client Review & Acceptance (`/client/tracking` or `QuotationDetailModal.jsx`):** Client receives real-time notification, reviews itemized quotation amounts and inclusion details, and clicks "Accept Quotation". -> Dispatches `POST /api/quotations/:id/accept`.
- **Cross-Module Handoffs:** Updates inquiry status to `"accepted"`; sets quotation status to `"Accepted"` and `paymentStatus: "UNPAID"`; triggers automated push notification to Branch Operator and Central Admin; unlocks PayMongo checkout button on Client Tracking page.
- **Verification / Success Criteria:** Firestore document `quotations/{id}` reflects `status: "Accepted"`, `paymentStatus: "UNPAID"`. Service fulfillment remains uncreated until payment is verified.

#### Journey INQ-02: Unauthorized Branch Operator - Cross-Branch Quotation Tampering Attempt
- **Persona / Role:** Branch Operator (Branch A)
- **Journey Type:** Exception Path
- **Prerequisites:** An accepted quotation belongs to Branch B (`branchUid: "OPERATOR_B_UID"`). Operator A has active token.
- **Journey Steps & Touchpoints:**
  1. **Malicious Update Attempt:** Operator A sends HTTP `PATCH /api/quotations/QUOTE-BRANCH-B-001` attempting to alter `rate`, `totalAmount`, or `status`.
  2. **Backend Controller Branch Verification:** Controller fetches target quotation document from Firestore. Controller evaluates ownership: `const isBranchMatch = quotation.branchUid === req.user.uid || quotation.operatorId === req.user.uid;`.
  3. **Access Enforcement:** Because Operator A's UID does not match quotation's branch ID, system denies mutation.
- **Cross-Module Handoffs:** None. Transaction aborted.
- **Verification / Success Criteria:** Backend returns `403 Forbidden: You can only update quotations for your branch.`. Record in Firestore remains unmodified.

---

### Module: Payment Processing & Atomic Service Activation
**Module Purpose:** Handles secure checkout session initialization via PayMongo, webhook signature verification (HMAC-SHA256), client redirect payment validation, and ACID-compliant atomic creation of active service fulfillment.  
**Key Code Components/Routes:** `fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx`, `fair-fly/src/services/paymentService.js`, `fly-api/src/routes/paymentRoutes.js`, `paymentController.js`, `paymongoService.js`.

#### Journey PAY-01: Verified Client - Checkout Session to Atomic Active Service Provisioning
- **Persona / Role:** Verified Client
- **Journey Type:** Happy Path
- **Prerequisites:** Client has an accepted quotation with `status: "Accepted"` and `paymentStatus: "UNPAID"`.
- **Journey Steps & Touchpoints:**
  1. **Initiate Checkout (`/client/tracking` $\to$ `ClientTrackingPage.jsx`):** Client locates the accepted quotation card, reviews payment amount, and clicks "Pay with PayMongo (GCash / Card / Maya)". -> Dispatches `POST /api/payments/checkout-session` (`{ quotationId }`). Backend verifies quotation status, creates internal `payments/{paymentId}` record (`status: "PENDING"`), invokes PayMongo API to generate checkout URL, and returns checkout session ID and redirect URL.
  2. **External Gateway Transaction:** Client is redirected to PayMongo hosted payment page; enters sandbox test card/GCash details and completes successful payment. PayMongo redirects browser back to FairFly (`/client/tracking?payment=success&paymentId=...`).
  3. **Payment Verification Handshake:** Client frontend executes `POST /api/payments/:id/verify`. Concurrently, PayMongo server pushes `checkout_session.payment.paid` event to `POST /api/payments/webhook`.
  4. **Atomic Transaction Execution (`finalizeSuccessfulPayment` in `paymentController.js`):** Webhook or verify endpoint executes a Firestore atomic transaction (`db.runTransaction`):
     - Sets `payments/{paymentId}` $\to$ `status: "PAID"`, `paidAt: now`.
     - Sets `quotations/{quotationId}` $\to$ `status: "PAID"`, `paymentStatus: "PAID"`, `activeServiceId: fulfillmentId`.
     - Sets `inquiries/{inquiryId}` $\to$ `status: "fulfilled"`.
     - Generates unique active service ID (`SRV-...`) and creates `activeServices/{fulfillmentId}` document populated via `buildFulfillmentPayload` with full procedural workflow step snapshot.
- **Cross-Module Handoffs:** Webhook handler validates cryptographic `paymongo-signature` header; sends branch notification to Operator; instantiates new active service tracker.
- **Verification / Success Criteria:** Exactly one `activeServices` document is created in Firestore. Client's tracking view updates in real time via `onSnapshot` showing active fulfillment steps.

#### Journey PAY-02: Client / External Actor - Idempotency Lock on Duplicate Webhook & Double-Click
- **Persona / Role:** System / Network Edge
- **Journey Type:** Edge Path (Double Payment / Duplicate Webhook Race Condition)
- **Prerequisites:** Payment record `PAY-001` has already been finalized as `status: "PAID"` with `fulfillmentId: "SRV-001"`.
- **Journey Steps & Touchpoints:**
  1. **Duplicate Webhook Delivery:** Network latency causes PayMongo to retry webhook delivery for `PAY-001`, or user refreshes verify URL repeatedly.
  2. **Idempotency Guard Evaluation:** `finalizeSuccessfulPayment` opens Firestore transaction and inspects `paymentDoc.data().status`.
  3. **Early Safe Exit:** Idempotency guard detects `paymentData.status === 'PAID' && paymentData.fulfillmentId`. Transaction exits immediately without running fulfillment generation.
- **Cross-Module Handoffs:** Logs `[Payment Idempotency] Payment PAY-001 already marked PAID` to server console.
- **Verification / Success Criteria:** Backend responds with `200 OK` (`alreadyProcessed: true`). No duplicate `activeServices` documents or workflow instances are created.

#### Journey PAY-03: Malicious Client - Attempting Checkout Session on Unaccepted or Paid Quotation
- **Persona / Role:** Verified Client
- **Journey Type:** Exception Path
- **Prerequisites:** A quotation is in `Draft` status or has already been completed (`PAID`).
- **Journey Steps & Touchpoints:**
  1. **Direct API Checkout Trigger:** Client attempts `POST /api/payments/checkout-session` with the quotation ID of a `Draft` quotation.
  2. **Backend Validation Guard:** `paymentController.js` queries quotation; checks `quotation.status`.
  3. **Rejection:** System checks if `quotation.status !== 'Accepted'` or if `quotation.paymentStatus === 'PAID'`.
- **Cross-Module Handoffs:** None.
- **Verification / Success Criteria:** API responds with `400 Bad Request: Quotation must be accepted by the client before payment.` No PayMongo session is created.

---

### Module: Active Service Execution, Step Progression & Fulfillment Tracking
**Module Purpose:** Manages end-to-end procedural workflow execution, milestone step state transitions, document submission reviews, real-time client tracking feeds, and cancellation/refund logic.  
**Key Code Components/Routes:** `fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx`, `fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx`, `ClientTrackingPage.jsx`, `fly-api/src/routes/activeServiceRoutes.js`, `activeServiceController.js`.

#### Journey ACT-01: Branch Operator & Client - End-to-End Procedural Step Progression
- **Persona / Role:** Branch Operator $\to$ Verified Client
- **Journey Type:** Happy Path
- **Prerequisites:** Active service record exists (`status: "IN_PROGRESS"`) with 5 configured workflow steps; Operator assigned to branch.
- **Journey Steps & Touchpoints:**
  1. **Operator Step Workspace (`/operator/services/:id/procedure` $\to$ `OperatorServiceProcedure.jsx`):** Operator opens active service fulfillment dashboard; reviews client's submitted requirements and verifies uploaded file attachments.
  2. **Milestone Transition:** Operator clicks Step 1 ("Document Verification"), checks off verification criteria, attaches approval note, and marks step as "Completed". -> Dispatches `PATCH /api/services/active/:id/step` (`{ stepIndex: 0, newStatus: "Completed" }`).
  3. **Backend Transition Engine:** `activeServiceController.js` validates step bounds, records timestamp and operator identity, advances current step pointer to Step 2, and updates `activeServices/{id}` in Firestore.
  4. **Real-time Client Tracker Reaction (`/client/tracking` $\to$ `ClientServiceTracker.jsx`):** Client tracking screen listens via `onSnapshot()`. Step 1 dynamically changes from blue in-progress spinner to green checkmark badge, and Step 2 highlights as active milestone.
  5. **Final Step Completion:** Operator completes all steps through to "Visa Released / Service Completed". Backend updates overall active service status to `"COMPLETED"`.
- **Cross-Module Handoffs:** Emits real-time milestone notifications to client; logs operator progress in history.
- **Verification / Success Criteria:** Final active service document in Firestore reflects `status: "COMPLETED"`, all step objects have `completedAt` timestamps, and Client Tracking page displays celebratory completion summary.

#### Journey ACT-02: Client - Service Cancellation Request & Operator Resolution
- **Persona / Role:** Verified Client $\to$ Branch Operator
- **Journey Type:** Exception Path
- **Prerequisites:** Active service is in Step 1 or Step 2; client requests cancellation due to personal emergency.
- **Journey Steps & Touchpoints:**
  1. **Cancellation Request:** Client submits cancellation reason via tracking modal or direct messaging.
  2. **Operator/Admin Cancellation Execution:** Operator/Admin opens service procedure, clicks "Cancel Active Service", inputs verified cancellation remarks, and confirms. -> Dispatches `PATCH /api/services/active/:id/cancel` with `{ reason: "Client requested refund due to travel restrictions" }`.
  3. **Backend State Update:** `cancelActiveService` in `activeServiceController.js` halts step progression, updates document `status: "CANCELLED"`, records cancellation metadata, and flags quotation record.
- **Cross-Module Handoffs:** Sends notification to Client and Central Admin; initiates financial adjustment workflow.
- **Verification / Success Criteria:** Active service record status is `"CANCELLED"`. Subsequent `PATCH /services/active/:id/step` calls return `400 Bad Request: Cannot update steps of a cancelled service`.

---

### Module: Branch Appointments & Consultation Scheduling
**Module Purpose:** Enables clients to book face-to-face appointments or document submissions with designated branch operators, with full scheduling conflict resolution and status lifecycles.  
**Key Code Components/Routes:** `fair-fly/src/pages/ClientSide/ClientAppointments/ClientAppointmentsPage.jsx`, `AppointmentModal.jsx`, `OperatorAppointments.jsx`, `AppointmentDetailPage.jsx`, `fly-api/src/routes/appointmentRoutes.js`, `appointmentController.js`.

#### Journey APPT-01: Client & Operator - Appointment Booking to Completion Lifecycle
- **Persona / Role:** Verified Client $\to$ Branch Operator
- **Journey Type:** Happy Path
- **Prerequisites:** Client is authenticated; target branch operator exists and accepts bookings.
- **Journey Steps & Touchpoints:**
  1. **Client Booking Request (`/client/appointments` $\to$ `AppointmentModal.jsx`):** Client clicks "Book Appointment", selects branch location, preferred date, available time slot, service category, and enters purpose notes. Submits form. -> Dispatches `POST /api/appointments` with `APPOINTMENT_ALLOWED_FIELDS`. Record created in Firestore `appointments/{id}` with `status: "Pending"`.
  2. **Operator Appointment Management (`/operator/appointments` $\to$ `AppointmentDetailPage.jsx`):** Operator views incoming booking in calendar/list view; verifies slot availability and clicks "Confirm Appointment". -> Dispatches `PATCH /api/appointments/:id/status` (`{ status: "Confirmed" }`).
  3. **Appointment Occurrence & Sign-off:** Following the physical visit, operator marks appointment as "Completed" with visit summary notes. -> Dispatches `PATCH /api/appointments/:id/status` (`{ status: "Completed" }`).
- **Cross-Module Handoffs:** Generates reminder notifications to client; logs appointment completion.
- **Verification / Success Criteria:** Client and Operator dashboards show appointment status as `"Completed"`.

#### Journey APPT-02: Client / Operator - Appointment Reschedule and Rejection
- **Persona / Role:** Branch Operator & Client
- **Journey Type:** Edge Path
- **Prerequisites:** An appointment is in `"Pending"` status; operator has a scheduling conflict.
- **Journey Steps & Touchpoints:**
  1. **Operator Rejection/Reschedule Notice:** Operator opens appointment in `/operator/appointments/:id`, selects "Decline / Request Reschedule", inputs conflict reason, and submits. -> Dispatches `PATCH /api/appointments/:id/status` (`{ status: "Cancelled", notes: "Branch fully booked for consular interviews on this date" }`).
  2. **Client Reschedule:** Client receives alert, re-opens `/client/appointments`, and books an alternate slot.
- **Cross-Module Handoffs:** Fires notification to client with operator's explanation notes.
- **Verification / Success Criteria:** Original appointment updates to `status: "Cancelled"`, and new booking is recorded with independent ID.

---

### Module: Communications, Support Ticketing & Direct Messaging
**Module Purpose:** Facilitates intra-system direct messaging between clients, operators, and admins; manages escalated operator support tickets; delivers system announcements; and provides AI chatbot assistance.  
**Key Code Components/Routes:** `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx`, `OperatorTickets.jsx`, `AdminTickets.jsx`, `TicketDetailPage.jsx`, `AnnouncementsPage.jsx`, `Chatbot.jsx`, `fly-api/src/routes/chatRoutes.js`, `ticketRoutes.js`, `chatbotRoutes.js`, `chatController.js`, `ticketController.js`.

#### Journey COMM-01: Operator to Admin - Urgent Escalation Support Ticket Threading
- **Persona / Role:** Branch Operator $\to$ Administrator
- **Journey Type:** Happy Path
- **Prerequisites:** Operator authenticated; experiencing technical/embassy portal outage requiring central admin intervention.
- **Journey Steps & Touchpoints:**
  1. **Ticket Creation (`/operator/tickets` $\to$ `OperatorTickets.jsx`):** Operator clicks "Create Support Ticket", enters subject, category ("Embassy System Issue"), priority ("High"), and initial detailed description. Clicks "Submit Ticket". -> Dispatches `POST /api/tickets` with `TICKET_ALLOWED_FIELDS`. Record created in Firestore `tickets/{id}` with `status: "Pending"`.
  2. **Admin Triage & Thread Response (`/admin/tickets/:id` $\to$ `TicketDetailPage.jsx`):** Admin opens ticket, updates status to "Ongoing", and posts guidance message. -> Dispatches `PATCH /api/tickets/:id/status` and `POST /api/tickets/:id/messages`.
  3. **Resolution & Ticket Closure (`TicketDetailPage.jsx`):** Operator acknowledges resolution in thread. Admin clicks "Close Ticket". -> Dispatches `POST /api/tickets/:id/close`.
- **Cross-Module Handoffs:** Logs thread messages; emits real-time updates to operator ticket view.
- **Verification / Success Criteria:** Ticket status transitions to `"Closed"`; thread becomes read-only; closure timestamp and admin UID are recorded.

#### Journey COMM-02: Client to Operator - Real-Time In-App Consultation Messaging
- **Persona / Role:** Verified Client $\to$ Branch Operator
- **Journey Type:** Happy Path
- **Prerequisites:** Both client and operator possess active accounts.
- **Journey Steps & Touchpoints:**
  1. **Conversation Initiation (`/client/messages` $\to$ `MessagesPage.jsx`):** Client opens messages, selects assigned branch operator contact, and sends an inquiry regarding visa document submission. -> Dispatches `POST /api/chats/conversations` (retrieves or creates conversation ID) and `POST /api/chats/conversations/:id/messages`.
  2. **Operator Real-Time Reply (`/operator/messages` $\to$ `MessagesPage.jsx`):** Operator receives message via Firestore listener, reviews text, and replies with document instructions.
  3. **Read Receipt Update:** Client views message; frontend executes `PATCH /api/chats/conversations/:id/read`.
- **Cross-Module Handoffs:** Conversation unread counts update in real time on navigation bars.
- **Verification / Success Criteria:** Messages render in correct chronological sequence; conversation shows zero unread count after opening.

---

### Module: Operator Qualification Tiers & Super Admin Governance
**Module Purpose:** Allows Branch Operators to apply for advanced qualification tiers (enabling expanded service capabilities), governed exclusively by Super Admin review.  
**Key Code Components/Routes:** `fair-fly/src/pages/Admin/AdminQualifications/AdminQualifications.jsx`, `AdminQualificationDetailPage.jsx`, `fly-api/src/routes/qualificationRoutes.js`, `qualificationController.js`, `operatorController.js`.

#### Journey GOV-01: Operator Qualification Upgrade Application & Super Admin Approval
- **Persona / Role:** Branch Operator $\to$ Super Administrator
- **Journey Type:** Happy Path
- **Prerequisites:** Unqualified or standard operator (`isQualified: false`) with completed qualification documentation.
- **Journey Steps & Touchpoints:**
  1. **Operator Qualification Application:** Operator submits qualification portfolio detailing years in business, accreditation certificates, and financial capacity. -> Submits `POST /api/qualifications` with whitelisted fields (`['reason', 'justification', 'experience', 'notes', 'documents']`). Record created in `qualificationApplications/{id}` with `status: "PENDING"`.
  2. **Super Admin Review (`/admin/qualifications/:id` $\to$ `AdminQualificationDetailPage.jsx`):** Super Admin opens application, evaluates uploaded accreditations, enters evaluation notes, and selects "Approve Qualification". -> Dispatches `PATCH /api/qualifications/:id/review` (`{ status: "APPROVED", adminNotes: "Accreditation verified" }`).
  3. **Backend Privilege Promotion:** Endpoint verifies `requireSuperAdmin`. Upon approval, controller updates application document and automatically updates operator profile `operators/{operatorId}` setting `isQualified: true`.
- **Cross-Module Handoffs:** Emits notification to operator; unlocks restricted services authoring.
- **Verification / Success Criteria:** Standard admin attempting approval receives `403 Forbidden: Super Administrator access required`. Successful approval updates operator record to `isQualified: true`.

---

## 3. Prioritization Matrix

| Module | Journey ID | Scenario Name | Business Risk | Suggested Test Type |
| :--- | :--- | :--- | :--- | :--- |
| **Payment & Activation** | `PAY-01` | Checkout Session to Atomic Active Service Provisioning | **High** | E2E Automated (Playwright/Cypress + PayMongo Mock) |
| **Payment & Activation** | `PAY-02` | Idempotency Lock on Duplicate Webhook & Double-Click | **High** | E2E Automated / API Integration Test |
| **Authentication & KYC** | `AUTH-01` | New Client Registration and 6-Char OTP Email Verification | **High** | E2E Automated |
| **Authentication & KYC** | `AUTH-02` | Admin Client KYC Review, ID Rejection & Re-upload Flow | **High** | E2E Automated |
| **Inquiry & Quotation** | `INQ-01` | Service Inquiry Submission $\to$ Quotation Generation $\to$ Acceptance | **High** | E2E Automated |
| **Active Service Execution** | `ACT-01` | Operator Step Progression & Real-Time Client Tracker Reflection | **High** | E2E Automated |
| **Franchise Onboarding** | `FRAN-02` | Franchise Approval & Super Admin Operator Account Provisioning | **High** | E2E Automated |
| **Security & Governance** | `AUTH-03` | Operator Queued Password Reset Request & Super Admin Approval | **Med** | E2E Automated |
| **Security & Governance** | `GOV-01` | Operator Qualification Upgrade & Super Admin Role Elevation | **Med** | E2E Automated / API Integration |
| **Franchise Onboarding** | `FRAN-01` | Franchise Application with PSGC Cloud Geographic Cascade | **Med** | E2E Automated |
| **Service Catalog** | `SERV-01` | Global Service Template Authoring to Branch Customization | **Med** | Manual / Semi-Automated |
| **Service Catalog** | `SERV-02` | Unauthorized Service Catalog Mutation Prevention (RBAC) | **Med** | Automated API Security Test |
| **Inquiry & Quotation** | `INQ-02` | Cross-Branch Quotation Tampering Prevention | **Med** | Automated API Security Test |
| **Active Service Execution** | `ACT-02` | Active Service Cancellation & Refund Request Handling | **Med** | Manual / E2E Automated |
| **Appointments** | `APPT-01` | Client Consultation Booking to Operator Completion | **Med** | Manual / E2E Automated |
| **Appointments** | `APPT-02` | Appointment Conflict Decline & Client Rescheduling | **Low** | Manual |
| **Communications** | `COMM-01` | Operator Urgent Support Ticket Threading & Closure | **Low** | Manual / E2E Automated |
| **Communications** | `COMM-02` | Real-Time In-App Direct Messaging Between Client and Operator | **Low** | Manual / E2E Automated |
| **Payment & Activation** | `PAY-03` | Direct Checkout Attempt on Draft/Unaccepted Quotation | **Low** | Automated API Test |
