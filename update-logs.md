# Update Logs

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
