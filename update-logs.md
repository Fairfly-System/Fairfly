# Update Logs

## [2026-10-07] UI Polish: Client Portal Navbar Branding, 500px–320px Modal Optimizations & Zoom Hardening

### Overview
Refined the Client Portal UI by removing the text "Fairfly Client" and its subheading from the top navbar ([`AppNavbar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx)), displaying exclusively the clean Fairfly brand logo. In addition, hardened all Client Portal modals, forms, and page tabs against narrow mobile viewports down to 320px and aggressive browser zoom levels.

### Key Changes
1. **Navbar Text Cleanup ([`AppNavbar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx))**:
   - Removed `<div className="app-nav-brand-text">` containing `<p id="top-title">Fairfly Client</p>` and `<p id="down-title">{portalSubtitle}</p>`.
   - Now displays only the high-resolution Fairfly logo `<img className="app-nav-logo">` linking to `/client`.
2. **Official Service Inquiry Form SAF-01-002 ([`ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx), [`client-inquiry-modal.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/client-inquiry-modal.css), [`client-service-request-modal.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/client-service-request-modal.css))**:
   - Replaced multi-column grid with a strict single-column column-flex stack (`display: flex !important; flex-direction: column !important; width: 100% !important;`) on mobile breakpoints (`<= 48rem` / `768px` down to `320px`).
   - Every field (Representative / Full Name, Population / Pax Count, Address, Cellphone No., Telephone No., Email Address, Preferred Processing Branch) now spans the full container width with zero side-by-side splitting.
   - Fixed raw `&#10;` HTML entity in Section 3 textarea placeholder with proper JavaScript `\n` linebreaks.
   - Stacked `.client-type-options` toggle buttons vertically below 500px (`width: 100%`) so that "Individual" and "Company / Organization" buttons never clip or overflow modal margins.
   - Responsive padding, font-sizes, and check-tile heights down to 320px.
3. **Client Appointment Form Modal ([`client-appointment-form.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientAppointmentForm/client-appointment-form.css))**:
   - Added dedicated responsive rules for `.appointmentForm`: `.form-grid-2` collapses to 1 column below 500px, and `.form-actions` stacks action buttons (`Cancel` / `Schedule Appointment`) to full-width with `flex-direction: column-reverse`.
   - Tuned form inputs and labels for 360px and 320px viewports.
4. **Client Dashboard & Welcome Hero Banner ([`welcome-hero.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/WelcomeHero/welcome-hero.css), [`client-dashboard.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientDashboard/client-dashboard.css))**:
   - Scaled hero typography (`1.35rem` at 500px, `1.15rem` at 360px-320px) and padded container safely to prevent text overflow under high zoom.
   - Fixed `.client-action-grid` minmax to `minmax(min(100%, 18rem), 1fr)` to prevent 320px viewport horizontal clipping.
5. **Client Tracking Portal Tabs ([`client-tracking.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/client-tracking.css))**:
   - Stacked `.client-portal-main-tabs` into vertical full-width tab buttons on screens `<= 30rem` (480px down to 320px), preventing the tab labels ("My Inquiries & Quotations") from being truncated or clipped at narrow widths.
6. **Appointments Page & Grid ([`client-appointments.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientAppointments/client-appointments.css))**:
   - Updated `.appointments-grid` to `minmax(min(100%, 20rem), 1fr)` and added 320px-360px styling rules.
7. **Verification**:
   - Headless browser verification with zoom and small viewport testing (360px and 320px) confirmed `scrollWidth === clientWidth === 320px` (0px horizontal overflow).
   - Vite production build (`npm run build`) completed cleanly with 0 errors.

## [2026-10-07] UI Optimization: Mobile Layout & Typography Hardening for ~500px - 320px Screen Resolutions

### Overview
Conducted comprehensive mobile layout and component hardening across all **Landing Page** and **Client Portal** views targeting narrow smartphones from **500px down to 320px** (the smallest supported mobile viewport standard). Validated with automated headless browser multi-viewport testing across 320px, 375px, 420px, and 500px screens with zero horizontal overflow.

### Key Changes
1. **Public Navbar & Header Controls ([`navbar.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Navbar/navbar.css))**:
   - Adjusted navbar padding to `0.375rem 0.625rem` below 480px and `0.25rem 0.375rem` below 340px.
   - Scaled brand logo image cleanly to `1.875rem` (480px) and `1.625rem` (320px), preventing collision with hamburger menu and action buttons.
   - Constrained `.btnFranchiseMobile` touch target with tight padding and icon alignment.
2. **Landing Hero Section & Trust Strip ([`landing.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Index/Landing/landing.css))**:
   - Tuned hero heading to `1.85rem` on `<= 400px` viewports, preventing awkward single-word wrapping on 320px screens.
   - Tightened `.hero-text-col` padding to `1.5rem 0.75rem`.
   - Adjusted `.trust-item` and teaser box padding to `1rem 0.75rem` with clean bottom borders.
3. **Public Services Catalog & Cards ([`services.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/services.css))**:
   - Adjusted section padding to `2rem 0.625rem` (384px) and `1.5rem 0.375rem` (320px).
   - Formatted `.service-card-footer` into a clean column with full-width primary CTA button.
   - Scaled dropdown select and search inputs to comfortable touch sizing (`0.5rem 1.75rem 0.5rem 2rem`).
4. **Public Service Tracker ([`request-tracker.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/request-tracker.css))**:
   - Added `<= 360px` rules for tracker search card (`padding: 1rem 0.625rem;`), stepper section, and result meta grid.
   - Title scaled to `1.4rem` to fit within 320px screens.
5. **Client Portal Layout & Marketplace ([`client-layout.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientLayout/client-layout.css), [`client-tracking.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/client-tracking.css), [`client-services-marketplace.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServicesMarketplace/client-services-marketplace.css))**:
   - Reduced main padding to `1rem 0.5rem 2.5rem` on `<= 400px` screens.
   - Adjusted tracking KPI cards, tabs, and action buttons for 360px-320px screens.
   - Standardized shopping card footer and action button column stacking on 320px widths.
6. **Verification**:
   - Verified across 320px, 375px, 420px, and 500px viewports via automated browser testing.
   - Achieved 100% pass rate: `document.documentElement.scrollWidth <= window.innerWidth` across all tested routes with zero horizontal overflow.
   - Built cleanly with `npm run build` (0 errors).

## [2026-10-07] UI Enhancement: Universal Category Dropdown & Compact Toolbar Container

### Overview
Updated the `.services-toolbar` on the Landing Page and Services catalog ([`Services.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/Services.jsx), [`services.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/services.css)) to use the clean dropdown selection across all screen sizes (including desktop) and fixed the disproportionately tall container bug at different resolutions/zooms.

### Key Changes
1. **Universal Dropdown Presentation ([`Services.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/Services.jsx))**:
   - Replaced horizontal category chips completely with the category `<select>` dropdown (`.services-category-select-wrapper`) across all viewports.
2. **Compact Container Sizing & Flex Alignment ([`services.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/services.css))**:
   - Switched `.services-toolbar` to `flex-direction: row; justify-content: space-between; align-items: center;` on desktop and tablets down to 640px, placing the Category Dropdown and Search Bar side-by-side in a single compact row.
   - Constrained `.services-category-select-wrapper` to `flex: 0 1 18rem; min-width: 12rem; max-width: 22rem;` and `.services-search-wrapper` to `flex: 0 1 22rem; min-width: 14rem; max-width: 24rem;`, eliminating excessive toolbar height and large blank white space.
   - On mobile viewports (`<= 40rem` / 640px), `.services-toolbar` stacks vertically with clean full-width controls.
3. **Verification**:
   - Browser subagent verified on desktop (1280x800) and mobile (375x667, 420x800).
   - Category filtering and search queries work smoothly with zero console errors.
   - Vite production build (`npm run build`) succeeded in 2.86s with 0 errors.

## [2026-10-07] UI Architecture: Resolution-Proportional REM Scaling Across All Breakpoints

### Overview
Implemented proportional root font scaling across Desktop, Tablet, and Mobile ranges using CSS `calc()` and `clamp()` based on the project's responsive breakpoints (`index.css`). This maintains screen-relative proportions for all REM-based typography, spacing, gaps, and dimensions within each responsive range while preserving desktop, tablet, and mobile layouts intact. Operator and Admin portals are guarded with fixed 16px root font size (`html:has(.app-layout-container)`).

### Scaling Formulas & Breakpoint Reference Widths
1. **Desktop Range (`> 1024px`, Reference: `1280px`)**:
   - `font-size: clamp(12.8px, calc(16px * 100vw / 1280), 18px);`
   - At reference width (1280px): Exactly `16px`.
   - At intermediate desktop (1100px): Proportional reduction to `13.75px` without breaking the desktop layout.
2. **Tablet Range (`640.02px` to `1024px`, Reference: `768px`)**:
   - `font-size: clamp(13.33px, calc(16px * 100vw / 768), 21.33px);`
   - At reference width (768px): Exactly `16px`.
   - At intermediate tablet (900px): Proportional enlargement to `18.75px`.
   - At narrow tablet (680px): Proportional scaling to `14.17px`.
3. **Mobile Range (`<= 640px`, Reference: `480px`)**:
   - `font-size: clamp(10.67px, calc(16px * 100vw / 480), 21.33px);`
   - At reference width (480px): Exactly `16px`.
   - At intermediate mobile (375px): Proportional scaling to `12.5px`.
   - At narrowest mobile (320px): Proportional scaling to `10.67px`.
4. **Portal Scoping Guard**:
   - `html:has(.app-layout-container) { font-size: 16px !important; }` prevents any unintended scaling on Operator and Admin dashboards.

### Verification
- Full browser subagent inspection verified all reference, intermediate, and narrowest widths across all 3 ranges with zero horizontal scrollbar overflow (`scrollWidth <= clientWidth`).
- Vite production build (`npm run build`) completed cleanly with 0 errors.

## [2026-10-07] Bug Fix: Safe Price Formatting in ClientServiceRequestModal

### Overview
Fixed `Uncaught TypeError: selectedService.price.startsWith is not a function` in [`ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx).

### Key Changes
1. **Defensive Price Resolution**:
   - Replaced direct string method calls (`selectedService.price.startsWith(...)`) with type-safe handling supporting numeric amounts (e.g. `1500`), currency-formatted strings (`₱1,500`, `PHP 1,500`), and fallback defaults (`'Standard Fee'`).
   - Cleaned sanitization via `parseFloat(String(p).replace(/[^0-9.]/g, ''))` with `toLocaleString('en-US')`.
2. **Verification**:
   - Production bundle compiled cleanly with `npm run build` in 7.13s with 0 errors.

## [2026-10-06] Mobile-First Responsiveness & Navigation Overhaul: Landing Page, Client Portal & Mobile Chat

### Overview
Executed a comprehensive mobile-first responsiveness overhaul across all **Landing Page** and **Client Portal** views, components, modals, filters, toolbars, and layouts. Solved mobile chat recipient navigation by implementing a dedicated mobile conversation back button and state preservation pattern. Validated with automated Chrome DevTools Protocol (CDP) multi-viewport testing across 5 standard viewport resolutions (320px, 375px, 412px, 768px, 1280px) achieving a 100% pass rate (50/50 test matrix) with zero horizontal overflow.

### Key Changes
1. **Mobile Chat Recipient Navigation & Back Flow ([`MessagesPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx), [`messages-page.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Shared/MessagesPage/messages-page.css))**:
   - Implemented a dedicated `.messages-btn-back-mobile` touch button (36x36px) styled with high-contrast arrow icon in the conversation header.
   - Button is visible exclusively on mobile viewports (`<= 48rem` / 768px) and hidden on desktop (`display: none`).
   - Clicking the button invokes `setActiveConversation(null)` to smoothly transition back to the recipient list / search interface without refreshing or losing state.
   - Preserves complete two-pane side-by-side layout on desktop viewports.
2. **Fixed Mobile Baseline Strategy Across Client Portal & Marketplace ([`client-services-marketplace.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServicesMarketplace/client-services-marketplace.css), [`client-dashboard.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientDashboard/client-dashboard.css))**:
   - Implemented responsive column collapsing for `.shopping-layout` at `<= 64rem` (1024px) converting sticky side-by-side collision into a structured vertical stack.
   - Replaced fixed minimum widths on `.shopping-search-box` with flexible `min-width: min(100%, 16rem)`.
   - Enabled `flex-wrap: wrap` and flexible auto-stretching for `.shopping-toolbar-controls`, `.shopping-sort-wrap`, and `.shopping-card-footer` on small viewports (`<= 30rem` / 480px), eliminating horizontal card and toolbar clipping.
   - Constrained `.client-action-grid` to single-column stacking below 48rem.
3. **Landing Page & Public Component Hardening ([`services.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/services.css), [`landing.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Index/Landing/landing.css), [`navbar.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Navbar/navbar.css), [`chatbot.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Chatbot/chatbot.css), [`request-tracker.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/request-tracker.css), [`puzzle-house.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/FranchisePuzzleBanner/puzzle-house.css))**:
   - Corrected `.services-toolbar` and `.services-category-chips` with explicit `min-width: 0; max-width: 100%; overflow-x: auto; flex-wrap: nowrap;` to prevent flex children from expanding parent viewport width.
   - Fixed CSS syntax error (premature closing brace in `services.css`) that previously prevented lightningcss minification.
   - Constrained floating `.chatbot-box` to `left: 0.75rem; right: 0.75rem; width: auto; max-width: calc(100vw - 1.5rem); height: min(520px, calc(100dvh - 2rem));` on mobile screens.
   - Added `overflow-x: hidden` and `max-width: 100vw` protection to `.nav-mobile-drawer`.
   - Adjusted `.trust-item` and `.hero-text-col` padding and min-heights for comfortable mobile viewing.
   - Constrained Franchise Puzzle Banner stage height and callout cards below 420px.
4. **Client Tracking, Appointments & Modals ([`client-tracking.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/client-tracking.css), [`client-appointments.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientAppointments/client-appointments.css), [`service-tracker.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceTracker/service-tracker.css), modal stylesheets)**:
   - Enabled horizontal scrolling for `.client-portal-main-tabs` and responsive stacking for tracking header row and KPI cards.
   - Added `@media (max-width: 480px)` rules across client modals (`quotation-detail-modal`, `inquiry-detail-modal`, `payment-modal`, `client-service-request-modal`, `franchise-application-form`) converting modal action buttons to full-width stacked columns.
5. **Automated Verification**:
   - `npm run build` completed cleanly in 2.23s with 0 errors.
   - Full automated CDP test suite executed across 5 viewports (320px, 375px, 412px, 768px, 1280px) on 10 routes: 50 out of 50 combinations passed with zero horizontal overflow (`scrollWidth === clientWidth`).
   - Chat navigation tested live on mobile viewport: recipient selection displays conversation with 36x36px Back button; clicking Back smoothly returns to recipient list; desktop preserves side-by-side layout with Back button hidden.

## [2026-10-06] Feature Refinement: Strict Service Tracking ID Enforcement on Public Tracker

### Overview
Updated the public **Real-Time Service Tracker** across frontend and backend ([`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx), [`TrackerPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Index/TrackerPage/TrackerPage.jsx), and [`trackingController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/trackingController.js)) to **strictly accept official Service Tracking IDs (`SRV-2026-XXXXXX` / `SVC-...`) only**, completely disallowing Quotation IDs (`QT-...`, `QUO-...`), Inquiry Reference codes (`INQ-...`, `SAF-...`), and Receipt Numbers (`RCT-...`).

### Key Changes
1. **Backend Validation & Guard Clauses ([`trackingController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/trackingController.js))**:
   - Added guard clauses that immediately reject Quotation IDs (`QT-`, `QUO-`, `QTN-`), Inquiry codes (`INQ-`, `SAF-`), and Receipt numbers (`RCT-`) with `400 Bad Request` and clear guidance error messages.
   - Removed direct quotation and inquiry database queries from public tracking resolution.
   - Strictly resolves active services by their high-entropy `serviceCode` or direct fulfillment document ID.
2. **Frontend UI & Validation Hardening ([`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx))**:
   - Added client-side format checking in `performTrackLookup` to intercept and warn users if they submit non-tracking references.
   - Updated search input placeholder to `Enter Service Tracking ID (e.g. SRV-2026-000123)...`.
   - Updated header subtitle and sample chips to only present `SRV-2026-XXXXXX` format.
   - Cleaned URL parameter parsing to only accept `trackingId`, `serviceCode`, and `code`.
3. **Portal Guidance Updates ([`TrackerPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Index/TrackerPage/TrackerPage.jsx))**:
   - Replaced quotation reference guide card with "Real-Time Milestone Tracking" instructions clarifying that tracking is initiated after service confirmation via `SRV-2026-XXXXXX`.
4. **Verification**:
   - Automated integration test suite [`testReceiptAndTrackingIntegration.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testReceiptAndTrackingIntegration.js) updated to test strict rejection of `QT-...`, `RCT-...`, and `INQ-...` inputs; all tests passed 100%.
   - Frontend built cleanly with `npm run build`.



## [2026-10-06] Security & Performance: Optimized & Relaxed Rate Limiting for Public Tracker and Landing Page

### Overview
Significantly relaxed and tiered backend rate limits across the FairFly system ([`rateLimitService.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/services/rateLimitService.js), [`rateLimiter.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/middleware/rateLimiter.js), [`trackingRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/trackingRoutes.js), and [`receiptRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/receiptRoutes.js)) to eliminate false-positive `HTTP 429 Too Many Requests` during public request tracking lookups, sample chip exploration, and background synchronization.

### Key Enhancements
1. **Dedicated High-Capacity Public Tracking Rate Limiter (`trackerRateLimiter`)**:
   - Introduced `trackerLimiter` configured for **180 requests per 1 minute window** (up from the legacy shared 10 req / 10 min window).
   - Applied `trackerRateLimiter` to `GET /api/tracking/public/:trackingId` and `GET /api/receipts/public/:code`.
   - Accommodates live typing, rapid sample tracking code lookups (`QT-...`, `SRV-...`, `RCT-...`), and real-time reconciliation heartbeats without throttling genuine users.
2. **Relaxed Public Landing Page Limiter (`publicRateLimiter`)**:
   - Increased capacity to **60 requests per 1 minute window** (up from 10 req / 10 min).
   - Prevents throttling on public inquiry submissions, schema pre-fetches, appointment bookings, and franchise applications.
3. **Upgraded API Limiter (`apiRateLimiter`)**:
   - Increased authenticated dashboard capacity to **300 requests per 1 minute window** (up from 100 req / 15 min).
   - Ensures rapid multi-tab operator and admin workflows operate seamlessly.
4. **Verification**:
   - Automated integration test suite [`testReceiptAndTrackingIntegration.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testReceiptAndTrackingIntegration.js) executed and verified 100% passing (6/6 test suites).



## [2026-10-06] Reliability: Dual-Engine Real-Time & Background Auto-Reconciliation in Public Request Tracker

### Overview
Hardened the public **Real-Time Request Tracker** ([`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx) at `/track` and `/tracking`) to ensure live status progression and milestone updates sync automatically without manual page refreshes.

### Key Enhancements
1. **Multi-Document `onSnapshot` Real-Time Listeners**:
   - Subscribed to `activeServices/{fulfillmentId}` for live procedure step completions, milestone timestamps, overall status (`Processing` -> `Completed`), and timeline advancements.
   - Subscribed to `quotations/{quotationId}` for instant payment status updates (`PAID`), service code assignments, and fulfillment linking.
2. **Resilient Background Heartbeat Reconciliation**:
   - Implemented a background 4-second reconciliation interval that silently re-queries the public tracking endpoint in case browser privacy shields (e.g. Edge/Safari tracking prevention, storage partition blocks, or intermittent network drops) interrupt Firestore WebSocket connections.
3. **Seamless State Merging**:
   - Updates merge directly into `trackingData` state without unmounting components or triggering UI loading spinners, guaranteeing smooth, real-time live sync.
4. **Verification**:
   - Built frontend with `npm run build` (passed cleanly).

## [2026-10-06] UI Bug Fix: Fixed Overflowing "View File" Action Button in Operator Service Procedure

### Overview
Resolved a UI layout overflow bug on the **Operator Service Procedure** page ([`OperatorServiceProcedure.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx) at `/operator/services/:id/procedure`) where long submitted requirement file names caused the "View File" action buttons to stretch and overflow outside of the left sidebar container into the timeline steps column.

### Root Cause
1. `.op-submitted-doc-box` used a horizontal flex layout with `justify-content: space-between` inside a fixed 20rem sidebar without `min-width: 0` / `flex-shrink` boundaries on the text container.
2. Long filenames (such as `FairFly_Receipt_RCT-2026-FA5E2A.pdf`) expanded past the sidebar width, pushing the "View File" button out of the card boundary and overflowing into the right procedure timeline column.

### Key Changes
1. **Layout Restructuring in [`OperatorServiceProcedure.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx)**:
   - Restructured `.op-submitted-doc-box` and `.op-submitted-img-actions` into distinct `.op-submitted-doc-info` and `.op-doc-details` containers with clean ellipsis truncation for long file titles.
   - Standardized the file download / view button to a dedicated full-width card action button with download icon and clean typography.
2. **CSS Hardening in [`operator-service-procedure.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorServiceProcedure/operator-service-procedure.css)**:
   - Added `minmax(280px, 22rem) minmax(0, 1fr)` to `.op-procedure-grid` and `min-width: 0` / `overflow: hidden` to `.op-procedure-sidebar-panel`, `.op-procedure-panel-card`, and `.op-submitted-req-card`.
   - Styled `.op-submitted-doc-box` with `flex-direction: column`, ensuring filenames truncate cleanly with ellipsis while action buttons occupy full card width without overflowing.
3. **Verification**:
   - Built frontend with `npm run build` (passed cleanly).

## [2026-10-06] Bug Fix: Resolved "Maximum update depth exceeded" Infinite Loop in QuotationAttachRequirementsModal & ClientTrackingPage

### Overview
Fixed a React runtime infinite re-render loop on [`ClientTrackingPage`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx) that occurred when loading the client tracking dashboard.

### Root Cause
1. [`QuotationAttachRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx) was mounted with `isOpen={Boolean(attachingRequirementsQuotation)}` (`false` by default).
2. Inside `QuotationAttachRequirementsModal`, `useSubmittedRequirements` evaluated non-memoized fallback arrays `[]` on every render cycle, producing a fresh object reference.
3. The pre-fill `useEffect` was triggered by changing reference dependencies and called `setInputs({})` on every render when `!isOpen`, creating an infinite `setState -> re-render -> setInputs({}) -> re-render` cascade.

### Key Changes
1. **Memoized Resolved Requirements in [`useSubmittedRequirements.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/hooks/useSubmittedRequirements.js)**:
   - Defined a module-level static `EMPTY_ARRAY = []`.
   - Memoized `resolvedList` using `useMemo` with dependencies on `[record, fallbackRequirements]` to guarantee stable array references across render passes.
2. **Hardened [`QuotationAttachRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx)**:
   - Guarded hook subscription to only fetch `submittedRequirementsId` when `isOpen` is true.
   - Updated `useEffect` to safely check if `inputs` is already empty before updating state (`setInputs(prev => Object.keys(prev).length === 0 ? prev : {})`).
   - Added change-detection during pre-fill population so `setInputs` only dispatches when property values actually change.
   - Added early return `if (!isOpen) return null;`.
3. **Conditional Modal Mounting**:
   - In [`ClientTrackingPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx) and [`QuotationDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationDetailModal/QuotationDetailModal.jsx), conditionally mounted `QuotationAttachRequirementsModal` only when the active quotation or modal trigger is truthy.
4. **Verification**:
   - Built frontend with `npm run build` (passed cleanly).
   - Executed full backend test suites (`testWorkflowRemodel.js` and `testReceiptAndTrackingIntegration.js`, both passed 100%).

## [2026-10-06] Architecture: Strict Separation of Client Remarks & Operator Remarks Across Entire Workflow

### Overview
Comprehensively audited and repaired the remarks architecture across the backend, database mappings, API routes, and frontend views to guarantee that **Client Remarks** (from inquiry intake `SAF-01-002`) and **Operator Remarks** (from quotation creation `ADF-07-001`) remain strictly separate and accurately labeled across the inquiry → quotation → payment/fulfillment workflow.

### Key Changes
1. **Quotation Creation & Prefill Fixes**:
   - In [`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx), fixed bug where `initialData.remarks` (Client Remarks from inquiry) erroneously overwritten `formData.remarks` (Operator Payment Terms & Remarks default).
   - Preserved default Operator Payment Terms (`- Initial payment of 50% upon confirmation\n- Full payment on or before tour commencement`) and labeled Section 5 as **"Operator Remarks & Payment Terms"**.
   - Added a dedicated readonly **"Client's Remarks / Special Instructions (from SAF-01-002 Intake)"** reference card in Section 2 so operators can view what the client requested during intake without polluting quotation terms.
   - Payload explicitly submits `remarks`, `operatorRemarks`, and `clientRemarks`.

2. **Inquiry Detail & History Display Realignment**:
   - In [`InquiryDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/InquiryDetailModal/InquiryDetailModal.jsx), updated section to **"Client Remarks & Special Instructions (SAF-01-002 Col 3)"**.
   - In [`InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx) and [`AdminInquiryDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx), re-aligned card headers to **"Client Remarks & Notes (SAF-01-002 Col 3)"** and upgraded `parseInquiryData` to handle `clientRemarks` as a first-class field.

3. **Quotation Detail & Client Quotation Modal**:
   - In [`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx), labeled Section 5 as **"Operator Remarks & Payment Terms"** and added a distinct **"Client Remarks & Special Instructions (from Inquiry Intake)"** card when linked to an inquiry.
   - In [`QuotationDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationDetailModal/QuotationDetailModal.jsx), labeled the operator notes card as **"Operator Remarks & Payment Terms"** displaying `quotation.operatorRemarks || quotation.remarks`.

4. **Backend Controllers, Services & Allowed Fields**:
   - In [`inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js), canonicalized `clientRemarks` on inquiries and preserved both `operatorRemarks` and `clientRemarks` when auto-creating quotations.
   - In [`quotationController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/quotationController.js), saved `operatorRemarks` and `clientRemarks` distinctly in `createQuotation`, `updateQuotation`, and `createCustomServiceFromQuotation`.
   - In [`receiptService.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/services/receiptService.js), [`receiptController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/receiptController.js), and [`trackingController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/trackingController.js), ensured receipt description uses `serviceTitle` rather than operator remarks, and tracked `operatorRemarks` / `clientRemarks` as separate properties.
   - In [`inquiryRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/inquiryRoutes.js), [`quotationRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/quotationRoutes.js), and [`activeServiceRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/activeServiceRoutes.js), whitelisted `operatorRemarks` and `clientRemarks` in `allowedFields`.

5. **PDF Normalization (`PdfDocumentView.jsx`)**:
   - In `normalizeInquiryPdfData`, normalized `inquiryData.remarks` from `clientRemarks || remarks`.
   - In `normalizeQuotationPdfData`, normalized `quotationData.remarks` strictly from `operatorRemarks || remarks`.

6. **Verification**:
   - Frontend `npm run build` compiled cleanly with 0 errors.
   - Backend automated test suites `testWorkflowRemodel.js` and `testReceiptAndTrackingIntegration.js` passed 100%.



## [2026-10-06] Clean Architecture: Removed Document Requirements Field from Create Quotation Modal

### Overview
Removed the redundant **"Document Requirements (Needed by Agency from Client) *"** input field and form validation requirement from the **Create Quotation Modal** ([`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx)). Service requirements are already modeled on and supplied by the linked catalog Service and reviewed on the dedicated Quotation Detail Page.

### Key Changes
1. **Removed Redundant Field**:
   - Removed the `<textarea name="requirements">` input block from Section 2 of `CreateQuotationModal.jsx`.
   - Updated `isFormValid` to no longer require `formData.requirements`, allowing operators to create quotations cleanly with client information, linked catalog service, rates, and inclusions/exclusions.
2. **Workflow Alignment**:
   - Document requirements for the service are automatically supplied by the catalog service and managed on the quotation detail review workflow ([`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx)) and client submission portal ([`QuotationAttachRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx)).



## [2026-10-06] Feature: Client Quick Action "Submit Requirements" Button & File Attachment Robustness

### Overview
Added an obvious, high-visibility **"Submit Requirements"** quick action button to the Client Quotations Received Table and resolved client-side file attachment state preservation and input handling in `QuotationAttachRequirementsModal` to match the reliability of the operator on-site walk-in workflow.

### Key Changes
1. **Prominent "Submit Requirements" Quick Action Button**:
   - In [`ClientTrackingPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx), replaced the generic/subdued button with high-contrast, obvious action buttons in the Quotations Received table:
     - **`Submit Requirements`** (Primary Purple with `fa-cloud-arrow-up`) when requirements are pending/required.
     - **`Update Requirements`** (Warning Red with `fa-triangle-exclamation`) when the operator has requested corrections.
     - **`In Review`** (Soft Blue with `fa-clock-rotate-left`) when documents are submitted and awaiting operator review.
   - Clicking **"Submit Requirements"** or **"Update Requirements"** now directly opens [`QuotationAttachRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx) without forcing the client to navigate through multiple nested views.

2. **Client-Side File Attachment Fixes**:
   - **State Preservation**: Updated `useEffect` in `QuotationAttachRequirementsModal.jsx` using functional `setInputs(prev => ...)` to ensure that newly selected `File` objects are never wiped out or reset to `null` when existing submission data loads asynchronously.
   - **File Input DOM Reset**: Added native `<input type="file">` `.value = ''` clearing on remove/error to allow the user to remove and re-select the exact same file without triggering silent `onChange` drops.
   - **Comprehensive File Extensions**: Updated the file input `accept` attribute to allow all document and image formats supported by the backend pipeline (`.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .jpg, .jpeg, .png, .webp, .gif, image/*`).
   - **Enhanced Selected File UI**: Added file size display, clear file name truncation with tooltip, a dedicated **"Change"** button (`.attach-change-file-btn`), and an explicit **"Remove"** `(X)` button.

3. **Verification**:
   - Frontend compiled cleanly (`npm run build` passed with zero errors).
   - Backend automated tests passed 100% (`testWorkflowRemodel.js` and `testReceiptAndTrackingIntegration.js`).

## [2026-10-06] Feature: Real-Time onSnapshot Sync for Request Tracker & Firestore Rules

### Overview
Integrated live real-time synchronization (`onSnapshot`) into the **Request Tracker** ([`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx)) and updated [`firestore.rules`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/firestore.rules) so that when operators progress through service procedure milestones or advance quotation states, the public tracking screen updates immediately without requiring a browser page refresh.

### Key Changes
1. **Firestore `onSnapshot` Real-Time Synchronization**:
   - Subscribed to the active fulfillment document (`doc(db, 'activeServices', fulfillmentId)`) with automatic milestone re-computation.
   - Live updates milestone status badges (`Pending`, `Processing`, `Completed`), completion timestamps, phase stepper nodes (Stage 1 to 5), and status summaries (`In Progress`, `Service Completed`, etc.) instantaneously as changes occur in Firestore.
   - Subscribed to quotation documents (`doc(db, 'quotations', quotationId)`) for real-time payment confirmation and activation transitions.
   - Proper lifecycle management: unsubscribes all Firestore listeners on component unmount or reference reset.
2. **Security Rules (`firestore.rules`)**:
   - Added `allow get: if true;` on `activeServices`, `quotations`, `inquiries`, and `receipts` to support direct document `onSnapshot` tracking by ID while maintaining strict `allow list` restrictions against unauthorized scraping.

### Overview
Resolved the modal viewport clipping issue on the public Landing Page E-Receipt viewer and enriched the customer/quotation reference resolution across backend endpoints and PDF rendering components so that the **"BILLED & ISSUED TO"** and **"TRANSACTION & BRANCH DETAILS"** sections display authoritative customer details instead of fallback placeholders.

### Key Changes
1. **Modal Viewport & Stacking Context Fix**:
   - Upgraded [`PdfDocumentView.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx) to mount directly onto `document.body` via `createPortal` with background scroll locking.
   - Restyled `.pdf-export-modal-overlay` and `.pdf-export-modal-card` in [`pdf-document.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/pdf-document.css) with `align-items: flex-start`, `padding: 3rem 1.25rem 2rem`, `max-height: calc(100vh - 4.5rem)`, and sticky header toolbar (`position: sticky; top: 0; z-index: 20`).
   - Completely eliminates the bug where the top toolbar (Print, Download PDF, Close) was tucked under the sticky navbar.

2. **Customer & Reference Resolution ("Billed & Issued To")**:
   - Enriched [`trackingController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/trackingController.js) and [`receiptController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/receiptController.js) to resolve and return full customer information (`clientName`, `contactPerson`, `clientEmail`, `clientPhone`, `quoteNo`, `quotationId`, `paymentId`, `taxAmount`, `rate`, `inclusions`, `exclusions`, `tourDates`).
   - Enhanced [`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx) `handleOpenReceiptModal` to seamlessly merge tracking and quotation context.
   - Updated `normalizeReceiptPdfData` in `PdfDocumentView.jsx` with hierarchical fallbacks (`data.clientName`, `data.fullName`, `data.customerName`, `data.quotation?.clientName`, `data.contactPerson`, `quoteNo`, `paymentId`).

3. **Verification**:
   - Frontend compiled cleanly (`npm run build` passed in 2.81s).
   - Backend automated integration test suite [`testReceiptAndTrackingIntegration.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testReceiptAndTrackingIntegration.js) passed 100%.
   - Full workflow test suite [`testWorkflowRemodel.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testWorkflowRemodel.js) passed 100%.

## [2026-10-06] Clean Architecture: Removed Requirement Inputs & Mandatory Block from Create Quotation Modal

### Overview
Simplified the **Create Quotation Modal** ([`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx)) by removing redundant interactive service requirements file/text inputs and the "Complete Mandatory Requirements" blocking check from quotation creation.

### Key Changes
1. **Separation of Concerns**:
   - Preparing a commercial quotation from an inquiry is now purely focused on commercial terms (linked service package, rate, tax, inclusions, exclusions, tour dates, and remarks).
   - All requirement uploading, review, and walk-in on-site input handling is centralized on the dedicated **Quotation Detail Page** ([`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx)) via [`QuotationRequirementsReview.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QuotationRequirementsReview/QuotationRequirementsReview.jsx).
2. **Simplified Modal Flow**:
   - Removed `reqInputs`, `serviceRequirements` synchronization, and client-side file upload logic from `CreateQuotationModal`.
   - Submit button now straightforwardly generates the official quotation (`ADF-07-001`) and navigates directly to the quotation detail view for requirement handling.

## [2026-10-06] Feature 17: E-Receipt Generation and QR-Based Service Tracking

### Overview
Implemented complete end-to-end Electronic Receipt (**E-Receipt**) generation and dynamic **QR-based Public Service Tracking** for FairFly Travel & Tours. Whenever a quotation is successfully paid—whether through an online PayMongo transaction or an operator-recorded Face-to-Face (F2F) counter/cash payment—the backend atomically issues an official E-Receipt (`RCT-YYYY-XXXXXX`), provisions an active service fulfillment (`SVC-...`), and generates a high-entropy public Service Code (`SRV-YYYY-XXXXXX`) with an embedded QR code linking to the public Landing Page tracker.

### Key Changes & Architecture

1. **Atomic Payment Finalization & Idempotency**:
   - Upgraded [`paymentController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/paymentController.js) with `finalizeSuccessfulPayment` executing inside an ACID Firestore transaction.
   - Guaranteed strict idempotency: repeated PayMongo webhook events, verification callbacks, or duplicate F2F cash recording actions immediately return the existing fulfillment (`SVC-...`) and receipt (`RCT-...`) without duplicate records or multiple receipt numbers.
   - Integrated with [`idGenerator.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/utils/idGenerator.js) for standardized `RCT-YYYY-XXXXXX` and `SRV-YYYY-XXXXXX` identifiers.

2. **Backend Receipt Service & Secure Endpoints**:
   - Built [`receiptService.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/services/receiptService.js) with dynamic QR code generation (encoding `${FRONTEND_URL}/#track-request?trackingId=${serviceCode}`), VAT / non-VAT itemization, BIR compliance structure, and DOT accreditation.
   - Created [`receiptController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/receiptController.js) and [`receiptRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/receiptRoutes.js):
     - Protected routes with RBAC & BOLA / IDOR ownership validation (`GET /api/receipts/:id`, `GET /api/receipts/quotation/:quotationId`, `GET /api/receipts/fulfillment/:fulfillmentId`).
     - Public rate-limited lookup endpoint (`GET /api/receipts/public/:code`) with privacy sanitation.
   - Included dynamic retroactive receipt creation for older paid quotations that predated the receipts collection.

3. **Dedicated Public Service Tracker Page (`/track` & `/tracking`)**:
   - Built [`TrackerPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Index/TrackerPage/TrackerPage.jsx) as a dedicated, standalone public tracking page with architectural Swiss hero header, helpful reference code guidelines, and direct branch support contacts.
   - Updated Navbar with a prominent **"Track Request"** `NavLink` linking directly to `/track` on desktop and mobile drawer.
   - Enhanced [`RequestTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Landing/RequestTracker/RequestTracker.jsx) to automatically read URL parameters (`?trackingId=...` or `?code=...`) upon QR scan or manual entry and trigger immediate service resolution.
   - Built multi-identifier resolution in [`trackingController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/trackingController.js) supporting Service Codes (`SRV-...`), Receipt Numbers (`RCT-...`), Quotation Numbers (`QT-...`), Quotation IDs, and Service Fulfillment IDs.
   - Privacy-safe client data sanitization: customer names are masked (e.g. `Maria S.`), internal operator notes and auth UIDs are omitted, and progress milestones are rendered clearly.
   - Added direct **"View Official E-Receipt"** button on the public tracker opening the high-fidelity receipt modal.

4. **Official E-Receipt Document Viewer (Form ADF-07-002)**:
   - Upgraded [`PdfDocumentView.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx) and [`pdf-document.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/pdf-document.css) to support `type="receipt"`.
   - Rendered official FairFly E-Receipt with company header, BIR/DOT accreditation badges, client and payment metadata, QR code block with legible Service Code beneath, breakdown of rates/fees, payment method breakdown, authorized signatory, and one-click PDF download / browser print functionality.

5. **Client & Operator Portal Integration**:
   - **Client Portal**:
     - Auto-opens the E-Receipt on post-payment redirect from PayMongo.
     - Added **"View E-Receipt"** action button in the Quotations DataTable on [`ClientTrackingPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx) for all paid records.
     - Added **Service Code** badge and **"View Official E-Receipt"** in [`ClientServiceTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx).
   - **Operator Portal**:
     - Embedded receipt number, service code, and **"View / Print E-Receipt"** action modal in [`OperatorPaymentModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/OperatorPaymentModal/OperatorPaymentModal.jsx) upon successful cash payment recording.
     - Added **"View E-Receipt"** header action and payment details link on [`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx).

6. **Automated Integration & Regression Verification**:
   - Created [`testReceiptAndTrackingIntegration.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testReceiptAndTrackingIntegration.js) verifying ID standards, F2F cash payment atomic issuance, PayMongo verification, idempotency protection, public multi-identifier tracking, and cross-tenant IDOR security gates (100% passing).
   - Verified no regressions in existing workflow and archiving suites (`testWorkflowRemodel.js`, `testInquiryQuotationArchivingAndRejection.js`).

- **Problem:** Opening the Admin Service edit modal crashed with `formData.price.trim is not a function` when a service's `price` was stored as a number in Firestore.
- **Fix:** [`ServiceForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceModal/ServiceForm.jsx) now coerces `name`, `customCategory`, `price`, and `description` with `String(value ?? '')` before trimming, both in validation and in the submit payload.

---

## [2026-10-06] Inquiry & Quotation Archiving System + Client Quotation Rejection Workflow

### Overview
Replaced permanent deletion of **Inquiries** and **Quotations** with an asymmetric cascading archival and restoration system across backend and frontend, while introducing complete **Client-Side Quotation Rejection** functionality (`Draft -> Sent -> Accepted OR Rejected`). This preserves historical records, eliminates accidental data loss, maintains clean operational tables, and completes the quotation lifecycle.

### Key Changes

1. **Disabled Permanent Deletion**:
   - Replaced all "Delete" buttons and modal dialogs across Inquiry and Quotation views with "Archive".
   - `DELETE /api/inquiries/:id` and `DELETE /api/quotations/:id` now reject deletion with `400 Bad Request` explaining that permanent deletion has been retired to preserve business and audit history.

2. **Asymmetric Cascading Archival Model**:
   - **Archiving an Inquiry**: Automatically cascades and archives all linked quotations, assigning `archivedReason: 'inquiry_archived'`.
   - **Archiving a Quotation**: Archives only that specific quotation (`archivedReason: 'manual_archive'`); the parent inquiry remains active.
   - **Restoring an Inquiry**: Restores the parent inquiry and selectively restores only quotations that were cascade-archived (`archivedReason === 'inquiry_archived'`), preserving independently archived quotations.
   - **Restoring a Quotation**: Strictly verifies parent inquiry state; prevents orphaned quotations by rejecting restoration with `400 Bad Request` if the parent inquiry is archived.

3. **Client-Side Quotation Rejection Lifecycle**:
   - Added backend route `POST /api/quotations/:id/reject` with BOLA ownership verification (`clientUid === req.user.uid`), role-based access, and state validation (cannot reject paid, accepted, archived, or already rejected quotations).
   - Generates server timestamps (`rejectedAt`), records `rejectedBy` and optional `rejectionReason`, updates originating inquiry status to `rejected`, and emits real-time notifications to the branch operator and administrators.
   - Client portal presents **"Reject Quotation"** button alongside acceptance when quotation is in `Sent` status.
   - Built confirmation modal with optional rejection reason textarea adhering to the zero-radius design token standard.
   - Updated quotation tables and detail modals to display `Rejected` status pill, rejection date, and reason banner while disabling further decision actions.

4. **Active vs. Archived Table Segregation**:
   - Added `FilterChipGroup` with `[ Active Records ] [ Archived ]` toggle on Operator Inquiries, Operator Quotations, and Admin Inquiry History pages.
   - Updated database queries to exclude archived records by default (`archived: false`), ensuring fast query execution and clean daily operational queues.
   - Added graceful fallback handling in `queryDatabaseAdvanced` for missing/provisioning Firestore composite indexes.
   - Existing documents safely treated as active via database migration script (`migrateArchiveFields.js`).

5. **Automated Verification**:
   - Created and executed comprehensive integration test suite [`testInquiryQuotationArchivingAndRejection.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testInquiryQuotationArchivingAndRejection.js) verifying all 7 core archival, cascade, restoration guard, deletion block, and client rejection requirements.
   - Verified 100% pass rate across existing security (`testSecurityFixes.js`) and workflow (`testWorkflowRemodel.js`) test suites.

---

## [2026-10-06] Operator Quotation Details: Hide "Request Corrections" and Actions Toolbar Once Requirements Verified

### Overview
Updated [`QuotationRequirementsReview.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QuotationRequirementsReview/QuotationRequirementsReview.jsx) so that the entire review and correction action toolbar (including the **"Request Corrections"** button) is hidden once the quotation's requirements have been verified and approved (`requirementsStatus === 'approved'` or `'not_required'`).

### Changes
- Wrapped the review and action toolbar in `reqStatus !== 'approved' && reqStatus !== 'not_required'`.
- Ensured verified quotations present a clean, finalized document verification section with the official approval badge and operator timestamp metadata callout.

---

## [2026-10-06] Operator Quotations Table: Removed "Mark as Sent" Quick Action

### Overview
Removed the inline **"Mark as Sent"** quick action button from the operator's Quotations Table / card list ([`OperatorQuotations.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx)).

### Rationale & Clean Architecture
- Eliminates potential misclicks from list views and ensures that quotations are audited and sent strictly through the **Quotation Details Page** ([`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx)) after verifying all service details and requirements.
- Cleaned up unused status handlers and imports in [`OperatorQuotations.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx), keeping the row actions clean (View link + Status Pill).

---

## [2026-10-05] Operator Quotations Table: Removed "Accept on Behalf" Button to Prevent Accidental Triggers

### Overview
Removed the inline **"Accept on Behalf"** button and its modal trigger from the operator's main Quotations list / Data Table ([`OperatorQuotations.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx)).

### Rationale & Flow Safeguards
- Prevent accidental clicks directly from list views before an operator properly audits client details and attached requirements.
- Acceptance on behalf of walk-in clients remains strictly handled within the dedicated **Quotation Details Page** ([`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx)), where all requirements verification, service schemas, and authorization acknowledgments can be reviewed in context.

---

## [2026-10-05] Operator Quotation Details: Hide "Complete on Site (Walk-in)" Once Requirements Verified

### Overview
Updated [`QuotationRequirementsReview.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QuotationRequirementsReview/QuotationRequirementsReview.jsx) so that the **"Complete on Site (Walk-in)"** button in the review toolbar is conditionally hidden once the quotation's requirements have reached verified status (`requirementsStatus === 'approved'` or `'not_required'`).

### Changes
- Wrapped the "Complete on Site (Walk-in)" action button in `reqStatus !== 'approved' && reqStatus !== 'not_required'`.
- Cleaned up the operator toolbar to only show relevant post-approval actions or indicators when all mandatory requirements have been verified.

---

## [2026-10-05] System-Wide Form Modal Widening & Responsive Breakpoint Optimization

### Overview
Addressed cramped and narrow layouts across all data-entry and form modals in the system. Reconfigured global `BaseModal` presets and explicit modal widths to modern desktop proportions (widening from 500px–720px / 36rem–54rem to 60rem–76rem), while reinforcing strict mobile breakpoint protection (`@media (max-width: 768px)` with `width: 95% !important; max-width: 100% !important`) to eliminate overflowing or horizontal scroll on mobile devices.

### Detailed Changes
1. **Core Modal Primitives ([`BaseModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ModalBase/BaseModal.jsx) & [`base-modal.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ModalBase/base-modal.css))**:
   - `size="large"`: Widened default max-width from `54rem` to `72rem` (`width: 95%`).
   - `size="xl"`: Widened default max-width from `66rem` to `80rem` (`width: 96%`).
   - `size="medium"`: Widened default max-width from `40rem` to `56rem` (`width: 94%`).
   - Added responsive mobile override via `@media (max-width: 768px)` enforcing `width: 95% !important; max-width: 100% !important; max-height: 92vh;`.

2. **Client Form Modals**:
   - [`ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`ClientAppointmentForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx): Widened to `maxWidth="54rem"`, `width="95%"`.
   - [`QuotationAttachRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.

3. **Operator Form & Builder Modals**:
   - [`CreateInquiryFormModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx): Widened from `720px` to `maxWidth="76rem"`, `width="96%"`.
   - [`AddServiceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`ServiceWorkflowModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/ServiceWorkflowModal/ServiceWorkflowModal.jsx): Widened from `720px` to `maxWidth="72rem"`, `width="95%"`.
   - [`QualificationApplicationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QualificationApplicationModal/QualificationApplicationModal.jsx): Widened from `42rem` to `maxWidth="60rem"`, `width="95%"`.
   - [`HistoryDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/HistoryDetailModal/HistoryDetailModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`AcceptOnBehalfModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/AcceptOnBehalfModal/AcceptOnBehalfModal.jsx): Widened to `maxWidth="48rem"`, `width="95%"`.
   - [`OperatorAppointmentCalendar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/OperatorAppointmentCalendar/OperatorAppointmentCalendar.jsx): Widened to `maxWidth="54rem"`, `width="95%"`.
   - [`InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx): Attach service modal widened to `maxWidth="60rem"`, `width="95%"`.
   - [`QuotationRequirementsReview.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QuotationRequirementsReview/QuotationRequirementsReview.jsx): On-site intake modal widened to `maxWidth="68rem"`, `width="95%"`.

4. **Admin Configuration, Management & Builder Modals**:
   - [`ServiceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceModal/ServiceModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`WorkflowModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx) & [`WorkflowForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowForm.jsx): Widened to `maxWidth="72rem"` and `maxWidth="68rem"`.
   - [`ServiceWorkflowsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`ServiceRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`InquiryFormBuilderModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/InquiryFormBuilderModal/InquiryFormBuilderModal.jsx): Widened to `maxWidth="76rem"`, `width="96%"`.
   - [`FranchiseApplicationFormBuilderModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/FranchiseApplicationFormBuilderModal/FranchiseApplicationFormBuilderModal.jsx): Widened to `maxWidth="76rem"`, `width="96%"`.
   - [`ApplicationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ApplicationModal/ApplicationModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`OperatorModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/OperatorModal/OperatorModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`AdminModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/AdminModal/AdminModal.jsx): Widened to `maxWidth="60rem"`, `width="95%"`.
   - [`ClientEditModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ClientEditModal/ClientEditModal.jsx): Widened to `maxWidth="60rem"`, `width="95%"`.
   - [`ResourceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ResourceModal/ResourceModal.jsx): Widened to `maxWidth="54rem"`, `width="95%"`.
   - [`QuickLinkModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx): Widened to `maxWidth="66rem"`, `width="95%"`.
   - [`AdminLogsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx): Widened to `maxWidth="72rem"`, `width="95%"`.
   - [`CreateTicketModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx): Widened to `maxWidth="68rem"`, `width="95%"`.
   - [`AdminAppointments.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminAppointments/AdminAppointments.jsx): Widened to `maxWidth="62rem"`, `width="95%"`.
   - [`FranchiseAppDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseAppDetailPage.jsx): Consultation scheduling modal widened to `maxWidth="54rem"`, `width="95%"`.
   - [`AdminQualificationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminQualifications/AdminQualificationDetailPage.jsx): Document preview dialog widened to `maxWidth="64rem"`, `width="95%"`.
   - [`AnnouncementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/AnnouncementsModal/AnnouncementsModal.jsx): Widened to `maxWidth="60rem"`, `width="95%"`.

---

## [2026-10-05] Service Workflow Enforcement, Inquiry Intake Upgrade & Mandatory Email

### Overview
1. **Mandatory Operational Workflow on Services (Defense-in-Depth)**:
   - Evaluated and implemented the recommended best solution to guarantee that no service can be created, displayed to clients, or linked by operators without an assigned operational workflow.
   - **Creation Guard**: Blocked creation and modification of services lacking `workflowIds` in [`ServiceForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceModal/ServiceForm.jsx) and backend [`serviceController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/serviceController.js) (`createService`, `updateService`).
   - **Client Store Guard**: Filtered [`Services.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/Services.jsx) and [`ServiceItemPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientServiceItem/ServiceItemPage.jsx) so services without assigned workflows are hidden or disabled from client inquiries.
   - **Operator Attach Guard**: Filtered [`InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx) and [`CreateInquiryFormModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx), and added backend validation in [`inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js) (`attachServiceToInquiry`).

2. **Upgraded Service Store Inquiry Intake Modal ([`ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx))**:
   - Upgraded the "Inquire Now" modal on the service store to match the official SAF-01-002 intake fields from [`ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx).
   - Added:
     - Client Type toggle (Individual vs. Company / Organization)
     - Company Name & 3-field Contact Person (First Name, M.I., Last Name)
     - Full Name (First Name, M.I., Last Name)
     - Population / Pax Count
     - Complete Address
     - Cellphone No. & Telephone No.
     - Contract No. & IS No.
     - Debounced Franchise/Branch Search via [`BranchSelectSearch`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/BranchSelectSearch/BranchSelectSearch.jsx)
     - Specified Requirements of Client & Remarks
   - **Excluded Services Offered Checklist**: Preserved predetermined service context from the store and showcased a prominent Selected Service Details preview card and requirements informational notice.

3. **Mandatory Email Address Enforced Across All Inquiry Forms**:
   - Enforced mandatory valid email format across [`ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx), [`ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx), and [`CreateInquiryFormModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx).
   - Enforced backend zero-trust validation in [`inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js) (`createInquiry`), returning `400 Bad Request` if email is missing or not a valid email format.

---

## [2026-10-05] Operator Guard: Restrict "Send to Client" and "Accept on Behalf" Until Requirements Verified

### Overview
Enforced zero-trust validation and frontend guards so that the Operator cannot send a quotation to the client (`Sent`) or accept a quotation on the client's behalf (`Accepted`) until all service requirements are verified and approved (`requirementsStatus === 'approved'` or `'not_required'`).

### Key Implementation Details
1. **Frontend Detail Page ([`QuotationDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx))**:
   - **Send to Client Guard**: The "Send to Client" button is disabled with gray styling and tooltip when `!requirementsApproved`. Attempting to trigger `handleStatusChange('Sent')` shows a toast warning alerting the operator that requirements must be approved first.
   - **Accept on Behalf Guard**: The "Accept on Behalf of Client (On-Site)" button is disabled with gray styling and tooltip when `!requirementsApproved`. Calling `handleOpenAcceptModal` displays a toast warning if clicked prematurely.
   - **Requirements Verification Alert Banner**: Added a high-visibility warning callout banner informing operators that sending and acceptance actions are locked until mandatory requirements below are verified and approved.
2. **Accept on Behalf Modal ([`AcceptOnBehalfModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/AcceptOnBehalfModal/AcceptOnBehalfModal.jsx))**:
   - Strictly validates `requirementsStatus === 'approved' || requirementsStatus === 'not_required'`.
   - Disables the "Confirm Acceptance & Continue" submission button with a warning alert box explaining that requirements verification is pending.
3. **Operator Quotations Table ([`OperatorQuotations.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx))**:
   - Both the "Accept on Behalf" and "Mark as Sent" row action buttons are disabled when requirements are not approved, displaying descriptive tooltips and toast notifications if triggered.
4. **Backend Zero-Trust API Gates ([`quotationController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/quotationController.js))**:
   - `PATCH /api/quotations/:id/status`: Rejects transitions to `'Sent'` or `'Accepted'` with `400 Bad Request` if `requirementsStatus !== 'approved' && requirementsStatus !== 'not_required'`.
   - `POST /api/quotations/:id/accept`: Strictly verifies that `requirementsStatus === 'approved' || requirementsStatus === 'not_required'`, rejecting premature requests with `400 Bad Request`.

---

## [2026-10-05] Inquiry Page Attachment Removal & Default Online Client Portal Workflow

### Overview
1. **Removed Requirement Attachments from Inquiry Pages**: Completely removed the feature where operators or clients could view or upload document attachments on the Inquiry page. All requirement attachment, review, and verification workflows now reside strictly on the Quotation stage.
2. **Removed "Submitted Requirements & Attachments" Container**: Removed the attachments container from [`InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx), [`AdminInquiryDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx), and [`InquiryDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/InquiryDetailModal/InquiryDetailModal.jsx). Inquiries now strictly show the client profile, service attribution, and text specifications ("Specified Requirements of Client").
3. **Default to Online Workflow**: Inquiries submitted through the client portal ([`ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx) and [`ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx)) now explicitly default to `isWalkIn: false` and `workflow: 'online'`, enforced server-side in [`inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js).
4. **Cleaned Up Client Tracking Page**: Removed the legacy "Submit Reqs" button on the Inquiry tab and decommissioned [`ClientSubmitRequirementsModal`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientSubmitRequirementsModal/ClientSubmitRequirementsModal.jsx) in favor of the quotation-level [`QuotationAttachRequirementsModal`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx).

---

## [2026-10-05] FairFly Workflow Remodel: Inquiry → Quotation → Requirements → Approval → Payment

### Overview
Remodeled the entire FairFly customer journey so that service legal and document requirements are **an attachment/verification step during quotation acceptance**, rather than an upfront barrier when initially creating an inquiry or commercial quotation.

The new workflow establishes a unified architecture across Online and Walk-in clients:
`Inquiry → Service Selection/Assignment → Quotation → Client Requirements → Operator Review → Final Quotation Approval → Client Acceptance → Payment → Fulfillment`

### Key Architectural & Functional Improvements

1. **Inquiry Decoupling from Legal/Document Requirements**:
   - Clients creating an inquiry (whether with a pre-selected service or general inquiry) are no longer blocked by mandatory document uploads.
   - When an operator attaches a catalog service to an inquiry, the inquiry stays in `submitted` status and is immediately ready for commercial quotation drafting.

2. **Commercial Quotation Generation**:
   - Operators can prepare and send commercial proposals (rates, tour dates, inclusions, exclusions, remarks) immediately without waiting for client documents.
   - Quotations initialize with authoritative `requirementsStatus`: `'pending'` (if the service has mandatory requirements) or `'not_required'` (if zero mandatory requirements).

3. **Client Attachment & Operator Review of Requirements**:
   - **Client Experience**: On [`QuotationDetailModal`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationDetailModal/QuotationDetailModal.jsx) and [`ClientTrackingPage`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/ClientSide/ClientTracking/ClientTrackingPage.jsx), client sees quotation details and a prominent status callout. If requirements are pending or changes requested, an "Attach Requirements" button opens [`QuotationAttachRequirementsModal`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/QuotationAttachRequirementsModal/QuotationAttachRequirementsModal.jsx), dynamically loading the service's schema, validating mandatory items, uploading securely via backend, and submitting for operator review (`requirementsStatus: 'submitted'`).
   - **Operator Review**: On [`QuotationDetailPage`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx), integrated [`QuotationRequirementsReview`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QuotationRequirementsReview/QuotationRequirementsReview.jsx) component displaying catalog schema merged with submitted documents, uploaded file links, lightbox preview, and actions:
     - **Approve Requirements**: Moves quotation to `requirementsStatus: 'approved'`, notifying client they can now accept.
     - **Request Corrections**: Sets `requirementsStatus: 'changes_requested'`, recording specific feedback.
     - **Complete on Site (Walk-in)**: Allows the operator to assist walk-in clients by uploading documents or filling text inputs directly on the quotation.

4. **Zero-Trust Backend Security Gates & Payment Integrity**:
   - **Acceptance Gate**: `POST /api/quotations/:id/accept` rejects premature acceptance with `400 Bad Request` if `requirementsStatus !== 'approved'`.
   - **Payment Gate**: `POST /api/payments/cash` and `POST /api/payments/checkout-session` verify `requirementsStatus === 'approved'` before accepting cash or creating PayMongo checkout sessions.
   - **Service Change Re-evaluation**: In `PUT /api/quotations/:id`, if the operator changes `serviceId`, the backend re-evaluates the new service requirements schema, resetting `requirementsStatus` to `'pending'` and clearing previous approvals so incompatible requirements cannot be carried over.
   - **Payment Idempotency**: `finalizeSuccessfulPayment` verifies transaction state to prevent duplicate fulfillments.

5. **Walk-in Workflows (Direct Cash & PayMongo QR)**:
   - Walk-in clients leverage the identical service requirements schema and verification pipeline.
   - Operators can complete requirements on-site, approve them, accept the quotation on the client's behalf, and either record Direct Cash payment or generate a dynamic PayMongo QR code for on-the-spot checkout.

6. **Automated Verification & Complete Database Clean-up**:
   - Comprehensive test suite ([`fly-api/src/scripts/testWorkflowRemodel.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/scripts/testWorkflowRemodel.js)) verified all 4 customer flows, zero-trust security blocks, and idempotency.
   - Purged all records of `payments`, `inquiries`, `quotations`, and `submitted_requirements` in Firestore as requested.

---



## [2026-10-05] Inquiry Workflow Switching & Quotation Creation Mandatory Service / Requirement Enforcement

### Overview
1. **Inquiry Workflow Switching Fix**: Fixed an issue where switching the client workflow from Online to Walk-in on the Inquiry Form Detail page (`/operator/inquiry-forms/:id`) did not persist in Firestore. The backend now immediately updates `status: 'submitted'`, `isWalkIn: true`, and attaches the service requirements schema, updating the UI in real time.
2. **Quotation Modal Streamlining**: Removed the redundant "Client Intake & Requirements Workflow *" radio options and the blue online client warning banner from [`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx), centralizing client intake workflow decisions on the Inquiry Form page.
3. **Mandatory Service & Requirements Enforcement**: Blocked quotation creation unless a catalog service is linked to the inquiry/quotation and all mandatory service requirements are fulfilled, enforced both on the frontend UI and via zero-trust validation in the backend API.

### Key Changes
1. **Backend Inquiry Controller ([`fly-api/src/controllers/inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js))**:
   - Fixed `attachServiceToInquiry`: `walkInClient: true` now persists `status: 'submitted'`, `isWalkIn: true`, and resolved requirements to Firestore.
   - Preserves `status: 'pending_requirements'` and `isWalkIn: false` when explicitly configuring for Online workflow.
   - Added operator audit logging (`ATTACH_SERVICE_INQUIRY`) for both walk-in and online workflow configurations.
2. **Backend Quotation Controller ([`fly-api/src/controllers/quotationController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/quotationController.js))**:
   - Enforced `effectiveServiceId = serviceId || linkedInquiry?.serviceId`. Returns `400 Bad Request` if no catalog service is linked.
   - Returns `400 Bad Request` if the linked inquiry is in online `pending_requirements` workflow and has not been switched to Walk-in.
   - Enforces zero-trust mandatory requirements verification against the catalog service schema, rejecting with `400 Bad Request` if any mandatory item is missing both a valid file attachment and text input.
3. **Quotation Creation Modal ([`fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx))**:
   - Removed `clientWorkflow` state and the entire "Client Intake & Requirements Workflow *" radio card section.
   - Removed the blue notice banner with the "Switch to Walk-in" button.
   - Marked `Link Catalog Service *` as required in `isFormValid` and `handleSubmit`.
   - Updated modal submit button with dynamic states: displays `"Link Service Required"` if no service is chosen, `"Complete Mandatory Requirements"` if required items are missing, and enables `"Create Quotation"` once satisfied.
4. **Inquiry Form Detail Page ([`fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx))**:
   - Added `handleQuickSwitchToWalkIn` action on the yellow "Awaiting Client Requirements" banner for 1-click conversion to Walk-in workflow.
   - Guarded the "Create Quotation" action to warn the operator and open the configuration modal if no catalog service is attached or if the inquiry is currently in online pending requirements.
   - Dynamic BaseModal title (`Configure Service & Client Workflow` vs `Attach Catalog Service`) and submit button label (`Update Workflow & Service` vs `Attach Service`).

---

## [2026-10-05] Inquiry Requirements: Support Text Input Submissions in Operator and Admin Portals

### Overview
Resolved an issue where text requirements submitted by online clients (e.g. for custom inquiries or service schemas with text/date/number input requirements) displayed an "Attach" file upload button and were labeled as missing documents on the Operator and Admin sides instead of displaying the client's submitted text.

### Key Changes
1. **Operator Inquiry Detail Page ([`InquiryFormDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/InquiryFormDetailPage.jsx))**:
   - Updated `parseInquiryData` to preserve `inputType`, `value`, `textValue`, and `file` metadata across legacy and dynamic requirement schemas.
   - Refactored `combinedForm` memo to guarantee that `normalizedReqs` from `submitted_requirements` are unified with the inquiry document.
   - Updated section heading from "Document Attachments" to "Submitted Requirements & Attachments".
   - Requirement card rendering:
     - Distinguishes file requirements (`hasFile`) from text inputs (`hasText`).
     - Renders client's submitted text in `.inquiry-req-text-box` with a `Text Provided` status badge.
     - Prevents display of the "Attach" file upload button when a text requirement is already satisfied.
     - Passes `combinedForm` to [`CreateQuotationModal`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx) and [`PdfDocumentView`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx) to preserve full requirement values during quotation and official PDF generation.
2. **Admin Inquiry Detail Page ([`AdminInquiryDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminInquiryHistory/AdminInquiryDetailPage.jsx))**:
   - Updated `parseInquiryData` and `combinedInquiry` to preserve requirement `inputType` and `value`.
   - Updated requirement cards to render submitted text values with `Text Provided` badges instead of showing false "Missing Document" warnings.
3. **Quotation Generation Modal ([`CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx))**:
   - Enhanced requirement state initialization to read `existing?.value` or `existing?.textValue`.
   - Updated `isRequirementsComplete` validation to recognize requirements as satisfied when valid text is present, preventing false mandatory requirement submission blocks.
4. **CSS Enhancements ([`inquiry-form-detail.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorInquiryForms/inquiry-form-detail.css))**:
   - Added styles for `.inquiry-req-info-col`, `.inquiry-req-badge-required`, `.inquiry-req-badge-optional`, `.inquiry-req-text-box`, and `.inquiry-req-text-val`.
   - Adheres to the sharp architectural grid standard (0px border radius).

---

## [2026-10-05] Operator Activity Logging & Auditable History System

### Overview
Implemented comprehensive, verbose activity logging for Branch Operators across the FairFly system using a top-level `operator-logs` Firestore collection. Integrated human-readable action records into both the **Admin Operator Detail View** (`/admin/operators/:id`) and the **Operator Portal** (Operator Dashboard `/operator`, dedicated Activity Logs page `/operator/logs`, and Operator History `/operator/history`). Features a strict 90-day retention flag (`isArchived: false`, `retentionExpiresAt`) and true Firestore cursor pagination (`limit` & `startAfter`) to guarantee minimal document read costs and zero unbounded queries.

### Key Changes
1. **Top-Level Firestore Architecture (`operator-logs`)**:
   - Registered `ID_PREFIXES.OPERATOR_LOG = 'OPL'` in [`fly-api/src/utils/idGenerator.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/utils/idGenerator.js).
   - Created [`fly-api/src/services/operatorLoggerService.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/services/operatorLoggerService.js) implementing:
     - `logOperatorAction(...)`: writes to `operator-logs` with `operatorId`, `operatorEmail`, `branchName`, `action`, `entityType`, `entityId`, `description`, `timestamp`, `isArchived: false`, `retentionExpiresAt` (90 days), and `metadata`.
     - `logFromRequest(req, ...)`: derives authenticated operator identity safely from cryptographically verified JWT (`req.user.uid`).
     - `getOperatorLogs(...)`: retrieves paginated operator logs using sequential document cursor (`startAfter`) and active retention filter (`isArchived == false`).
2. **Backend Controller Integration**:
   - **Quotations** ([`quotationController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/quotationController.js)): Logs quotation creation, status updates, detail revisions, customer acceptance, and deletion with formatted quote numbers and amounts.
   - **Inquiries** ([`inquiryController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/inquiryController.js)): Logs intake recordings, confirmation and quotation generation, service attachment, and deletion with form/control numbers.
   - **Active Services** ([`activeServiceController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/activeServiceController.js)): Logs step completion progress, full service fulfillment completions, and service order cancellations with refund details.
   - **Appointments** ([`appointmentController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/appointmentController.js)): Logs confirmation and status changes.
   - **Payments** ([`paymentController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/paymentController.js)): Logs checkout link generation and on-site payment verifications.
3. **API & Route Guarding**:
   - Added `GET /api/operators/:id/logs` to [`operatorRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/operatorRoutes.js) guarded by `verifyFirebaseToken` and `requireRole(['admin', 'operator'])`.
   - Supports `:id === 'me'` alias for authenticated operators to view their own activity history.
4. **Security Rules & Composite Indexes**:
   - [`firestore.rules`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/firestore.rules): Added rule for `/operator-logs/{logId}` granting read to admins and owner operators (`resource.data.operatorId == request.auth.uid`), while disallowing all direct client writes (`allow write: if false`).
   - [`firestore.indexes.json`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/firestore.indexes.json): Added composite indexes on `operatorId`, `isArchived`, and `timestamp` (DESC).
5. **Frontend UI Components**:
   - Created [`OperatorActivityLogSection.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/OperatorActivityLogs/OperatorActivityLogSection.jsx) and [`operator-activity-logs.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/OperatorActivityLogs/operator-activity-logs.css) displaying the top 5 recent actions with 90d retention badge and "View More" button.
   - Created [`OperatorLogsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/OperatorActivityLogs/OperatorLogsModal.jsx) with sequential cursor-based Next/Previous pagination.
   - Created dedicated [`OperatorLogsPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorLogs/OperatorLogsPage.jsx) (`/operator/logs`) with search and category filtering (Quotations, Inquiries, Services, Payments, Appointments).
   - Integrated into:
     - Admin Operator Detail ([`OperatorDetailPage.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminOperators/OperatorDetailPage.jsx))
     - Operator Dashboard ([`OperatorDashboard.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx))
     - Operator Sidebar ([`OperatorLayout.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorLayout/OperatorLayout.jsx))
     - Operator History Tabs ([`OperatorHistory.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx))

---

## [2026-10-05] UI Styling: Round Chatbot Quick Action & Launcher Buttons

### Overview
Updated the Chatbot Quick Action suggestion buttons (`.chatbot-quick-access-button`) and floating trigger launcher button (`.chatbot-launcher`) to have round borders, restoring comfortable pill and circular touch targets for AI chat interaction while preserving the sharp architectural layout across the rest of the application.

### Key Changes
1. **Global CSS Rules ([`src/index.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/index.css))**:
   - Added `.chatbot-launcher` to the circular 50% exception list alongside the notification bell button.
   - Added `.chatbot-quick-access-button` to the pill 9999px exception list alongside notification badges.
2. **Chatbot Component ([`src/components/Shared/Chatbot/chatbot.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Chatbot/chatbot.css))**:
   - `.chatbot-launcher`: Configured with `border-radius: 50% !important;` for a smooth circular floating button profile.
   - `.chatbot-quick-access-button`: Configured with `border-radius: 9999px !important;` for rounded FAQ suggestion pills.

---

## [2026-10-05] UI Styling: Round Notification Bell and Notification Badges

### Overview
Updated the notification bell button and all notification badges across the system to be round (circular trigger button and rounded badge capsules/dots), preserving the sharp architectural grid on cards, inputs, and modals while providing smooth, recognizable circular affordances for notification alerts and unread counters.

### Key Changes
1. **Global CSS Rules ([`src/index.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/index.css))**:
   - Added explicit universal exceptions for `.notification-bell-btn`, `.notification-icon-bubble`, `.notification-empty-icon`, and `.notification-unread-dot` with `border-radius: 50% !important`.
   - Added explicit pill exceptions for `.notification-badge`, `.notification-count-pill`, `.sidebar-tab-badge`, and `.client-nav-badge` with `border-radius: 9999px !important`.
   - Removed notification badges and icons from the bottom 0px reset selector list to prevent cascade flattening.
2. **Notification Bell Component ([`src/components/UI/NotificationBell/notification-bell.css`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/NotificationBell/notification-bell.css))**:
   - `.notification-bell-btn`: Restored circular button profile with `border-radius: 50% !important`.
   - `.notification-badge`: Restored rounded unread badge pill with `border-radius: 9999px !important`.
   - `.notification-count-pill`: Restored rounded header count chip with `border-radius: 9999px !important`.
   - `.notification-icon-bubble`: Restored circular icon bubble with `border-radius: 50% !important`.
   - `.notification-unread-dot`: Restored circular unread indicator dot with `border-radius: 50% !important`.
   - `.notification-empty-icon`: Restored circular empty state icon bubble with `border-radius: 50% !important`.
3. **App Shell Navigation Badges ([`AppSidebar`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppSidebar/app-sidebar.css) & [`AppNavbar`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppNavbar/app-navbar.css))**:
   - `.sidebar-tab-badge`: Restored rounded count pill with `border-radius: 9999px !important`.
   - `.client-nav-badge`: Restored rounded count pill with `border-radius: 9999px !important`.

---

## [2026-10-05] Design System: System-Wide UI Remodeling to Pure Razor-Sharp Architecture (0px Border Radius)

### Overview
Successfully remodeled the entire FairFly design system across all modules (Landing Page, Client Portal, Operator Portal, Admin Portal, Shared Components, and Auth Shell) to eliminate the overly "roundy" aesthetic. In alignment with the user's preference for **Pure Razor-Sharp Architectural Grid** and **Crisp Rectangular Tags**, all cards, buttons, inputs, selects, textareas, modals, chips, pills, and containers now feature clean, modern 0px border-radii while preserving radial rotation for animated loading spinners.

### Key Architectural & Component Changes
1. **Design Tokens & Global CSS Engine (`src/index.css`)**:
   - Set all design token radii to zero: `--radius-xs: 0;`, `--radius-sm: 0;`, `--radius-md: 0;`, `--radius-lg: 0;`, `--radius-full: 0;`.
   - Enforced universal 0px border-radius reset on `*, *::before, *::after` with explicit exception for `.loader-spinner` (`border-radius: 50% !important`) to maintain circular rotation.
   - Refactored `.status-pill` from rounded capsule into a sharp rectangular tag with square color-coded indicator dot (`border-radius: 0;`).
   - Flattened `.card`, `.skeleton-card`, `.skeleton-circle`, `.skeleton-avatar`, `.skeleton-badge`, `.skeleton-btn`, and scrollbars.

2. **Core System Primitives (`src/components/UI`)**:
   - `DataTable`: Flattened bulk action bar, bulk badges, and action buttons.
   - `KpiCard`: Flattened card surface, replaced circular icon bubble with sharp architectural square box, and updated KPI badges to crisp rectangular tags.
   - `BaseModal`: Flattened modal container, close button, and header/footer layouts.
   - `SearchBar` & `FilterChipGroup`: Flattened search wrapper and converted filter pills into rectangular chips with accent borders.
   - `NotificationBell`: Flattened trigger button, unread count tag, floating dropdown panel, empty state icon, and notification item icon boxes.
   - `Pagination`: Flattened wrapper, size selector dropdown, and pagination page buttons.
   - `BranchSelectSearch` & `QuickLinkSelectSearch`: Flattened input triggers, dropdown menus, clear buttons, and category badges.
   - `Toast`: Flattened notification alert cards and close buttons.
   - `ServiceCarouselGallery` & `ServiceCard`: Flattened gallery stage, navigation arrow buttons, thumbnails, category badges, and cards.
   - `ImageLightbox`: Flattened viewport image, counter tag, navigation controls, and action buttons.

3. **App Shell & Auth Pages (`src/pages/Index`)**:
   - `AppSidebar` & `AppNavbar`: Flattened active tab indicator bar, square profile avatar with initials, navigation links, and notification counter tags.
   - `Login`, `Register`, `ResetPassword`, `VerifyEmail`, `ReuploadId`: Flattened hero badges, form inputs, segment OTP boxes, submit CTA buttons, role selector tabs, and notice cards.
   - `Chatbot`: Flattened floating launcher button, chat window container, message bubbles, quick access chips, and send button.

4. **Client & Operator Module Components (`src/components/Shared`, `src/components/Client`, `src/pages/Operator`)**:
   - `ValidIdUpload` & `ValidIdInfoModal`: Flattened upload dropzones, file preview cards, and ID requirement cards.
   - `TeamChatModal`: Flattened chat modal container and message bubbles.
   - `ServiceDetailModal`: Flattened Airbnb-style modal container, hero badge, requirements list, and booking widget.
   - `AppointmentCalendar`: Flattened status legend indicators, month/week grid day cells, and appointment chips.
   - `ClientServicesMarketplace` & `ClientTracking`: Flattened aside filter drawer, search boxes, service cards, quotation cards, and inquiry cards.
   - Operator Dashboard, Quotation Detail, Inquiry Form Detail, and Appointments: Flattened KPI boxes, action buttons, status badges, and procedure headers.

5. **Admin Module Components & Modals (`src/components/Admin`, `src/pages/Admin`)**:
   - `StatCards`: Normalized stat card icon bubbles and trend badges to crisp 0px square containers.
   - `modal.css`: Flattened all admin modal inputs, selects, action buttons (`.modalSubmitBtn`), steps container, step cards, and step number badges (`.stepBadge`).
   - `ApplicationModal`: Flattened modal container, close button, application status tag, and approval/rejection button groups.
   - `ResourceModal`: Flattened upload dropzone, icon bubble, and file preview card.
   - `FranchiseeApplication`: Flattened franchisee card, avatar container, status tag, action buttons, and footer.
   - `Skeleton`: Normalized `.skeleton-primitive--circle` to 0px to match architectural square layout.

---

## [2026-10-05] Feature: Alternating Section Travel Backgrounds (bg-nobg-bg-nobg) with Opacity 0.12

### Overview
Implemented the requested alternating background rhythm (`bg` - `nobg` - `bg` - `nobg` - `bg` - `nobg`) across all landing page sections beyond Business System. Generated custom AI travel assets matching each section's subject matter and applied them at `opacity: 0.12` with smooth multi-stop gradient overlays, ensuring optimal text readability and elegant visual rhythm.

### Alternating Section Rhythm & Assets
1. **`BusinessSystem` (BG)**:
   - Asset: `public/business_system_bg.jpg` (Modern luxury airport terminal lounge overlooking the runway).
   - Image Opacity: `0.12`.
2. **`ServiceGuidelines` (NO BG)**:
   - Clean solid off-white background (`var(--bg, #F8FAFC)`).
3. **`BusinessModel` (BG)**:
   - Asset: `public/business_model_bg.jpg` (Overhead luxury business travel desk with route-planning tablet, passport, boarding passes, and runway view).
   - Image Opacity: `0.12`.
   - Updated `BusinessModel.jsx` and `business-model.css`.
4. **`TrainingComparison` (NO BG)**:
   - Clean solid off-white background (`var(--bg, #F8FAFC)`).
5. **`Explore` (BG)**:
   - Asset: `public/explore_bg.jpg` (Atmospheric high-altitude curved Earth horizon with turquoise coral islands and global aviation flight routes).
   - Image Opacity: `0.12`.
   - Updated `Explore.jsx` and `explore.css`.
6. **`FranchiseSection` (NO BG)**:
   - Clean solid background (`#FFFFFF`).

---

## [2026-10-05] Polish: Business System Background Visibility Boost & Frosted Editorial Header

### Overview
Addressed visibility feedback on the `#business-system` section background image. Drastically reduced heavy multi-layer white washes, increased image opacity to 82%, and placed the section header in an architectural frosted glass container (`rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(12px)`) so the luxury airport terminal, floor-to-ceiling glass, and tarmac airliner are immediately vivid and recognizable while ensuring 100% effortless text readability.

### Key Changes
1. **Background Visibility Optimization (`business-system.css`)**:
   - Boosted `.bs-bg-img` opacity from 0.28 to 0.82 with saturation and contrast enhancement.
   - Replaced heavy 94% white wash overlay with a light, transparent gradient (`rgba(248, 250, 252, 0.18)`–`0.4`) that only dissolves into solid background at the extreme section borders.
2. **Text Legibility Enhancement (`business-system.css`)**:
   - Styled `.bs-header` as a sleek frosted glass editorial box (`background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(12px)`) with a 4px purple accent border, giving the ISO 9001 title and subtitle absolute clarity and contrast.
   - Upgraded `.bs-grid` and `.bs-card` with semi-translucent frosted white surfaces (`rgba(255, 255, 255, 0.94)`) and subtle elevation shadows.

---

## [2026-10-05] Feature: Scoped Hero Text Background with Fading Opacity Gradient

### Overview
Scoped the travel airplane background image (`photo-1436491865332-7a61a109cc05`) exclusively to the Hero text column (`.hero-text-col`), removing global hero background coverage. Implemented a dual-directional fading opacity gradient mask and overlay that smoothly dissolves the image into the clean off-white canvas backdrop towards the 3D Puzzle House and towards the metric trust strip, ensuring maximum typography legibility.

### Key Changes
1. **Hero Text Column Background (`Landing.jsx`)**:
   - Added `.hero-text-bg-container` inside `.hero-text-col` with the requested Unsplash airplane wing image (`photo-1436491865332-7a61a109cc05`) and `.hero-text-bg-overlay`.
2. **Dual-Directional Fading Opacity Gradient (`landing.css`)**:
   - Applied CSS `mask-image` (and `-webkit-mask-image`) with `destination-in` composite to gently fade the image from left-to-right (towards the 3D house) and top-to-bottom.
   - Combined with multi-stop linear gradients on `.hero-text-bg-overlay` (`rgba(248, 250, 252, 0.52)` transitioning to `var(--bg, #F8FAFC)` at 100%) so the image blends cleanly into the solid background.
   - Scoped `z-index: 1` and `position: relative` to all direct text column children so the eyebrow, heading, paragraph, and buttons remain distinct, crisp, and high-contrast.

---

## [2026-10-05] Polish: Hero 45/55 Layout Split & Fluid Single-Row Button Resizing

### Overview
Adjusted the hero section grid divide to 45% (Text Column) and 55% (3D Building Blocks House) and resized the three hero action buttons (`BROWSE SERVICES`, `BUSINESS SYSTEM`, `FRANCHISE INQUIRIES`) so they fit comfortably on a single row without wrapping, overlapping, or text truncation, even when zooming in across viewports down to the 640px mobile breakpoint.

### Key Changes
1. **Hero Layout Ratio (`landing.css`)**:
   - Configured `.hero-main-container` with `grid-template-columns: 45% 55%`.
   - Updated `.hero-text-col` padding to use fluid horizontal gutters (`padding: 0 clamp(1rem, 2vw, 2.25rem) 0 clamp(1.25rem, 2.5vw, 3rem)`) to recover ~30-40px of available space for action buttons.
2. **Action Buttons Single-Row Fitting (`landing.css`)**:
   - Enforced `flex-wrap: nowrap` and `gap: clamp(0.3rem, 0.5vw, 0.55rem)` on `.hero-actions`.
   - Balanced `.btn-hero-*` font size (`clamp(0.7rem, 0.85vw, 0.95rem)`), padding (`clamp(0.65rem, 0.8vw, 0.85rem) clamp(0.35rem, 0.6vw, 0.95rem)`), and icon sizing (`clamp(0.68rem, 0.75vw, 0.85rem)`) with `letter-spacing: 0.025em`.
   - Guaranteed all 3 buttons stay on a single row through zooming in and viewport resizing down to the 640px mobile breakpoint (where it stacks cleanly for mobile devices).

---

## [2026-10-05] Polish: Hero Grid Column Divide Adjustment (40% / 60%)

### Overview
Adjusted the two-column grid division in the Hero section (`.hero-main-container`) so that the left text section occupies 40% and the right 3D Puzzle House section occupies 60% of the available width.

### Key Changes
1. **Hero Layout Ratio (`landing.css`)**:
   - Updated `.hero-main-container` from `1.12fr 0.88fr` to `grid-template-columns: 40% 60%`.

---

## [2026-10-05] Polish: Hero Headline Text Capitalization

### Overview
Capitalized the hero heading text to uppercase ("START YOUR JOURNEY AS A FRANCHISE PARTNER, BUILD YOUR TRAVEL BUSINESS WITH") while specifically preserving the signature lowercase `fairfly` brand wordmark with its original `Fredoka` font and colors.

### Key Changes
1. **Headline Content (`Landing.jsx`)**:
   - Updated headline to:
     `START YOUR JOURNEY AS A FRANCHISE PARTNER, <br />BUILD YOUR TRAVEL BUSINESS WITH <span className="hero-heading-brand"><span className="brand-fair">fair</span><span className="brand-fly">fly</span></span>`.

---

## [2026-10-05] Polish: Layout Shift Prevention on 3D Pillar Description Swapping

### Overview
Eliminated Cumulative Layout Shift (CLS) in the hero section caused by height variance when toggling or hovering between different 3D franchise pillars. Applied fixed vertical minimum heights on the callout card, header, and description blocks so that swapping between shorter and longer descriptions maintains a completely stable layout without moving the metric trust strip or subsequent sections.

### Key Changes
1. **Pillar Callout Height Stability (`puzzle-house.css`)**:
   - Set `.puzzle-piece-callout` to `min-height: 9.5rem` on desktop (and `min-height: 11.25rem` on mobile) with flex column alignment.
   - Assigned `.callout-header` a reserved `min-height: 3.25rem` to absorb single vs multi-line title wrapping.
   - Set `.callout-desc` to `min-height: 3.85rem` (and `5.25rem` on mobile) to guarantee that all 6 pillar descriptions occupy the identical reserved vertical footprint.
2. **Hero CSS Cleanup (`landing.css`)**:
   - Removed unintentional `min-height: rem;` typo from `.hero`.

---

## [2026-10-05] Polish: Hero Brand Font Restoration and 3D Canvas Badge Removal

### Overview
Restored the original signature `Fredoka` font (`--font-logo`) specifically for the "fairfly" brand text within the hero heading, preserving its distinctive character and dual-color branding (`fair` in purple and `fly` in orange) alongside the sharp condensed headline. Also cleanly removed the "Interactive 3D System Architecture" floating badge overlay from the 3D WebGL stage to keep the canvas presentation clean and unobtrusive.

### Key Changes
1. **Hero Brand Font (`Landing.jsx`, `landing.css`)**:
   - Explicitly assigned `.hero-heading-brand` to `var(--font-logo)` (`Fredoka`), preventing uppercase inheritance and restoring original letter spacing.
   - Rendered `fair` in `--purple` (`#5558E3`) and `fly` in `--orange` (`#F97316`).
2. **3D Canvas Badge (`PuzzleHouse.jsx`, `puzzle-house.css`)**:
   - Removed `<div className="canvas-interaction-badge">...</div>` overlay and its corresponding CSS rules.

---

## [2026-10-05] Feature: Complete Landing Page Revamp — Razor-Sharp Architectural Editorial Design & 3D Three.js Building Blocks House

### Overview
Executed a comprehensive architectural overhaul of the FairFly public landing page. Eliminated all rounded buttons, rounded cards, and pill badges in favor of a razor-sharp (0px border-radius) Swiss editorial grid aesthetic inspired by high-fashion/architectural typography (`Barlow Condensed` and `Syne`). Replaced the flat 2D SVG puzzle illustration with an interactive WebGL Three.js 3D building blocks house featuring realistic directional lighting, specular highlights, mouse tilt parallax, raycasting hover elevation, accessible pillar selection chips, and sharp editorial information callout cards.

### Key Changes
1. **Interactive Three.js 3D Building Blocks House (`PuzzleHouse.jsx`, `puzzle-house.css`)**:
   - Replaced flat SVG with real-time Three.js WebGL canvas stage.
   - Built 6 modular 3D geometric architectural blocks matching FairFly's turnkey pillars: Yellow Roof (ISO 9001-2000), Red Chimney (HQ Brand Power), Blue Upper Wall (100% Cloud Virtual Office), Purple Wall (2-Month Fast-Track Academy), Green Base (Zero Inventory), and Orange Plinth Base (Cash-Basis Profit).
   - Added directional lighting, ambient occlusion contact shadow, and smooth mouse tilt parallax.
   - Implemented pointer raycasting: hovered blocks smoothly elevate with emissive highlights, synchronized with real-time editorial callout cards.
   - Added accessible 6-pillar toggle chips with 0px border-radius and instant highlight capability for touch/desktop users.

2. **Sharp Editorial Hero & Global Typography (`index.html`, `index.css`, `landing.css`, `Landing.jsx`)**:
   - Preloaded `Barlow Condensed` and `Syne` in `index.html` and configured `--font-editorial` / `--font-display-sharp` in `index.css`.
   - Removed rounded pill badges (`.hero-badge`) on top of the hero text, replacing with a sharp architectural eyebrow with hairline accent bar (`STANDARDIZED TRAVEL MANAGEMENT SYSTEM · ISO 9001:2000 ARCHITECTURE`).
   - Implemented tall condensed uppercase display headline with period accent (`BUILD YOUR TRAVEL FRANCHISE NETWORK WITH FAIRFLY.`).
   - Converted all CTA action buttons (`BROWSE SERVICES`, `BUSINESS SYSTEM`, `FRANCHISE INQUIRIES`) into razor-sharp rectangular buttons with 0px border-radius, clean icons, and inverted hover contrast.
   - Replaced floating metric strip with a 4-column connected hairline grid trust strip with index codes (`[ 01 ]` to `[ 04 ]`).

3. **Complete Section Revamp Across Entire Landing Page**:
   - **Core Services Teaser Strip (`Landing.jsx`, `landing.css`)**: Converted into a sharp architectural block with crisp rectangular tags (`[ PASSPORT FILING ]`, `[ PSA CERTIFICATES ]`, etc.) and a sharp CTA.
   - **Business System (`BusinessSystem.jsx`, `business-system.css`)**: Revamped from rounded floating cards to a 4-column connected hairline grid with SOP codes (`[ SOP-01 ]` to `[ DATA-04 ]`) and a 4-cell highlights bar.
   - **Service Guidelines (`ServiceGuidelines.jsx`, `service-guidelines.css`)**: Built razor-sharp category tabs, a 3-column financial economics strip, and sequential step cards (`[ STEP 01 ]` to `[ STEP 04 ]`).
   - **Business Model (`BusinessModel.jsx`, `business-model.css`)**: Redesigned Paper-to-Plane insight banner and comparison grid into a sharp two-column layout with 0px border-radius.
   - **Training Academy (`TrainingComparison.jsx`, `training-comparison.css`)**: Built high-contrast comparison table comparing the 2-Month Academy vs Traditional unguided trial-and-error with hairline borders.
   - **Explore Gallery (`Explore.jsx`, `explore.css`)**: Converted masonry tiles to sharp 0px border-radius with uppercase condensed destination tags.
   - **Franchise Section (`FranchiseSection.jsx`, `franchise-section.css`)**: Revamped with architectural eyebrow, 4-cell stats grid, and onboarding step pipeline (`[ 01 ]` to `[ 05 ]`).
   - **Footer Card (`FooterCard.jsx`, `footer-card.css`)**: Converted to sharp editorial banner with dual action buttons.
   - **Navbar (`navbar.css`)**: Aligned navigation links, login button, and franchise CTA button with 0px border-radius and uppercase tracking.

4. **Component Catalog & Documentation (`component-list.md`)**:
   - Documented the new `PuzzleHouse` Three.js 3D component with props, interactive behaviors, and design system integration.
   - Verified clean frontend production compilation with Vite (`npm run build`: 0 errors).

---

## [2026-10-05] Feature: Operator-Assisted Quotations, Service Requirements Collection, and Walk-in Direct Cash & PayMongo Payments

### Overview
Implemented complete end-to-end support for operator-assisted quotations, walk-in cash payments, PayMongo QR online checkout on the operator side, and dynamic service requirements collection for both walk-in and online clients. All mutations follow the zero-trust architecture ("Never Trust the Client"), with authoritative server-side validation, rate limiting, branch authorization guards, IDOR/BOLA protection, and atomic payment fulfillment.

### Key Changes
1. **Operator-Side Direct Cash Payment & PayMongo QR Checkout**:
   - Backend `POST /api/payments/cash`: Validates quotation ownership (`branchUid`), checks quotation `Accepted` status, derives payment amount authoritatively from the database, enforces idempotency against existing paid records, creates payment document in `payments` (`provider: 'cash'`, `paymentMethodType: 'Cash'`, `receivedByOperatorId`, `receivedByOperatorName`), and atomically triggers `finalizeSuccessfulPayment` to activate service fulfillment.
   - Backend `POST /api/payments/checkout-session`: Expanded RBAC to allow operators to initiate PayMongo QR checkout for accepted quotations, setting dynamic success/cancel redirect URLs back to `/operator/quotations/:id`.
   - Backend `POST /api/payments/:id/verify`: Added branch operator authorization checks to allow operators to verify PayMongo QR checkout sessions.
   - Frontend `AcceptOnBehalfModal.jsx`: Created dedicated operator acceptance modal replacing native `window.confirm`. Displays quotation contract summary, client details, authorization disclaimer, client verification checkbox, and next-step workflow selection (immediate payment processing vs save acceptance).
   - Frontend `OperatorPaymentModal.jsx`: Created dual-payment modal with explicit Cash confirmation (audit disclaimer, receipt confirmation checkbox, remarks) and PayMongo QR generation (dynamic QR link, auto-refresh polling, live status indicator).
   - Frontend `QuotationDetailPage.jsx`: Integrated `AcceptOnBehalfModal` and `OperatorPaymentModal`, auto-opened upon quotation acceptance on behalf of client, added "Process Payment (Cash / PayMongo)" action button, added automatic URL redirect verification (`?payment_status=success`), and rendered a "Payment & Fulfillment Settlement" card upon successful payment.
   - Frontend `OperatorQuotations.jsx`: Added direct "Accept on Behalf" action trigger and `AcceptOnBehalfModal` integration on the operator quotations list.

2. **Operator-Assisted Requirements for Walk-in Clients**:
   - Backend `quotationController.js`: Supported `submittedRequirements` in `createQuotation`, enforcing server-side validation that all mandatory requirements (`required !== false`) have uploaded files or text values. Atomically creates `submitted_requirements` and links `submittedRequirementsId` on both the quotation and linked inquiry.
   - Frontend `CreateQuotationModal.jsx`: Integrated dynamic requirement schema verification. Added high-visibility **Client Intake & Requirements Workflow** radio card selector (`Walk-in Client (Assist On-Site)` vs `Online Registered Client`). In walk-in mode, operators can directly upload files (`uploadFileToBackend`) and enter required information on-site before issuing the quotation. In online mode, dynamic badges and helper banners indicate requirement status with direct options to assist walk-in clients.
   - Frontend `OperatorPaymentModal.jsx`: Added explicit, high-visibility **Payment Method Radio Cards** (`Direct Cash Payment (Walk-in Clients)` vs `PayMongo Online Payment (Dynamic QR Ph Code)`) with styled circular radio selectors, clear subtitles, and full accessibility support.

3. **Online Client Inquiry Workflow for Attached Services**:
   - Backend `POST /api/inquiries/:id/attach-service`: Allows branch operators to attach a catalog service to an inquiry. For online clients, transitions inquiry to `pending_requirements`, copies requirement schema, and creates a high-priority notification for the client. For walk-in clients (`isWalkIn: true`), attaches service and keeps inquiry ready for operator on-site completion.
   - Backend `POST /api/inquiries/:id/submit-requirements`: Allows authenticated clients to submit required documents for inquiries in `pending_requirements`. Validates mandatory fields, creates document in `submitted_requirements`, transitions inquiry back to `submitted`, and notifies the branch operator.
   - Frontend `InquiryFormDetailPage.jsx`: Added prominent "Attach Catalog Service" / "Re-configure Service / Workflow" action modal with high-visibility radio selection ("Online Client (Await Requirements)" vs "Walk-in Client (Assist On-Site)"), styled radio circles, and active banner action buttons to ensure the modal and radio options are accessible regardless of existing service attachment status.
   - Frontend `ClientSubmitRequirementsModal.jsx`: Created client modal to complete and upload pending service requirements with drag-and-drop file uploaders, validation indicators, and upload feedback.
   - Frontend `ClientTrackingPage.jsx` & `InquiryDetailModal.jsx`: Displayed `status-pending_requirements` badges and "Submit Requirements" action buttons to give clients direct access to upload required documents.

---

## [2026-10-04] Fix: Disassociated Client's Service Intake Specifications from Agency Document Requirements

### Overview
Addressed architectural misconception where "Specified Requirements of Client" (captured in Section 2 of Form `SAF-01-002`) was mistakenly added as a pseudo document requirement in the `submitted_requirements` collection. Clarified that "Specified Requirements of the Client" represents what the client needs/wants from the agency's service, not an agency-required document. Ensured that client inquiry submissions never instantiate document requirement records for client specifications, separated client request specifications from document attachments in all inquiry detail views, and updated the quotation creator (`CreateQuotationModal.jsx`) and quotation PDF exporter (`PdfDocumentView.jsx`) to prevent client request text from leaking into the agency's document requirements column.

### Key Changes
1. **Backend Inquiry Controller (`inquiryController.js`)**:
   - `createInquiry`: Removed the fallback that added `[{ name: 'Specified Requirements of Client', value: resolvedSpecReqs }]` to `rawReqsArray`. Ensured `createSubmittedRequirementsRecord` is only called when actual document files or checklist items are provided.
   - Filtered out any pseudo-requirement names (`Specified Requirements of Client`, `Client Specified Requirements`) from `rawReqsArray` and `confirmInquiry`.
   - Stored the client's service request specifications strictly as a string in `specifiedRequirements`.
   - `confirmInquiry`: Formatted quotation requirements using actual service requirements or standard document defaults, avoiding leaking client specifications into the quotation document checklist.

2. **Backend Quotation Controller (`quotationController.js`)**:
   - `createQuotation`: Filtered pseudo-requirements from `effectiveSubmittedReqs` to guarantee quotations never inherit or create document requirement records for client specifications.

3. **Frontend Inquiry & Quotation Modals (`InquiryDetailModal.jsx`, `InquiryFormDetailPage.jsx`, `AdminInquiryDetailPage.jsx`, `QuotationDetailModal.jsx`)**:
   - `InquiryDetailModal.jsx`: Rendered `inquiry.specifiedRequirements` as a dedicated text block for client service specifications, and rendered actual uploaded files in a separate "Attached Documents & Files" section.
   - `InquiryFormDetailPage.jsx` & `AdminInquiryDetailPage.jsx`: Filtered pseudo-requirements out of `requirementsList` so that "Specified Requirements of Client" never renders under "Document Attachments".
   - `QuotationDetailModal.jsx`: Filtered pseudo-requirements out of `displayRequirements`.

4. **Operator Quotation Builder & PDF Exporter (`CreateQuotationModal.jsx`, `PdfDocumentView.jsx`)**:
   - `CreateQuotationModal.jsx`: Removed `inquiry.specifiedRequirements` as the prefill for quotation document requirements. Relabeled the field to `Document Requirements (Needed by Agency from Client) *` and added a prominent callout displaying the client's intake specifications for operator reference.
   - `PdfDocumentView.jsx`: Removed the fallback in `normalizeQuotationPdfData` that placed `specifiedRequirements` into the quotation requirements column.

5. **Database Maintenance & Automated Verification (`cleanPseudoRequirements.js`, `testSubmittedRequirements.js`)**:
   - Executed `cleanPseudoRequirements.js` live: Purged 11 orphaned/empty pseudo-requirement documents from `submitted_requirements` and unlinked them from parent inquiries.
   - Verified with `testSubmittedRequirements.js`: **13/13 Passed, 0 Failed**.
   - Validated production frontend compilation: `npm run build` in `fair-fly` completed cleanly with **0 errors**.

---

## [2026-10-04] Services Page: Comprehensive Category & Multi-Field Search Filtering Fix

### Overview
Overhauled the service filtering logic on the Services Catalog ([`Services.jsx`](file:///c:/Users/Ier%20Reyes/Fairfly/fair-fly/src/components/Shared/Services/Services.jsx)) to guarantee reliable matching across database categories (such as `"Visa & Embassy Assistance"`, `"Passport Processing"`, `"PSA & Civil Documents"`, `"Airline Ticketing"`, `"Tour Packages"`, and custom database categories), with real-time count badges and multi-field search across titles, descriptions, tags, requirements, and categories.

### Key Changes
1. **Dynamic Category Configuration & Matching (`Services.jsx`)**:
   - Built `isServiceMatchingCategory(service, tab)` with keyword synonym matching (e.g. matching `"Visa & Embassy Assistance"` to the Visa tab, `"Flight Ticketing"` to the Flights tab).
   - Created dynamic `categoryTabs` computation that automatically tallies accurate service counts and discovers custom categories created in Firestore.
   - Filtered out empty categories (`count === 0`) dynamically while preserving `'All Services'`.
2. **Enhanced Search Matching**:
   - Expanded search filtering to check `name`, `category`, `description`, `tags`, and `requirements` text simultaneously.

---

## [2026-10-04] Services Page: Removed Redundant Top Hero Header Banner

### Overview
Streamlined the dedicated Services Catalog route (`/services`) by removing the redundant top hero banner (`.services-hero-header`) so that visitors immediately view the core interactive Services catalog and category filter toolbar.

### Key Changes
1. **Services Page Layout (`ServicesPage.jsx`, `services-page.css`)**:
   - Removed the top `.services-hero-header` section (breadcrumb, duplicate headline, and trust pills).
   - Retained the clean, interactive `<Services />` catalog header and `<FooterCard />`.

---

## [2026-10-04] UI / Typography: Fredoka Bold Display Heading Style Applied Across Landing Page

### Overview
Applied the rounded, extra-bold display typography style (`Fredoka` 800 weight, tight geometric tracking) matching the official FairFly brand identity across major landing page titles and section headers.

### Key Changes
1. **Typography Design Tokens (`index.css`)**:
   - Added `--font-display: 'Fredoka', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;` token for display headlines.
2. **Applied Display Font to Major Headings**:
   - **Hero Section (`landing.css`)**: Updated `.hero-heading` with `font-family: var(--font-display)` and `font-weight: 800`.
   - **Services Teaser (`landing.css`)**: Updated `.teaser-title` with `font-family: var(--font-display)`.
   - **Franchise Section (`franchise-section.css`)**: Updated `.fr-title` with `font-family: var(--font-display)`.
   - **Services Catalog (`services.css`)**: Updated `.landing-services-title` with `font-family: var(--font-display)`.
   - **Footer Card (`footer-card.css`)**: Updated `.footer-title` with `font-family: var(--font-display)`.
   - **Landing System Modules (`business-system.css`, `service-guidelines.css`, `business-model.css`, `training-comparison.css`)**: Updated `.bs-title`, `.sg-title`, `.bm-title`, `.tc-title` with `font-family: var(--font-display)`.

---

## [2026-10-04] Landing Page: 3D Puzzle House Hero Section Integration & Visual Scale Enhancement

### Overview
Integrated the 3D glossy vector Puzzle House illustration directly into the Landing Page Hero section ([`Landing.jsx`](file:///c:/Users/Ier%20Reyes/Fairfly/fair-fly/src/pages/Index/Landing/Landing.jsx)), paired alongside the hero text and action buttons without modifying any existing wording or content. Enhanced the scale and proportions of the puzzle house visual for increased prominence across desktop and responsive viewports.

### Key Changes
1. **Visual Scale & Layout Proportions (`puzzle-house.css`, `landing.css`)**:
   - Increased max container width to `560px` and max height to `480px` for a bolder visual presence.
   - Optimized grid column ratios (`1.05fr : 0.95fr`) in `.hero-main-container` with responsive scaling for tablet (`480px` max-width) and mobile screens.
2. **Hero Section Integration (`Landing.jsx`, `landing.css`)**:
   - Added `<PuzzleHouse />` into `.hero-main-container` next to the untouched heading, subtitle, and action buttons.
3. **Interactive 3D Puzzle House Asset (`PuzzleHouse.jsx`, `puzzle-house.css`)**:
   - High-fidelity 3D glossy puzzle house with interlocking jigsaw pieces, subtle floating animation, soft floor shadow, and ground mirror reflection.

---

## [2026-10-04] UI / UX: Mobile & Tablet Responsiveness Overhaul, Dedicated Services Page Separation & Logo Brand Typography Alignment

### Overview
Executed a comprehensive mobile and tablet responsiveness optimization across all landing sections, public pages, and navigation systems. Separated the Available Travel & Document Services catalog into its own dedicated public route (`/services`), updated the landing page Hero call-to-actions and Navbar routing accordingly, and styled the brand name "fairfly" in the hero heading to exactly match the official logo's dual-tone color palette (`fair` in royal blue/purple, `fly` in vibrant orange) and rounded geometric font typography (`Fredoka`).

### Key Changes
1. **Brand Typography & Color Alignment (`Landing.jsx`, `landing.css`, `index.html`, `index.css`)**:
   - Imported Google Font `Fredoka` (weights 600, 700, 800, 900) and established `--font-logo` token in `src/index.css`.
   - Updated Hero heading "Across the Philippines with Fairfly" to render dual-tone logo typography: `<span className="hero-heading-brand"><span className="brand-fair">fair</span><span className="brand-fly">fly</span></span>`.
   - Styled `.brand-fair` in official brand blue/purple (`#4F6BF5`) and `.brand-fly` in official brand orange (`#FF8738`) with bold rounded letterforms matching `/FairflyLogo.png`.

2. **Dedicated Services Page Separation (`ServicesPage.jsx`, `services-page.css`, `App.jsx`, `Navbar.jsx`)**:
   - Created dedicated public page `fair-fly/src/pages/Index/ServicesPage/ServicesPage.jsx` and registered route `/services` in `App.jsx`.
   - Designed a full hero banner with breadcrumb navigation, ISO 9001:2000 & operator trust badges, full search & category filtering, interactive cards grid, service detail modal, and footer CTA.
   - Updated Public `Navbar.jsx`: "Services" link now routes directly to `/services` as an active `NavLink` across both desktop and mobile slide drawer.
   - Updated Landing Page: "Browse Services" button links to `/services` via React Router `Link`, and replaced inline services with a sleek Services Teaser banner directing visitors to the dedicated catalog.

3. **System-Wide Mobile & Tablet Responsiveness**:
   - **Hero Section (`landing.css`)**: Implemented responsive typography clamping, full-width stacked action buttons on mobile screens (< 48rem / 768px), and responsive 2x2 / 1-column grid layout for the Trust Strip.
   - **Public Navbar (`navbar.css`)**: Refined mobile drawer slide animation, optimized logo scaling on small devices (`height: 2.25rem`), and enhanced touchable tap targets.
   - **Services Catalog & Detail Modal (`services.css`, `service-detail-modal.css`)**: Set 3 columns for desktop (> 1024px), 2 columns for tablets (641px - 1024px), and 1 column for mobile (<= 640px). Enabled smooth horizontal touch momentum scrolling on category chips without scrollbar clutter.
   - **About Page (`about.css`)**: Adjusted `.branchCard` and `.headOfficeCard` grid layouts for tablet (601px - 960px) and mobile (<= 640px) viewports with comfortable padding.
   - **Explore Destination Grid (`explore.css`)**: Fixed mobile grid rows definition for all 7 destination cards with consistent card heights.

4. **Verification**:
   - Production bundle build (`npm run build` in `fair-fly`) completed cleanly in 7.83s with 0 errors.

---

## [2026-10-02] Feature & Security: Backend Chatbot Grounding on Firestore Services & Branches Directory

### Overview
Architected and deployed a cost-effective, secure backend AI Chatbot proxy (`POST /api/chatbot/message`) on Express (`fly-api`). Grounded the AI model directly on real-time active services and branch directories stored in Firestore, while keeping the Google Gemini API key protected on the server side and completely eliminating frontend credential exposure.

### Key Architecture & Cost-Optimization
- **Server-Side In-Memory Caching (`staticDataCache`)**:
  - Cached active branches (`branches-list`) and active services (`services-list`) for 300 seconds (5 minutes) in Node.js memory.
  - Reduced Firestore database reads from thousands per day to a tiny fraction of the free tier (<1,000 reads/day under continuous traffic).
  - Automatically invalidates branch and service cache keys upon CUD mutations.
- **Grounding Persona Builder (`botPersona.js`)**:
  - Automatically formats the live **Official Fairfly Branch Directory** (branch name, physical address, contact phone, branch email, qualified certification).
  - Automatically formats the live **Fairfly Service Catalog** (service name, category, price in ₱, processing time, required documents, nationwide vs branch-exclusive availability).
  - Instructs the AI assistant to refer visitors to their nearest branch for consultations, appointments, and applications.
- **Zero-Dependency Native REST Invocation**:
  - Utilized Node 22 native `fetch` directly to Google Generative Language API without adding third-party npm package overhead.
  - Configured primary model `gemini-3.5-flash-lite` with automatic fallback to `gemini-3.5-flash`.
- **Backend Route & Payload Defense (`chatbotRoutes.js`, `chatbotController.js`)**:
  - Rate-limited via `apiRateLimiter` to protect against brute-force flooding.
  - Whitelisted input payload with `allowedFields(['message', 'history'])` and enforced strict string length limits.
- **Frontend Refactoring (`Chatbot.jsx`, `chatbotService.js`)**:
  - Replaced frontend `@google/generative-ai` calls with clean, lightweight `sendChatbotMessage` API calls.
  - Removed client-side `VITE_GEMINI_API_KEY` dependency.

## [2026-10-02] Cleanup: Complete Frontend Console Logging Removal & Vite 8 Production Strip Configuration

### Overview
Cleaned up all verbose development console logging across the frontend codebase (`fair-fly`) per user request. Configured Vite 8 build toolchain (`oxc: { drop: ['console', 'debugger'] }`) to guarantee that any remaining or third-party diagnostic log and debug calls are automatically stripped during production bundle compilation.

### Changes
- **`fair-fly/src/utils/ApiCaller.js`**:
  - Removed debug log outputting `loading state set to false after API call to <url>` that fired repeatedly across all dashboard and data-fetching network requests.
- **`fair-fly/src/context/AuthContext.jsx`**:
  - Removed authentication state logs (`User changed`, `No user is present`, `User token refreshed:`, `User document exists!`, `User details set to state:`, `User document does not exist!`).
  - Removed diagnostic `useEffect` printing `userDetails` objects to the browser console.
- **`fair-fly/vite.config.js`**:
  - Added `oxc: { drop: ['console', 'debugger'] }` compiler configuration for Vite 8 / Rolldown to automatically strip console statements from production distributions.
- **Verification & Deployment**:
  - Ran ripgrep verification confirming 0 remaining `console.log` statements across `fair-fly/src`.
  - Built production bundle (`npm run build`) cleanly in 2.88s with 0 errors.
  - Deployed cleanly to Firebase Hosting (`https://fairfly-1e83b.web.app`).

## [2026-10-02] Fix: AI Chatbot 404 Model Not Found Error (`gemini-3.5-flash-lite`)

### Overview
Resolved a `404 Not Found` failure when sending messages to the AI Chatbot on deployment. Upgraded the underlying Google Gemini model from the deprecated `gemini-2.5-flash-lite` to the officially supported `gemini-3.5-flash-lite` with automatic fallback to `gemini-3.5-flash`.

### Root Cause
In `fair-fly/src/components/Shared/Chatbot/Chatbot.jsx`, the generative model name was hardcoded to:
`model: "gemini-2.5-flash-lite"`
Google's Gemini API rejected this endpoint with HTTP `404 Not Found`:
`[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent: [404] This model models/gemini-2.5-flash-lite is no longer available to new users. Please update your code to use models/gemini-3.5-flash-lite for the latest features and improvements.`

### Changes
- **`fair-fly/src/components/Shared/Chatbot/Chatbot.jsx`**:
  - Updated primary model to use `import.meta.env.VITE_GEMINI_MODEL || "gemini-3.5-flash-lite"`.
  - Added graceful fallback handling: if the primary model throws or encounters network/availability issues, it automatically falls back to `gemini-3.5-flash` so users always receive assistance.
  - Added API key validation guard to prevent silent network exceptions if `VITE_GEMINI_API_KEY` is missing.
  - Tested conversation flow directly against Google's Generative Language API; confirmed high-quality conversational responses.
  - Built and deployed live to Firebase Hosting.

## [2026-10-02] Security & Auth: Multi-Tier Defense for Disabled & Deactivated Accounts

### Overview
Architected and deployed a 4-tier defense-in-depth system preventing disabled, deactivated, pending, or suspended accounts (across operators, clients, and administrators) from logging into the platform or executing backend API actions, while also evicting active sessions in real time.

### Root Cause
1. **Frontend Status Mismatch**: `Login.jsx` only verified `userData.status === 'Deactivated'`. When operators or clients were disabled by administrators, their status was stored as `'Disabled'`, which bypassed the check and permitted successful sign-in.
2. **Missing Firebase Auth State Sync**: When administrators updated an account status to `Disabled` or `Inactive` in `operatorController` or `clientController`, the backend only modified the Firestore record. It never set `disabled: true` in Firebase Authentication or called `revokeRefreshTokens(uid)`.
3. **No Active Session Eviction**: `AuthContext.jsx` listened to user document snapshots via `onSnapshot`, but only signed out if the document was completely deleted, allowing users to remain logged in if their account was disabled during an active session.
4. **Permissive API Middleware**: The `verifyFirebaseToken` middleware validated cryptographic JWT signatures and checked role permissions, but did not enforce status checks against disabled records.

### Key Changes
1. **Tier 1 — Pre-Login Account Status Validation Endpoint (`POST /api/auth/login-check`)**:
   - Added rate-limited public endpoint in `fly-api/src/routes/authRoutes.js` and `fly-api/src/controllers/authController.js`.
   - Validates whether an account is `Disabled`, `Deactivated`, `Suspended`, `Pending`, or `Rejected`. Returns `403 Forbidden` with informative, user-friendly messages prior to credential submission.
   - Includes anti-enumeration protection (returns `allowed: true` for non-existent accounts so standard Firebase Auth error handling applies).
   - Integrated into `fair-fly/src/pages/Index/Login/login.jsx` as Step 1 of the login pipeline.
2. **Tier 2 — Native Firebase Auth Synchronization & Token Revocation**:
   - In `operatorController.js` (`updateOperator`, `bulkStatusOperators`): Synchronizes `admin.auth().updateUser(id, { disabled: isDisabling })` and calls `admin.auth().revokeRefreshTokens(id)` when setting status to `Disabled` or `Inactive`. Re-enables when set to `Active`.
   - In `clientController.js` (`updateClient`, `approveClient`, `rejectClient`, `bulkStatusClients`): Automatically disables Firebase Auth user records and revokes refresh tokens on deactivation/rejection, and re-enables on approval/activation.
   - In `adminController.js` (`updateAdmin`): Enforces Firebase Auth disabled synchronization for Support Administrators.
3. **Tier 3 — Real-Time Active Session Eviction (`AuthContext.jsx`)**:
   - In `fair-fly/src/context/AuthContext.jsx`, the Firestore real-time `onSnapshot` listener detects when `status` transitions to `Disabled`, `Deactivated`, `Suspended`, or `Inactive`.
   - Immediately executes `signOut(auth)`, resets state context, and alerts the user via toast notification.
4. **Tier 4 — Backend API Gatekeeper (`verifyFirebaseToken` Middleware)**:
   - In `fly-api/src/middleware/auth.js`, intercepts all authenticated API requests. If the resolved `userDetails` has a disabled or deactivated status, rejects the request immediately with HTTP `403 Forbidden`.
5. **Role-Based Post-Login Navigation**:
   - Updated `Login.jsx` to dynamically navigate users to their respective portals (`/admin`, `/operator`, `/client`) upon successful sign-in instead of hardcoded `/client`.

### Verification
- Executed automated test suite `fly-api/src/scripts/testDisabledAccountFlow.js`:
  - Verified Tier 1 pre-login check allows active users (200) and blocks disabled users (403).
  - Verified anti-enumeration for non-existent users (200).
  - Verified Tier 2 Firebase Auth `disabled: true` synchronization on operator status change.
  - Verified Tier 4 `verifyFirebaseToken` gatekeeper returns 403 on disabled user API calls.
  - Verified re-enabling an operator sets `disabled: false` and allows login again.
  - Test suite result: **10 Passed, 0 Failed**.
- Deployed backend Cloud Functions `api(asia-southeast1)` successfully.
- Built and deployed frontend to Firebase Hosting (`https://fairfly-1e83b.web.app`).

## [2026-10-02] Fix: Character Encoding Mojibake in Franchise Application Form

### Overview
Fixed character encoding corruption (mojibake) in the Franchise Application Form (`FranchiseApplicationForm.jsx`) where double-encoded UTF-8 characters caused the Philippine Peso currency symbol (`₱`), hyphens/dashes (`-`), and quotes to display as corrupted strings like `â,±50,000`, `â€“`, and `0â€“2 years experience`.

### Root Cause
`FranchiseApplicationForm.jsx` had been saved with mojibake characters in string literals for `INVESTMENT_CAPACITY_OPTIONS`, `BUSINESS_EXPERIENCE_OPTIONS`, `MEETING_TIME_OPTIONS`, and informational description text. For instance, the UTF-8 bytes for `₱` (`0xE2 0x82 0xB1`) and en-dash `–` (`0xE2 0x80 0x93`) were interpreted through Windows-1252 / ISO-8859-1 as `â‚±` and `â€“`.

### Changes
- **`fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`**:
  - Restored clean Philippine Peso symbol (`₱`) in `INVESTMENT_CAPACITY_OPTIONS`: `Less than ₱50,000`, `₱50,000 - ₱100,000`, `₱100,000 - ₱200,000`, `₱200,000 - ₱500,000`, and `₱500,000+`.
  - Replaced corrupted dashes in `BUSINESS_EXPERIENCE_OPTIONS` with clean hyphens (`0-2 years experience`, `3-5 years experience`).
  - Restored meeting time labels (`Morning (9:00 AM - 12:00 PM)`, `Afternoon (1:00 PM - 5:00 PM)`).
  - Fixed modal description text: `you within 2-3 business days.`
  - Cleaned up corrupted em-dashes in code comments.
  - Verified 0 remaining `â` mojibake occurrences across the entire codebase.
  - Successfully built and deployed to Firebase Hosting.

## [2026-10-02] Enhancement: Landing Page Services Preview (Removed Placeholder Images & Fixed Visa Tag Filtering)

### Overview
1. **Uniform Cover Image Banner with Brand Logo Fallback**: Retained the full Cover Image UI and banner container (`service-card-media`) on every card to ensure uniform card dimensions when services with uploaded images and services without images are displayed together. Replaced external/broken placeholder images with the official `/FairflyLogo.png` brand logo on a clean, modern radial backdrop.
2. **Fixed Visa Assistance Tag Filtering**: Resolved an issue where the "Visa Assistance" category tab failed to display visa services (e.g., Canada, South Korea, Australia Visa applications) stored in Firestore under `"Visa & Embassy Assistance"` or tagged with `"Visa"`.

### Root Cause
- **Placeholder Images**: `Services.jsx` defaulted missing image paths to `/services/passport.jpg`, which failed to load and fell back to Unsplash stock photography.
- **Visa Tag Filtering**: The category filter used strict substring matching (`service.category.toLowerCase().includes('visa assistance')`). Services created via the Admin portal use the standard category `"Visa & Embassy Assistance"`, which did not contain the substring `"visa assistance"`. Additionally, tags (such as `tags: ['Visa']`) were not evaluated during category tab filtering or tab badge count calculations.

### Changes
- **`fair-fly/src/components/Shared/Services/Services.jsx`**:
  - Maintained the uniform `service-card-media` cover image banner on every card. When no cover image has been uploaded by the admin/operator, it displays `/FairflyLogo.png` centered on a sleek brand backdrop.
  - Implemented `matchesCategoryTab` to evaluate both category variations (e.g. `"Visa & Embassy Assistance"`, `"Visa Assistance"`) and tag arrays (e.g. `tags.includes('Visa')`).
  - Implemented `getCategoryVisuals` providing dedicated icons and gradients based on service category.
  - Added service tags `#tag` rendering with click-to-filter support.
  - Synchronized category tab badge counts with `matchesCategoryTab`.
- **`fair-fly/src/components/Shared/Services/services.css`**:
  - Added styles for `.service-card-media.service-card-media-logo`, `.service-card-logo-backdrop`, `.service-card-brand-logo`, and `.service-tag-pill`.
- **`fair-fly/src/components/Shared/Services/ServiceDetailModal.jsx` & `service-detail-modal.css`**:
  - Maintained the hero media banner in the modal, displaying `/FairflyLogo.png` on a subtle brand backdrop when no custom cover image is uploaded.


## [2026-10-02] Fix: Client Appointment Booking 500 Internal Server Error (Undeclared 'now')

### Overview
Resolved a critical backend bug where booking branch appointments via the Client Portal (or Operator interface) returned HTTP `500 (Internal Server Error)`.

### Root Cause
In `fly-api/src/controllers/appointmentController.js`, `createAppointment` referenced `createdAt: now` and `updatedAt: now` on the appointment model without `const now` being declared in scope. This caused a runtime `ReferenceError: now is not defined`, resulting in a 500 error response.

### Changes
- **`fly-api/src/controllers/appointmentController.js`**:
  - Declared `const now = new Date().toISOString();` prior to `newAppointment` construction in `createAppointment`.
  - Audited all controllers across `fly-api/src/controllers/` to verify no other undeclared timestamp identifiers exist.
- **`lessons-learned.md`**:
  - Logged root cause and prevention strategy regarding scoped timestamp variable declarations.


## [2026-10-02] Enhancement: Quotation Fulfillment Status Synchronization & View State

### Overview
Updated the Quotation Detail view and backend synchronization so that when a service fulfillment is completed (`status === 'Completed'`), the quotation view updates dynamically:
1. Replaces the `PAID` status badge with **`FULFILLED`**.
2. Replaces the `Quotation Paid · Service Fulfillment Active` banner with **`Fulfilled`**.
3. Omits the "View Ongoing Service" button and action buttons from the banner once fulfilled.

### Root Cause & Implementation Details
- Previously, when an active service finished its workflow steps (`allCompleted`), `activeServiceController.js` only updated the active service document and did not synchronize the linked quotation document's status.
- In `QuotationDetailPage.jsx`, the banner and status label only checked `quotation.status === 'PAID'` and did not reactively observe the linked active service completion or display a dedicated `Fulfilled` state.

### Changes
- **`fly-api/src/controllers/activeServiceController.js`**:
  - In `updateStepStatus`, when `allCompleted` is true and `serviceRecord.quotationId` exists, automatically updates `quotations/${serviceRecord.quotationId}` with `{ status: 'Fulfilled', serviceStatus: 'Completed', fulfillmentStatus: 'Fulfilled', fulfilledAt: now, updatedAt: now }`.
- **`fair-fly/src/pages/Operator/OperatorQuotations/QuotationDetailPage.jsx`**:
  - Added real-time Firestore listener for the linked `activeServices` record (using `quotation.activeServiceId` or fallback query `where('quotationId', '==', quotation.id)`).
  - Derived `isFulfilled` state (`status === 'Fulfilled'`, `fulfillmentStatus === 'Fulfilled'`, or `activeService.status === 'Completed'`).
  - Updated `getStatusLabel()` to display `FULFILLED` and `getStatusType()` to return `success`.
  - Updated the banner header to display `Fulfilled` and omitted the action button group (`View Ongoing Service` / `Originating Inquiry`) when fulfilled.
- **`fair-fly/src/pages/Operator/OperatorQuotations/quotation-detail.css`**:
  - Added `.quote-accepted-banner.fulfilled-banner` styles with emerald theme accents and clear typography.
- **`fair-fly/src/pages/Operator/OperatorQuotations/OperatorQuotations.jsx`**:
  - Mapped `'fulfilled'` status to `'status-pill-completed'` in `getQuotationStatusClass`.
- **`fair-fly/src/components/Client/QuotationDetailModal/QuotationDetailModal.jsx`**:
  - Added support for `isFulfilled` state, showing `FULFILLED` badge and `Fulfilled · Service Completed` notice in the client quotation modal.


## [2026-10-02] Fix: Ticket Creation 400 Bad Request (operatorId, operatorName, operatorEmail) & Admin Tickets Page Margin Gap

### Overview
1. **Ticket Creation Input Whitelist**: Resolved an issue where creating a support ticket via `CreateTicketModal.jsx` in the Admin Portal failed with HTTP `400 Bad Request: Invalid fields in request body (operatorId, operatorName, operatorEmail)`.
2. **Admin Tickets Page Layout**: Resolved a layout defect on the Tickets page (`/admin/tickets`) where the KPI cards section and the Table section had zero margin/gap space between them.

### Root Cause
1. **Allowed Fields Mismatch**: In `fly-api/src/routes/ticketRoutes.js`, `TICKET_ALLOWED_FIELDS` was defined as `['title', 'category', 'priority', 'initialMessage']`. However, `CreateTicketModal.jsx` sends `operatorId`, `operatorName`, and `operatorEmail` when an admin creates a ticket on behalf of a branch or when an operator context is provided. The zero-trust `allowedFields` middleware rejected these required fields.
2. **Broken Page Margin**: In `TicketsContent.jsx`, the KPI cards (`kpi-grid-4`) and the Table card (`tickets-table-card`) were nested inside an obsolete wrapper (`<div className="tickets-layout-single"><section className="tickets-left-pane">`). Neither wrapper element was styled with flex gap or bottom margins, isolating the inner sections from `.tickets-page { gap: 1.25rem; }` and causing the table card to render directly flush beneath the KPI cards.

### Changes
- **`fly-api/src/routes/ticketRoutes.js`**:
  - Expanded `TICKET_ALLOWED_FIELDS` to include `'operatorId'`, `'operatorName'`, and `'operatorEmail'`.
- **`fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx`**:
  - Removed obsolete wrapper tags (`tickets-layout-single` and `tickets-left-pane`).
  - Promoted `<section className="services-summary-grid kpi-grid-4">` and `<section className="card tickets-table-card">` to direct children of `<main className="tickets-page page-fade-in">`, standardizing the layout with the other admin pages.
- **`fair-fly/src/pages/Admin/AdminTickets/admin-tickets.css`**:
  - Defined explicit flex column and `1.25rem` gap rules for `.tickets-layout-single, .tickets-left-pane`, and ensured `.tickets-page .services-summary-grid` uses clean `margin-bottom: 0`.
- **Build & Deploy**:
  - Rebuilt production frontend bundle using Vite (`npm run build`).
  - Redeployed Cloud Functions (`api`) and Hosting via Firebase CLI.

## [2026-10-02] Fix: Workflow Template Creation & Update 400 Bad Request (Invalid fields: type, serviceType)

### Overview
Resolved an issue where creating or editing workflow templates in the Admin Portal (`/admin/workflows`) or attaching a new workflow template from service modals failed with HTTP `400 Bad Request: Invalid fields in request body (type, serviceType)`.

### Root Cause
`WORKFLOW_TEMPLATE_FIELDS` in `fly-api/src/routes/workflowRoutes.js` guarded route payloads (`POST /workflow/templates`, `PATCH /workflow/templates/:id`, `POST /workflows`, `PATCH /workflows/:id`, `PUT /workflows/:id`) with:
`['title', 'name', 'description', 'steps', 'status', 'category']`.
However, `WorkflowForm.jsx` submits `type` and `serviceType` to categorize the workflow process (e.g. PSA, Passport, Visa). The zero-trust `allowedFields` middleware rejected both fields, blocking template creation and updates.

### Changes
- **`fly-api/src/routes/workflowRoutes.js`**:
  - Expanded `WORKFLOW_TEMPLATE_FIELDS` to include `'type'`, `'serviceType'`, and `'version'`.
- **`fly-api/src/controllers/workflowController.js`**:
  - In `createTemplate`, normalized and synchronized `type` and `serviceType` from `(templateData.serviceType || templateData.type || 'General').trim()`.
  - In `updateTemplate`, synchronized `type` and `serviceType` if either or both are updated.
- **Client & Build**:
  - Rebuilt frontend with `npm run build`.
  - Redeployed Cloud Functions (`api`) and Hosting via Firebase CLI.

## [2026-10-02] Fix: Administrator Account Creation 400 Bad Request (Invalid Fields)

### Overview
Resolved an issue where attempting to create a new Administrator via the Admin Portal (`/admin/administrators`) resulted in a `400 Bad Request` ("Invalid fields") error.

### Root Cause
Zero-trust input whitelisting middleware `allowedFields` in `fly-api/src/routes/adminRoutes.js` was configured with `['email', 'password', 'username', 'fullName', 'phone', 'assignedOperators']`. However, the frontend form `AdminForm.jsx` sends `name` (for display name consistency) and `status` (`'Active' | 'Inactive'`). The server-side request validator strictly rejected these unexpected properties, blocking administrator creation.

### Changes
- **`fly-api/src/routes/adminRoutes.js`**:
  - Added `'name'` and `'status'` to `allowedFields` for `POST /admins` and `PATCH /admins/:id`.
- **`fly-api/src/controllers/adminController.js`**:
  - Updated `createAdmin` to extract `name` and `status` from `req.body`.
  - Configured `status: status || 'Active'` on the new Firestore administrator record.
  - Allowed `name` as fallback for `displayName` and `fullName`.
- **`fly-api/src/middleware/allowedFields.js`**:
  - Enhanced error response to explicitly enumerate the offending keys (`Invalid fields: ${invalidFields.join(', ')}`) in non-production or for diagnostic transparency.
- **`fair-fly` Build & Deployment**:
  - Rebuilt production client bundle using Vite (`npm run build`).
  - Redeployed Cloud Functions (`api`) and Hosting via Firebase CLI.

## [2026-10-02] Security & Data Architecture: Lean Franchise Applications & Plaintext Password Elimination

### Overview
1. **Franchise Application Bloat & Redundancy Reduction**:
   - Analyzed Firestore `franchiseApplications` collection (specifically record `FRA-ttKKt0pD8GBpOZ7G6AmE`).
   - Identified and eradicated redundant fields: `id` (inherent in the document path), `fullName` (derivable from `firstName`, `middleInitial`, `lastName`), and `preferredMeetingTime` (derivable from `preferredMeetingStartTime` & `preferredMeetingEndTime`).
   - Updated the submission pipeline (`fly-api/src/controllers/franchiseController.js` and `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`) to omit storing these redundant fields in Firestore.
   - Updated all data consumers (`FranchiseContent.jsx`, `FranchiseAppDetailPage.jsx`, `ApplicationModal.jsx`, and backend endpoints `getApplications`, `getApplicationById`) to dynamically derive `fullName` and `preferredMeetingTime` with robust fallbacks.
   - Cleaned existing document `FRA-ttKKt0pD8GBpOZ7G6AmE` in Firestore by deleting `id`, `fullName`, and `preferredMeetingTime` fields.

2. **Plaintext Password Removal & Exposure Elimination**:
   - Identified security flaw where `createOperator` in `operatorController.js` spread `operatorData` directly into Firestore `users` documents, persisting plaintext passwords in Firestore.
   - Sanitized `operatorController.js` to strip `password` before saving operator records.
   - Sanitized `getOperators`, `getOperatorById`, `getAdmins`, and `getAdminById` to never return any `password` field in API responses.
   - Migrated existing Firestore `users` documents, permanently deleting all plaintext `password` fields from existing operator/admin records.

3. **Storage Security & Build Deployment**:
   - Re-instated `storage.rules` ensuring Firebase Storage rules are valid and enforceable.
   - Built production frontend bundle with Vite (`npm run build`).
   - Redeployed services using Firebase CLI.

## [2026-10-01] Fix: Franchise Application File Upload Deferred to Submit

### Overview
Files attached to the franchise application form were immediately uploaded to Firebase Storage upon selection. This was incorrect — orphan files would accumulate in Storage for every form open/close cycle even if the form was never submitted.

### Changes
- **`FranchiseApplicationForm.jsx`**:
  - Replaced `handleUploadFiles` (which uploaded immediately) with `handleSelectFiles` (validates and stages `File` objects locally).
  - Added `pendingFiles` state (`File[]`) to hold staged files. `formData.proofOfCapability` no longer stores pre-uploaded file metadata.
  - `handleRemoveProof` now removes from `pendingFiles` instead of `formData`.
  - `handleSubmit` converted to `async`. On submit: (1) uploads all `pendingFiles` to Storage sequentially under `franchise_applications/{id}/proofs/`, (2) builds the payload with `uploadedProofs`, (3) calls the backend API.
  - `uploadProgress` changed from a single number to `{ current, total }` to show per-file progress (`Uploading 2/4...`).
  - Submit button now shows two phases: **"Uploading N/M..."** (upload phase) then **"Submitting..."** (API phase). Cancel button is also disabled during both phases.
  - Dropzone simplified — no longer has `is-uploading` class or spinner state; hint text updated to "uploaded when you submit".
  - `handleClose` and success callback both clear `pendingFiles`.
  - File chip label changed from "X files attached" → "X files ready to upload".
  - Deduplication by `name + size` prevents the same file from being added twice.

## [2026-10-01] Refactor: AdminAppointments Portal Scoped to Franchise Consultations Only

### Overview
Refactored `AdminAppointments` (`/admin/appointments`) to be strictly dedicated to aspiring franchisee consultation scheduling. Previously, the portal queried all appointments and relied on a type-filter dropdown to separate client bookings from franchise consultations. This was incorrect — client service appointments must never appear here.

### Changes
- **`AdminAppointments.jsx`**: Added `where('type', '==', 'franchise_consultation')` to the Firestore `onSnapshot` query at the source, ensuring only franchise consultation documents are ever fetched. KPI aggregation counts (`getCountFromServer`) are similarly scoped. Removed the `typeFilter` state and the type-filter `<select>` dropdown from the toolbar. Removed redundant `isFranchise` branching in columns and detail modal (every record is guaranteed to be a franchise consultation). Updated page title to "Franchise Consultations", KPI card label ("Awaiting Confirmation"), column header ("Applicant", "Preferred Location"), and modal title ("Franchise Consultation Details"). Search field now matches against `notes` instead of `serviceType/purpose` which is not relevant to franchisee records.
- **`AdminLayout.jsx`**: Scoped the sidebar badge `qAppointments` listener to `where('type', '==', 'franchise_consultation')` so the nav badge count only reflects pending franchise consultations. Renamed nav label from "Appointments" → "Consultations" for clarity.

## [2026-10-01] Feature & Workflow: Aspiring Franchisee Application, Capability-Proof Storage, Collision-Detected Consultation Scheduling & Post-Consultation Operator Account Creation

### Overview
Architected and implemented an end-to-end dedicated workflow for **Aspiring Franchisees** applying to become FairFly franchise operators, completely decoupled from the existing Client → Operator appointment system. The workflow encompasses:
1. Public franchise application submission with capability-proof multi-file uploads (stored under secure subpaths `franchise_applications/{appId}/proofs/`) and preferred consultation windows (or "No preference / Admin to schedule").
2. Server-side mathematical interval collision detection (`newStart < existingEnd && newEnd > existingStart`) returning `409 Conflict` on overlapping consultation schedules while permitting adjacent slots.
3. Enhanced Admin Franchise Detail Page with capability attachments preview/download, applicant preferences display, and a collision-aware consultation scheduler modal replacing immediate direct approval.
4. Extracted reusable `AppointmentCalendar` component supporting Month and Week views, legend, status filters, and responsive layout, retrofitted into `OperatorAppointmentCalendar`.
5. Comprehensive Admin Appointments Portal (`/admin/appointments`) featuring Calendar and Table views, search, status and type filtering, consultation details modal, and real-time badge count in `AdminLayout`.
6. Post-consultation franchise approval pipeline: When consultation appointments reach `Completed`, admins can trigger "Grant Franchise & Create Operator Account", opening a pre-populated `OperatorModal` that creates the operator branch account and automatically updates the franchise application to `approved` and the consultation appointment to `Completed` with `operatorId` foreign key linkage.

### Key Changes
1. **Multi-Tier Storage Security & Path Validation (`fly-api/src/utils/fileSecurity.js`)**:
   - Added `franchise_applications` to `ALLOWED_ROOT_FOLDERS` and `FOLDER_ALIASES`.
   - In `sanitizeFolder`, enforced 3-level folder structure `franchise_applications/{appId}/{subfolder}` strictly restricted to `proofs`, `contracts`, and `consultations`, preventing arbitrary directory traversal or unsanitized root storage.
2. **Franchise Application Route & Controller Enhancements (`fly-api/src/routes/franchiseRoutes.js`, `fly-api/src/controllers/franchiseController.js`)**:
   - Expanded `FRANCHISE_ALLOWED_FIELDS` whitelist with `id`, `proofOfCapability`, `preferredMeetingDate`, `preferredMeetingTime`, `preferredMeetingStartTime`, `preferredMeetingEndTime`, `noPreferenceSchedule`.
   - Updated `submitApplication` to support client-preallocated IDs (`FRA-...`) via `addToDocumentWithId`.
   - Added `appointment_scheduled` to allowed statuses in `updateApplicationStatus`.
3. **Collision-Detected Consultation Scheduling Endpoint (`fly-api/src/routes/appointmentRoutes.js`, `fly-api/src/controllers/appointmentController.js`)**:
   - Added `POST /api/appointments/schedule-franchise` guarded by `verifyFirebaseToken`, `requireRole('admin')`, rate limiting, and allowed fields.
   - Implemented strict interval overlap collision detection: queries existing active appointments for the specified date and verifies `newStart < existingEnd && newEnd > existingStart`, returning `409 Conflict` with conflicting time window if occupied. Correctly permits back-to-back adjacent slots (e.g. 10:00–11:00 and 11:00–12:00).
   - On success, creates appointment with `type: 'franchise_consultation'`, `status: 'Confirmed'`, and updates the franchise application to `status: 'appointment_scheduled'` with `consultationAppointmentId`.
   - Supported `Completed` status transition in `updateAppointmentStatus`.
4. **Post-Consultation Operator Account Creation Linkage (`fly-api/src/routes/operatorRoutes.js`, `fly-api/src/controllers/operatorController.js`)**:
   - Added `franchiseApplicationId` and `appointmentId` to allowed fields for `POST /operators`.
   - In `createOperator`, when `franchiseApplicationId` is provided, automatically updates the franchise application to `status: 'approved'` and sets `operatorId: uid`, while updating the associated consultation appointment to `status: 'Completed'` and linking `operatorId: uid`.
5. **Frontend Franchise Application Form Enhancements (`fair-fly/src/components/Shared/FranchiseApplicationForm/`)**:
   - Pre-allocates unique franchise application ID (`FRA-...` via `generateFranchiseId`).
   - Added capability-proof multi-file drag-and-drop dropzone supporting up to 25MB total payload, file size validation, progress indicators, and removal chips.
   - Added meeting schedule preferences: date picker, start time, end time with chronological validation, and "No preference / Admin to schedule" toggle.
6. **Franchise Detail Page Consultation Scheduler (`fair-fly/src/pages/Admin/AdminFranchiseApps/FranchiseAppDetailPage.jsx`)**:
   - Replaced immediate direct approval with "Schedule Consultation Appointment" workflow.
   - Built schedule modal dialog with date and time selectors, notes, conflict error alert display, and capability proof download cards.
7. **Reusable Appointment Calendar (`fair-fly/src/components/Shared/AppointmentCalendar/`)**:
   - Created shared component supporting Month/Week views, legend, status pills, date range navigation, and click handlers.
   - Refactored `OperatorAppointmentCalendar.jsx` to delegate calendar rendering to `AppointmentCalendar`.
8. **Admin Appointments Portal (`fair-fly/src/pages/Admin/AdminAppointments/`)**:
   - Built full portal with KPI metric cards (Total, Pending, Confirmed, Completed), search with 300ms debounce, status and type filters, and Calendar/Table view toggle.
   - Table view powered by `<DataTable>` and `<Pagination>`.
   - Comprehensive Appointment Details Modal (`<BaseModal>`) displaying applicant credentials, scheduled time window, capability proofs, notes, and status transition actions.
   - For completed franchise consultations, prominent CTA "Grant Franchise & Create Operator Account" launches pre-populated `OperatorModal`, linking the accounts upon creation.
9. **Admin Navigation & Routing (`fair-fly/src/pages/Admin/AdminLayout/AdminLayout.jsx`, `fair-fly/src/App.jsx`)**:
   - Registered `/admin/appointments` navigation link in `baseAdminLinks` with icon `fa-regular fa-calendar-check`.
   - Added real-time Firestore listener for pending appointments badge counter.
   - Registered `<Route path="appointments" element={<AdminAppointments />} />` under admin routes in `App.jsx`.
10. **Component Documentation (`Fair2/Fairfly/component-list.md`)**:
    - Documented `AppointmentCalendar` component with props, appropriate usage, and styles.

### Verification
- **Automated Verification Script (`fly-api/src/scripts/testFranchiseAppointments.js`)**:
  - Validated storage subfolder security for `franchise_applications` (proofs, contracts, consultations, and fallback normalization).
  - Validated collision detection logic: detected partial overlap, start overlap, interior subset, and encompassing superset; allowed preceding and subsequent adjacent slots.
  - Validated end-to-end franchise application persistence, appointment scheduling, and status updates.
  - Validated post-consultation operator creation, franchise application approval, and operatorId foreign key linkage.
  - Test suite result: **21 Passed, 0 Failed**.
- **Production Build Validation**:
## [2026-10-01] Standardization: Split Name Fields (First Name, M.I., Last Name) & Company vs. Individual Client Type in Inquiry Forms

### Overview
Standardized name input fields across client registration (`Register.jsx`), customer service inquiry modal (`ClientInquiryModal.jsx`), and operator service inquiry intake modal (`CreateInquiryFormModal.jsx`) to align with the 3-column layout (**First Name**, **M.I.**, **Last Name**) used on the Franchise Application Form. Additionally implemented an **Individual vs. Company** client type toggle on both inquiry modals: when "Company" is selected, the forms prompt for the Company / Organization Name and provide the 3 name fields for the focal Contact Person (Representative). Maintained complete backward compatibility by auto-composing canonical `fullName`, `clientName`, and `contactPerson` attributes in backend controllers and service payloads.

### Key Changes
1. **Client Registration Form (`Register.jsx`, `register.css`)**:
   - Replaced single `fullName` input with responsive 3-column name row: First Name (`firstName`, required), M.I. (`middleInitial`, optional, uppercase, max 3 chars), and Last Name (`lastName`, required).
   - Added validation helpers `validateFirstName` and `validateLastName` (minimum 2 characters).
   - Derives composite `fullName` on submission and passes discrete name fields (`firstName`, `middleInitial`, `lastName`) alongside `fullName` to `initiateRegistration`.
   - Added responsive grid styles `.auth-name-row` with mobile breakpoint optimization.

2. **Customer Service Inquiry Modal (`ClientInquiryModal.jsx`, `client-inquiry-modal.css`)**:
   - Added interactive `Client Type` toggle: **Individual** vs. **Company / Organization**.
   - If **Individual**: Displays 3-column name row (First Name, M.I., Last Name).
   - If **Company**: Displays Company Name field, followed by the 3-column name row (First Name, M.I., Last Name) specifically for the Contact Person / Representative.
   - Enhanced prefill logic to parse `userDetails` into discrete first, middle, and last names for both individual and contact person state.
   - Dynamically constructs canonical `clientName` (Company Name if company, or Individual full name if individual) and canonical `contactPerson`.

3. **Operator Service Inquiry Modal (`CreateInquiryFormModal.jsx`, `create-inquiry-form-modal.css`)**:
   - Added `Client Type` segmented selector (**Individual** vs. **Company / Organization**) in Section 1.
   - Dynamically renders either Individual 3-column name fields or Company Name + Contact Person 3-column name fields.
   - Updated form validation and state to handle `clientType`, `companyName`, and discrete name fields for both flows.

4. **Backend Registration & Inquiry Controllers (`verificationService.js`, `inquiryController.js`)**:
   - `fly-api/src/services/verificationService.js`: Accepted `firstName`, `middleInitial`, `lastName` in `createPendingRegistration`, validating inputs and saving them to `pendingRegistrations` and verified `users` profiles.
   - `fly-api/src/controllers/inquiryController.js`: Supported `clientType`, `companyName`, `firstName`, `middleInitial`, `lastName`, and contact person name fields in `createInquiry`. Stored structured fields while guaranteeing canonical `clientName` and `contactPerson` resolution.

---

## [2026-09-30] Architecture & Database: Firestore System-Wide Normalization, Foreign Key Resolution & Point-in-Time Snapshot Preservation Policy

### Overview
Executed a comprehensive Firestore data normalization across operational and transient collections (`passwordResetRequests`, `tickets`, `qualificationApplications`, `inquiries`, `appointments`) to eliminate redundant embedded user profiles, inner IDs, and duplicated alias fields. Established dynamic read-time enrichment in backend controllers to guarantee 100% backward compatibility for all existing UI tables and modals. Strictly preserved immutable point-in-time snapshots for financial (`payments`), contractual (`quotations`), and execution workflow (`activeServices`) documents, and codified the architectural decision framework into a new repository guideline rule (`Fair2/.agents/rules/normalization-guidelines.md`).

### Key Changes
1. **Repository Normalization Rule Established (`.agents/rules/normalization-guidelines.md`)**:
   - Codified the core architectural rule: "If data can be normalized to save space and avoid stale state, normalize into reference IDs; if a critical snapshot is required for legal, financial, contractual, fulfillment, or audit-trail fidelity, preserve the point-in-time copy."
   - Explicitly documented collections that must **never** be normalized (`payments`, `quotations`, `activeServices`, `messages[].senderName`).
   - Detailed normalization standards: canonical field naming, eliminating inner `id` fields, and separating bulky child lists into referenced sub-collections.

2. **`passwordResetRequests` Pruning & Dynamic Operator Resolution**:
   - `fly-api/src/controllers/authController.js`: Stripped redundant `id`, `operatorName`, `branchUid`, and `branchName` from the stored request document. Kept foreign key `operatorUid` and functional `operatorEmail` (required for Firebase Auth reset link generation).
   - `fly-api/src/controllers/passwordResetController.js`: Added dynamic read-time resolution in `getPasswordResetRequests`, `getPasswordResetRequestById`, and `approvePasswordResetRequest` with `userCache` to enrich `operatorName` and `branchName` from `users/{operatorUid}` without saving redundant data in Firestore.

3. **`tickets` Root Normalization & Historical Message Transcript Preservation**:
   - `fly-api/src/controllers/ticketController.js`: Removed redundant `operatorName` and `operatorEmail` from the root ticket document. Retained foreign key `operatorId`.
   - Preserved `messages[].senderName` embedded in each message to guarantee historical chat transcript integrity.
   - Added `enrichTicketsWithOperatorData` helper to dynamically enrich `operatorName` and `operatorEmail` on read in `getTickets` and `getTicketById`.

4. **`qualificationApplications` Normalization**:
   - `fly-api/src/controllers/qualificationController.js`: Removed `operatorName` and `branchName` from stored application documents. Retained `operatorId` and point-in-time contact fields (`email`, `contactNumber`, `address`) for Super Admin verification.
   - Added dynamic operator profile enrichment on read in `getQualificationApplications` and `getQualificationApplicationById`.

5. **`inquiries` Duplicate Alias Elimination & Remarks Preservation**:
   - `fly-api/src/controllers/inquiryController.js`: Removed redundant duplicate alias fields: `fullName` (keeping canonical `clientName`) and `cellphone` (keeping canonical `phoneNumber`). Strictly preserved `remarks` as an active first-class operational feature for operator review, commentary, and special instructions across intake forms (`SAF-01-002`), modals, and PDF views.
   - Sanitized incoming payloads in `updateInquiry` to prevent re-introduction of deprecated duplicate aliases (`fullName`, `cellphone`).
   - Updated read endpoints and frontend components (`AdminInquiryDetailPage.jsx`, `InquiryFormDetailPage.jsx`, `InquiryDetailModal.jsx`, `ClientTrackingPage.jsx`) to smoothly handle canonical and legacy fields.

6. **`appointments` Duplicate Field Cleanup**:
   - `fly-api/src/controllers/appointmentController.js`: Removed duplicate `branchName` (in favor of user-selected `preferredBranchLocation`) and duplicate `operatorId` (in favor of standardized foreign key `branchUid`).
   - Added response mapping fallback in `getAppointments` and updated branch notifications to use `preferredBranchLocation`.

7. **`conversations` Participant Profile Normalization & Frontend In-Memory Caching**:
   - `fly-api/src/controllers/chatController.js`: Completely eliminated bulky `participantDetails` (nested map of `{ [uid]: { uid, name, email, role, branchName } }`) and `participantRoles` from stored Firestore conversation documents. Retained strictly functional fields: `participants: [uid1, uid2]`, `unreadCount: { [uid]: 0 }`, `lastMessage`, `lastMessageAt`, `lastMessageSenderId`, timestamps.
   - Built backend batch profile resolver `POST /api/chats/users/batch` (`getChatUsersBatch`) allowing authenticated users to safely resolve public chat profiles (`name`, `email`, `role`, `branchName`) with `userCache` acceleration.
   - Re-engineered `fair-fly/src/pages/Shared/MessagesPage/MessagesPage.jsx` with an in-memory `userProfiles` state cache: pre-populates contacts on mount, automatically batch-fetches missing partner profiles in a single query, and dynamically resolves current display names. When a user or branch renames themselves, the UI displays the latest profile without requiring cascading updates across existing conversation records.
   - Updated `fair-fly/src/pages/Operator/OperatorDashboard/OperatorDashboard.jsx` to dynamically resolve assigned admin profiles from the `users` collection.

8. **Database Migration Script & Verification**:
   - Created and executed `fly-api/src/scripts/migrateNormalizedCollections.js`: Inspected and migrated all existing documents across `tickets`, `qualificationApplications`, `inquiries`, `appointments`, and `conversations` with 0 errors.
   - Validated automated test suites (`testSubmittedRequirements.js`, `testPaymentAndResetFlows.js`, `testChatNormalization.js`) with 100% assertions passing.
   - Verified clean frontend production bundle build (`npm run build` in `fair-fly`, 0 errors).

---

### Overview
Architected and implemented a normalized pseudo-relational model for client and operator submitted requirements across `inquiries`, `quotations`, and `activeServices` using a dedicated `submitted_requirements` Firestore collection and a single `submittedRequirementsId` (prefixed `REQ-`) foreign key reference. Completely eliminated bloated embedded requirements arrays and duplicate reference keys (`submitted_requirements`) from parent documents, streamlined `submitted_requirements` documents to strictly store the requirements array, a single submitter UID (`submittedBy`), and timestamps (eliminating redundant `clientUid`), and re-engineered Firebase Storage uploads to enforce structured, semantic folder paths (`service_requirements/{service_requirementID}`, `client_ids/{uid}`, `chat_attachments/{conversationId}`, `services/attachments`, `services/covers`, `services/carousel`, `workflows/{id}`, `resources/{id}`, `announcements/{id}`, `qualifications/{id}`).

### Key Changes
1. **Normalized Lean Requirements Model (`submitted_requirements`) & Single Submitter UID**:
   - Built backend controller (`fly-api/src/controllers/submittedRequirementsController.js`) and routes (`fly-api/src/routes/submittedRequirementsRoutes.js`) mounted at `/api/submitted-requirements`.
   - Streamlined `submitted_requirements` schema to store strictly: `requirements`, `submittedBy`, `createdAt`, `updatedAt` — the Firestore document ID serves as the sole record identity (no redundant `id` field inside the document). Eliminated duplicate submitter fields (`clientUid` removed in favor of single `submittedBy`) and all redundant metadata (`serviceTitle`, `clientName`, `branchName`, etc.).
   - Fixed requirement persistence pipeline: Ensured `createSubmittedRequirementsRecord` is unconditionally invoked during `createInquiry` and `createActiveService` to guarantee the record is created in the `submitted_requirements` collection under the pre-allocated or generated ID.
   - Enforced single foreign key reference `submittedRequirementsId` across `inquiries`, `quotations`, and `activeServices`, eliminating duplicate `submitted_requirements` fields.
   - Stripped bloated `requirements` / `submittedRequirements` arrays from parent `inquiries`, `quotations`, and `activeServices` documents to ensure zero redundant byte storage.

2. **Cost-Optimized Single-Document Targeted Querying**:
   - Built lightweight React hook `useSubmittedRequirements(submittedRequirementsId, fallbackList)` (`fair-fly/src/hooks/useSubmittedRequirements.js`) that directly queries single documents `doc(firestore, 'submitted_requirements', id)` with `onSnapshot` / `getDoc` (exactly 1 read per view).
   - Updated client and operator interfaces (`InquiryFormDetailPage.jsx`, `AdminInquiryDetailPage.jsx`, `InquiryDetailModal.jsx`, `QuotationDetailModal.jsx`, `ClientServiceTracker.jsx`, `OperatorServiceProcedure.jsx`, `CreateQuotationModal.jsx`) to consume `useSubmittedRequirements`.

3. **Storage Upload Organization & Folder Hierarchy Correction**:
   - Client submitted requirements uploads are now strictly scoped to `service_requirements/{service_requirementID}` (e.g. `service_requirements/REQ-xxxxxxxx`) using client-side pre-allocated requirement IDs matching the Firestore record, rather than the Catalog Service ID.
   - Catalog service template files, attachments, covers, and carousels are organized under `services/attachments`, `services/covers`, and `services/carousel`.
   - Re-architected `fly-api/src/utils/fileSecurity.js`: `sanitizeFolder` validates multi-segment paths against whitelisted root folders (`service_requirements`, `client_ids`, `chat_attachments`, `services`, `workflows`, `workflow_documents`, `resources`, `announcements`, `qualifications`, `tickets`) with aliases (`service_store`, `service_covers`, `service_carousel` $\to$ `services`, `chat_files` $\to$ `chat_attachments`) while strictly stripping directory traversal attempts (`..`, null bytes).

4. **Database Migration & Security Rules Deployment**:
   - Executed `fly-api/src/scripts/migrateSubmittedRequirements.js`: Cleaned and pruned existing Firestore records, deleted duplicate reference keys (`submitted_requirements`), stripped bloated arrays from parent documents, removed `clientUid` in favor of `submittedBy`, and backfilled `submitted_requirements`.
   - Added strict RBAC match rules for `submitted_requirements` in `firestore.rules` verifying `resource.data.submittedBy == request.auth.uid` and deployed to cloud Firestore.

### Verification
- Executed migration script (`migrateSubmittedRequirements.js`) live with 100% completion (0 errors).
- Automated test suite (`testSubmittedRequirements.js`) passed all 11/11 assertion checks.
- Deployed live Firestore rules (`deployRules.js`) with zero errors.
- Production build (`npm run build`) in `fair-fly` completed cleanly (0 errors).

### Overview
Replaced all browser native `alert()` and `window.confirm()` prompts on the client side with the system's native `<ConfirmationModal>` and toast notifications. Added a dedicated payment confirmation modal before gateway redirect, integrated official vector SVG badges for PayMongo payment channels, and eliminated all button gradient backgrounds in favor of solid SaaS design tokens.

### Key Changes
1. **Client-Side Quotation Acceptance Modal (`ClientTrackingPage.jsx`)**:
   - Replaced browser `window.confirm()` and `alert()` in `handleAcceptQuotation` with `<ConfirmationModal>` component.
   - Designed a clear, high-contrast modal displaying quotation number, total payable amount in Philippine Pesos (`₱`), and booking fulfillment notice.
   - Standardized error handling to use system toast notifications (`addToast`) instead of modal/browser alerts.
2. **Payment Checkout Confirmation Modal (`PaymentModal.jsx`)**:
   - Integrated `<ConfirmationModal>` before initiating PayMongo checkout session to prevent accidental double-clicks or unexpected redirects.
   - Shows total amount, quotation reference, and destination information.
3. **Official Payment Method Logos (`fair-fly/public/paymentMethods/` & `PaymentModal.jsx`)**:
   - Added official vector SVG badges for GCash, QR Ph, Maya, Credit/Debit Cards (Visa/Mastercard), BillEase, and GrabPay.
   - Embedded SVG logos in `PaymentModal.jsx` with responsive sizing and styling in `payment-modal.css`.
4. **Button Gradient Elimination (Solid Color System Standardization)**:
   - Replaced `linear-gradient` button backgrounds with solid design tokens (`var(--purple, #7c3aed)` and `var(--purple-hover, #6d28d9)`):
     - `client-tracking.css`: `.btn-pay`
     - `payment-modal.css`: `.payment-submit-btn`
     - `tickets.css`: `.ticket-action-btn.view-thread-btn`
     - `tickets.css`: `.forum-send-btn`

### Verification
- Production build (`npm run build`) succeeded with 0 errors.
- Scratch logic verification passed 100%.
- Verified zero remaining gradients on buttons across all stylesheets.

## [2026-09-30] Bugfix & Security: Server-Side Walk-in Client Account Resolution for Inquiries & Quotations

### Overview
Fixed a critical identity linkage defect where walk-in inquiries and generated quotations recorded by branch operators were tagged with the operator's own UID instead of linking to the client's registered account. This prevented the quotation and inquiry records from showing up on the client's tracking portal (`/client/tracking`).

### Root Cause
- In `fly-api/src/controllers/inquiryController.js`, `createInquiry` previously fell back to `req.user?.uid || clientUid || null`. Because operator tokens contain the operator's UID, `effectiveClientUid` was assigned the operator's UID, corrupting document ownership.
- When generating a quotation from the inquiry in `CreateQuotationModal.jsx`, the modal inherited the operator's UID and sent it to `createQuotation`, which saved the quotation under the operator's UID.
- In `ClientTrackingPage.jsx`, quotations and inquiries are queried by `where('clientUid', '==', user.uid)`. Because of the UID mismatch, genuine client accounts never retrieved their documents, and Firestore Security Rules (`resource.data.clientUid == request.auth.uid`) rejected direct document access.

### Key Changes
1. **`fly-api/src/controllers/inquiryController.js`**:
   - Guarded `effectiveClientUid`: Staff accounts (`operator`, `branch_operator`, `admin`) are strictly excluded from being assigned as `clientUid`.
   - Added authoritative server-side user resolution: If staff creates a walk-in inquiry with a client email, Firestore `users` collection is queried for `where('role', '==', 'client')` matching the normalized email. If a registered client is found, their `uid` is linked to `newInquiry.clientUid`.
2. **`fly-api/src/controllers/quotationController.js`**:
   - Added security check in `createQuotation`: Discards any incoming or inherited `clientUid` matching the operator or branch UID.
   - Added automatic client account lookup by `clientEmail` (or originating inquiry email) in Firestore `users`.
   - Inquiry self-healing: When creating a quotation, any linked inquiry with a missing or operator-polluted `clientUid` is automatically updated and synced with the resolved genuine `clientUid`.
   - Self-healing on status change: In `updateQuotationStatus`, marking a quotation as `'Sent'` verifies `clientUid`, resolves it by `clientEmail` if missing or corrupted, persists the fix to Firestore, and delivers the notification to the actual client account.
3. **`fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx`**:
   - Filtered `initialData.clientUid` to ensure the operator's own UID is never pre-filled as `clientUid`.
   - Added user-facing guidance under client email field informing operators of automatic portal syncing.
4. **`fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx`**:
   - Added user-facing guidance under client email field regarding automatic client account portal linking.

### Verification
- Production frontend build (`npm run build`) succeeded with 0 errors.
- Syntax verification (`node --check`) passed on all modified controller files.
- Automated security suite (`testSecurityFixes.js`) passed 24 unit/controller security assertions.
- Logic assertions in scratch test confirmed correct resolution of client UIDs and rejection of operator UIDs.

## [2026-09-30] Infrastructure: Firebase Cloud Functions Deployment for Express Backend

### Overview
Configured the `fly-api` Express backend to deploy as a Firebase 2nd-gen Cloud Function, enabling serverless hosting on the same domain as the Firebase Hosting frontend.

### Key Changes
- **`fly-api/src/server.js`**: Added `firebase-functions/v2/https` `onRequest` import. Local `app.listen()` is now conditional (skipped inside Cloud Functions via `K_SERVICE`/`FUNCTION_NAME` env detection). Exports `api` Cloud Function wrapping the Express app with `512MiB` memory and `60s` timeout in `us-central1`.
- **`firebase.json`**: Changed `functions.source` from `"functions"` to `"fly-api"`. Split the invalid combined rewrite into two proper entries: `/api/**` → Cloud Function `api`, and `**` → `/index.html` for SPA routing.
- **`fly-api/package.json`**: Added `firebase-functions` dependency and `engines.node: "20"` (user-applied).

### Deployment
```bash
firebase deploy --only functions        # Deploy backend only
firebase deploy --only functions,hosting # Deploy both
```

### Notes
- The hosting rewrite `/api/**` → function `api` means the backend is accessible at `https://fairfly-1e83b.web.app/api/...` (same domain, no CORS issues in production).
- Local dev still works via `node src/server.js` / `nodemon` as before.

## [2026-09-30] UI / Theme: Lightbox Header & Footer White Theme Styling & Readability Enhancement

### Overview
Updated the `ImageLightbox` design styling to feature a clean, solid white theme across the header bar and footer toolbar with high-contrast text and interactive button controls for optimal readability and accessibility.

### Key Changes
1. **Header Bar (`.ff-lightbox-header`)**:
   - Replaced dark backdrop with solid white (`#ffffff`), subtle bottom border (`#e2e8f0`), and crisp SaaS drop shadow (`box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08)`).
   - Set title text color to high-contrast dark slate (`var(--text-dark, #0f172a)`).
   - Styled subtitle to muted slate (`var(--text-mid, #475569)`).
   - Transformed counter badge to brand tint background (`var(--purple-light-2, #eef2ff)`) with brand deep purple text (`var(--purple-dark, #4338ca)`).
   - Updated action buttons (`.ff-lightbox-btn`) to clean light button styles (`#f8fafc` background, `#cbd5e1` border, `#1e293b` text) with hover states (`#eef2ff` brand highlight).
   - Updated close button (`.ff-lightbox-btn.close`) to soft rose background (`#fee2e2`) with crimson text (`#b91c1c`) and strong red hover state (`#dc2626`).
   - Improved zoom level indicator to bold dark slate (`var(--text-mid, #334155)`).
2. **Footer Bar (`.ff-lightbox-footer`)**:
   - Set background to solid white (`#ffffff`) with subtle top border (`#e2e8f0`) and elevation shadow.
   - Text color updated to readable slate (`var(--text-mid, #475569)`).
   - Keyboard hint tags (`.ff-lightbox-kbd`) updated to light gray (`#f1f5f9`), slate border (`#cbd5e1`), dark slate text (`#0f172a`), and subtle elevation.
3. **Verification**:
   - Full production build (`npm run build`) succeeded with 0 errors.

---

## [2026-09-29] Architecture: Root-Level Lightbox Rendering via Global LightboxProvider & React Portals

### Overview
Refactored the `ImageLightbox` architecture so that the lightbox is rendered exclusively at the application root rather than being instantiated as a child inside individual components, dialogs, or page trees. This eliminates z-index stacking issues, CSS transform/overflow clipping, and redundant component state across the entire frontend.

### Key Changes
1. **Application Root Mount (`main.jsx`)**:
   - Wrapped the application in `<LightboxProvider>` at the root level within `main.jsx`.
   - The provider manages the active lightbox configuration and index state globally, rendering a single `<ImageLightbox />` instance mounted directly into `document.body` via `ReactDOM.createPortal`.
2. **Global Consumer Hook (`useLightbox`)**:
   - Exposed `const { openLightbox, closeLightbox, isOpen } = useLightbox()`.
   - Enhanced `openLightbox` to accept flexible arguments:
     - Object signature: `{ imageUrl, title, subtitle, images, activeIndex, downloadable, zoomable }`
     - Direct string URL signature: `openLightbox(imageUrl, title, subtitle)`
     - Multi-image array signature: `openLightbox([url1, url2], initialIndex, title)`
3. **Elimination of Child Lightbox Elements Across All Components**:
   - Removed all local `<ImageLightbox />` child tags and corresponding `[lightboxImage, setLightboxImage]` states across all consumers:
     - `ClientServiceTracker.jsx`
     - `QuotationDetailModal.jsx`
     - `InquiryDetailModal.jsx`
     - `MessagesPage.jsx`
     - `FormResponseList.jsx`
     - `AdminQualificationDetailPage.jsx`
     - `OperatorServiceDetailPage.jsx`
     - `ServiceDetailPage.jsx`
     - `OperatorServiceProcedure.jsx`
     - `InquiryFormDetailPage.jsx`
     - `AdminInquiryDetailPage.jsx`
     - `ServiceRequirementsModal.jsx`
     - `WorkflowModal/WorkflowForm.jsx`
     - `ServiceWorkflowModal.jsx`
     - `ServiceItemPage.jsx`
     - `ServiceCarouselGallery.jsx`
     - `ValidIdUpload.jsx`
     - `ClientDetailPage.jsx` & `IdPreviewModal.jsx`
     - `AnnouncementsPage.jsx` & `AnnouncementLightbox.jsx`
4. **Verification**:
   - Verified that exactly zero child `<ImageLightbox` tags exist in the JSX tree of any subcomponent (`fair-fly/src`), with only one global instance mounted in `LightboxProvider`.
   - Full production build (`npm run build`) passing with 0 errors.

---

## [2026-09-29] Feature: Unified In-App ImageLightbox for All User-Generated Content (UGC) Images & Elimination of External Storage Links

### Overview
Scanned the entire frontend system for all occurrences of User-Generated Content (UGC) images originating from Firebase Storage (government IDs, inquiry attachments, quotation requirement uploads, service tracker files, direct messaging chat attachments, service carousel photos, qualification documents, and workflow step files). Eliminated all instances where clicking UGC images opened raw `firebasestorage` URLs in a separate browser tab (`target="_blank"`), routing all image inspections through a newly created, accessible, high-performance in-app `ImageLightbox` design system primitive.

### Key Changes
1. **Core Reusable Component (`ImageLightbox`)**:
   - Created `fair-fly/src/components/UI/ImageLightbox/ImageLightbox.jsx` & `image-lightbox.css`.
   - Supports both single-image preview and multi-image gallery carousels with smooth backdrop blur.
   - Built-in interactive zoom controls (`Zoom In`, `Zoom Out`, `Reset`), drag/pan indicators, and direct in-app fetch/blob download (preventing external tab navigation).
   - Full keyboard accessibility (`Escape` to close, `ArrowLeft`/`ArrowRight` to cycle images, `+`/`-`/`0` to zoom).
   - Exported `isImageUrl(url, fileName)` utility to reliably distinguish image MIME/extensions from documents across Firebase Storage URLs.
   - Cataloged in `Fairfly/component-list.md`.
2. **Client Registration & Verification (`ValidIdUpload.jsx`, `IdPreviewModal.jsx`, `ClientDetailPage.jsx`)**:
   - Replaced external raw Firebase Storage links with `ImageLightbox` triggers for front and back government ID photos across registration, re-upload, operator review, and admin client management.
3. **Client Service Tracking & Modals (`ClientServiceTracker.jsx`, `QuotationDetailModal.jsx`, `InquiryDetailModal.jsx`)**:
   - Uploaded requirement thumbnails and "View Attached Image" links now launch `ImageLightbox` directly in-app.
4. **Operator Workflow & Inquiry Processing (`OperatorServiceProcedure.jsx`, `InquiryFormDetailPage.jsx`, `AdminInquiryDetailPage.jsx`, `ServiceWorkflowModal.jsx`)**:
   - Attachment badges and requirement document previews now launch `ImageLightbox` when the file is an image, retaining document download for PDFs.
5. **Direct Messaging (`MessagesPage.jsx`)**:
   - In-chat file cards for image attachments now launch `ImageLightbox` with zoom and download rather than opening a new tab.
6. **Marketplace & Service Catalogs (`ServiceItemPage.jsx`, `ServiceCarouselGallery.jsx`, `OperatorServiceDetailPage.jsx`, `ServiceDetailPage.jsx`, `ServiceRequirementsModal.jsx`, `WorkflowForm.jsx`)**:
   - Migrated custom and redundant lightbox implementations to `ImageLightbox`.
   - Service hero carousel photos and requirement template sample images now open inside `ImageLightbox`.
7. **Announcements (`AnnouncementLightbox.jsx`)**:
   - Refactored `AnnouncementLightbox` to delegate directly to `ImageLightbox`, standardizing UI/UX.

---

## [2026-09-28] Feature: Franchise Application Form Builder, PSGC Address Cascade & Dynamic Custom Fields

### Overview
Addressed several enhancements and bugfixes for the Franchise Module:
1. **Operator Edit 400 Bad Request Fix**: Removed `password` from the payload in edit mode within `OperatorForm.jsx`, satisfying backend `allowedFields` whitelisting.
2. **Franchise Form Builder Integration**: Added "Customize Application Form" button to `admin/franchise-apps` (mirroring `admin/inquiry-history`), backed by `FranchiseApplicationFormBuilderModal` and `/api/franchise/application-schema`.
3. **Modal Form Builder Section Display**: Defined `DEFAULT_FRANCHISE_SCHEMA` with all standard core sections (Applicant Info, Preferred Location, Business Background) protected with shield/lock badges, and an extensible "Custom Franchise Specifications" section with "+ Add New Field" capability.
4. **Philippine Geographic Data (PSGC Cloud API)**: Rewrote cascading location selectors (`Province` $\to$ `Municipality` $\to$ `Barangay` $\to$ `Building`) with official PSGC Cloud endpoints, added first-class Metro Manila (NCR) region support, and integrated dynamic custom form fields.

### Key Changes
- `fair-fly/src/components/Admin/Modals/OperatorModal/OperatorForm.jsx`: Stripped `password` on edit submit.
- `fly-api/src/controllers/franchiseController.js`: Added `DEFAULT_FRANCHISE_SCHEMA` and updated `getFranchiseApplicationSchema` and `submitApplication` to support dynamic `customFields`.
- `fly-api/src/routes/franchiseRoutes.js`: Whitelisted `customFields` in `FRANCHISE_ALLOWED_FIELDS` and registered schema endpoints before parameterized routes.
- `fair-fly/src/components/Admin/Modals/FranchiseApplicationFormBuilderModal/FranchiseApplicationFormBuilderModal.jsx`: Normalized incoming schema with guaranteed default sections, protected core fields, and full custom field creation/deletion.
- `fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`: Integrated PSGC Cloud API with NCR support, added dynamic custom fields rendering, and included `customFields` in submission payload.

---

## [2026-09-28] Bugfix: Client Service Tracker Requirements File Resolution & Attachment Previews

### Overview
Resolved an issue where viewing submitted requirements in the Client-side Service Tracker (`ClientServiceTracker.jsx`) always displayed "Pending Upload" despite files having been successfully uploaded and viewable from the Operator's Service Fulfillment page (`OperatorServiceProcedure.jsx`).

### Root Cause
1. **File Metadata Property Mismatch**:
   In FairFly's file upload pipeline, uploaded file information is stored in a structured `file` object (`{ url, fileName, fileSize, storagePath }`), while `req.value` is an empty string `""` and `req.fileUrl` is `undefined`.
   In `ClientServiceTracker.jsx`, the component evaluated `const val = typeof req === 'object' ? req.value || req.textValue || req.fileUrl : null;`. Because `req.file` was not checked, `val` was falsy, causing the ternary `val ? ... : Pending Upload` to always default to the orange "Pending Upload" badge.
2. **Catalog Template Fallback Shadowing**:
   If an active service record contained default catalog requirements (`inputType: 'file'` without `file` attachments), the previous fallback check considered `r.inputType` truthy, preventing the component from fetching actual uploaded files from the originating inquiry or quotation.

### Key Changes
1. **`fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx`**:
   - Correctly extracted `fileObj = req.file`, `fileUrl = fileObj?.url || req.fileUrl || req.url || ...`, and `fileName = fileObj?.fileName || req.fileName`.
   - Rendered active, clickable preview/download links with file names and icons, plus miniature thumbnail previews for images.
   - Enhanced fallback resolution to check for actual uploaded files across `submittedRequirements` and `requirements`, automatically looking up originating `inquiryId` and `quotationId` when needed.
2. **`fair-fly/src/components/Client/ClientServiceTracker/service-tracker.css`**:
   - Added styles for `.tracker-req-file-box`, `.tracker-img-thumb-link`, `.tracker-img-thumb`, and hover states.
3. **`fair-fly/src/pages/Operator/OperatorServiceProcedure/OperatorServiceProcedure.jsx`**:
   - Aligned requirement resolution logic to verify actual uploaded files across `submittedRequirements` and `requirements`, supporting fallback across both `inquiryId` and `quotationId`.
4. **`fair-fly/src/components/Client/InquiryDetailModal/InquiryDetailModal.jsx` & `inquiry-detail-modal.css`**:
   - Enhanced Specified Requirements section to render clickable file download links and image thumbnail previews when client attachments exist.
5. **`fair-fly/src/components/Client/QuotationDetailModal/QuotationDetailModal.jsx` & `quotation-detail-modal.css`**:
   - Rendered submitted requirements with downloadable file links and image previews within the quotation modal.

---

## [2026-09-28] Bugfix: React Hook Order in OperatorServiceProcedure & Ticket Permissions Leak in OperatorTickets

### Overview
Fixed two runtime frontend exceptions reported in the browser console:
1. **React Hook Order Violation in `OperatorServiceProcedure.jsx`**:
   - *Problem*: `Uncaught Error: Rendered more hooks than during the previous render.`
   - *Root Cause*: `const displayRequirements = useMemo(...)` was placed after the conditional early returns (`if (loading)`, `if (isUnauthorized)`, `if (!serviceRecord)`). During initial loading, React registered 13 hooks before returning early. When data loaded and `loading` became false, execution continued past the return and reached hook 14, violating the React Rules of Hooks.
   - *Fix*: Relocated `displayRequirements = useMemo(...)` to the top-level declaration block alongside `isUnauthorized`, ensuring all Hooks execute unconditionally in identical order on every render.
2. **Firestore Insufficient Permissions on Tickets (`OperatorContext.jsx`)**:
   - *Problem*: `OperatorProvider onSnapshot error on tickets: FirebaseError: Missing or insufficient permissions.`
   - *Root Cause*: `OperatorTickets.jsx` wrapped its routes with `<OperatorProvider targetCollection="tickets">`, initiating an un-scoped, real-time collection listener on `/tickets`. Firestore Security Rules forbid reading the full tickets collection without scoping to individual operator documents. Furthermore, no child views consumed `useOperatorContext()`; all ticket queries are handled cleanly by `ticketService` via the authenticated Express API.
   - *Fix*: Removed the redundant `<OperatorProvider targetCollection="tickets">` from `OperatorTickets.jsx`, matching the optimization previously implemented in `AdminTickets.jsx`.

---

## [2026-09-28] Bugfix: Requirements Pipeline from Inquiry to Service Fulfillment & Quotation Post-Payment Immutability

### Overview
Resolved two critical operational bugs in the FairFly service quotation and fulfillment lifecycle:
1. **Requirements Preservation in Service Fulfillment (`OperatorServiceProcedure.jsx`)**:
   - Fixed an issue where client-submitted requirements and uploaded documents were visible on the inquiry intake form, but displayed as `Client Submitted Requirements (0)` on the Service Fulfillment Procedure page after quotation acceptance and payment.
   - Preserved requirement metadata (`name`, `inputType`, `value`, `file: { url, fileName, fileSize, storagePath }`) through the entire Inquiry $\to$ Quotation $\to$ Service Fulfillment lifecycle.
   - Updated `QUOTATION_ALLOWED_FIELDS` in `fly-api/src/routes/quotationRoutes.js` to whitelist `submittedRequirements`.
   - Updated `CreateQuotationModal.jsx` to pass `submittedRequirements` from initial inquiry data.
   - Updated `inquiryController.js` (`confirmInquiry`) to attach `submittedRequirements` to the auto-generated quotation payload.
   - Updated `quotationController.js` (`createQuotation` and `buildFulfillmentPayload`) to inherit submitted requirements from inquiry or quotation and persist them directly into `activeServices.submittedRequirements` and `activeServices.requirements`.
   - Fixed JavaScript array truthiness evaluation in `OperatorServiceProcedure.jsx` (`[] || requirements`), and added automated fallback retrieval for legacy active service records.
2. **Quotation Post-Payment Immutability & Action Lockout on Operator Portal**:
   - Fixed an issue where paid quotations in the Quotations tab (`QuotationDetailPage.jsx` and `OperatorQuotations.jsx`) still allowed operators to "Accept on Behalf of Client (On-Site)", "Edit Fields", or "Mark as Sent".
   - Locked down frontend actions on `QuotationDetailPage.jsx`:
     - Excluded `Accept on Behalf of Client (On-Site)` and `Edit Fields` when the quotation is finalized (`PAID` or `Accepted`).
     - Guarded `handleSaveChanges`, `handleDelete`, `handleStatusChange`, and `handleAcceptOnBehalf` with explicit notifications if called on finalized/paid quotations.
     - Updated procedure button link to point to `/operator/services/${quotation.activeServiceId}/procedure`.
     - Rendered green `Quotation Paid · Service Fulfillment Active` banner for paid quotations.
   - In `OperatorQuotations.jsx`, restricted the "Mark as Sent" button to `Draft` quotations only, and applied status pill styles for `PAID` / `Accepted` records.
   - Hardened backend controllers (`quotationController.js`):
     - `updateQuotation`, `updateQuotationStatus`, `acceptQuotation`, and `deleteQuotation` now strictly return HTTP 400 Bad Request if attempted on a quotation with status `PAID` or paymentStatus `PAID`.
   - Added automated test cases in `testPaymentAndResetFlows.js` verifying requirements preservation and post-payment immutability (7/7 tests passing).

---

## [2026-09-28] Feature: Operator Fulfillment & History Workflow with View Modals and Automatic Full Refund on Cancellation

### Overview
Addressed three critical operational requirements in the FairFly Operator Portal and backend fulfillment lifecycle:
1. **Active Fulfillment Real-time Exclusion**: Services marked as `Completed` (fulfilled) or `Cancelled` now immediately move out of the Active Services Fulfillment list on the Operator Dashboard (`/operator`) and transition to Operator History.
2. **Operator History Unified View & View Details Modal**:
   - `OperatorHistory.jsx` now retrieves both `Completed` and `Cancelled` services (`/api/services/active?status=history`), as well as full appointment records.
   - Added an **Actions** column with a dedicated **"View"** button for every row in both Service History and Appointment History.
   - Built the reusable `HistoryDetailModal` component (`src/components/Operator/HistoryDetailModal`) adhering to FairFly design system tokens, displaying:
     - Prominent **100% Full Refund Callout Card** for cancelled services (displaying PayMongo refund ID, refund amount in PHP, refund status, and cancellation reason).
     - **Fulfillment Success Banner** for completed services with completion timestamp.
     - 2-Column layout with Client profile information and Financial/Operations summary (price, payment status, quotation reference, branch name).
     - Full procedure workflow steps audit breakdown with statuses, completed dates, and third-party links.
     - Complete appointment details (client info, preferred schedule, branch office, purpose of visit, and status pill).
3. **100% Full Refund on Cancellation via PayMongo**:
   - Updated backend controller (`fly-api/src/controllers/activeServiceController.js` $\to$ `cancelActiveService`):
     - Derives authoritative payment document and amount from `payments` collection.
     - Dispatches a 100% Full Refund through the PayMongo Refund API (`createPaymongoRefund`).
     - Atomically marks `activeServices`, `payments`, and linked `quotations` as `status: 'Cancelled'`, `paymentStatus: 'REFUNDED'`, `refundStatus: 'FULL_REFUND'`, with `refundAmount`, `refundId`, and `refundedAt`.
     - Sends in-app client notification confirming cancellation with exact full refund amount (₱...) and reference ID.
     - Dispatches admin notification for financial audit compliance.
   - Enhanced procedure cancellation modal (`OperatorServiceProcedure.jsx`) and status banners to provide complete transparency regarding the 100% full refund guarantee.
4. **Component Catalog Registration**: Documented `HistoryDetailModal` in `Fairfly/component-list.md`.

---

### Overview
Enhanced the Client Portal's "My Inquiries & Quotations" tab (`ClientTrackingPage.jsx`):
1. **Subtab Navigation**: Unified "Official Quotations" (ADF-07-001) and "Submitted Inquiries" (SAF-01-002) into structured subtabs with count badges.
2. **DataTable Layout for Quotations**: Replaced the static card grid with FairFly's standard `DataTable` component, complete with responsive columns, debounced search (`useDebounce`), status filter chips (`FilterChipGroup`), and pagination (`Pagination`).
3. **DataTable Layout for Submitted Inquiries**: Replaced the vertical card list with an aligned `DataTable` featuring control numbers, passenger counts, category chips, submission dates, status badges, debounced search, filter chips, and pagination.
4. **Complete Details View Modals**:
   - `QuotationDetailModal`: Full breakdown of package pricing, tour schedule dates, rate breakdown, inclusions/exclusions, operator remarks, official PDF viewer button, and one-click accept & pay actions.
   - `InquiryDetailModal`: Complete intake specifications, passenger counts (adults, children, total pax), requested service categories, specified requirements with attached filenames, operator remarks, and official SAF-01-002 PDF viewer button.
5. **Resume Payment Action Button Styling**: Added global `.btn-warning` utilities and dedicated styling for the Resume action button in both the Quotation DataTable row (`.client-row-actions .btn-warning.btn-xs`) and `QuotationDetailModal` (`.quote-modal-footer .btn-warning.btn-resume`) with warm amber accents, hover states, and iconography.
6. **Component Catalog Registration**: Documented `QuotationDetailModal` and `InquiryDetailModal` with full prop interfaces and functionality descriptions in `Fairfly/component-list.md`.

---

## [2026-09-28] Bugfix: Payment Verification Firestore Undefined Field Exception (`quotationId`)

### Overview
Fixed an HTTP 500 error during `POST /api/payments/:id/verify` caused by Firestore rejecting `undefined` values when building the service fulfillment record (`quotationId`).

### Root Cause
1. `transaction.get(quotationRef).data()` in Firestore only returns the document's internal stored fields without appending the document ID (`id`). Because `quotation.id` was referenced directly instead of `quotationDoc.id`, it evaluated to `undefined`.
2. When creating the active service fulfillment document via `transaction.set(activeServiceRef, fulfillmentPayload)`, Firestore threw:
   `Cannot use "undefined" as a Firestore value (found in field "quotationId")`.

### Fix
1. **Global Protection (`firebase.js`)**: Enabled `db.settings({ ignoreUndefinedProperties: true })` on the Firestore Admin instance, preventing undefined property crashes across all operations.
2. **Explicit Document ID Merging (`paymentController.js`)**:
   Merged `id: quotationDoc.id` into `quotationData` and `id: paymentDoc.id` into `paymentData` inside `finalizeSuccessfulPayment`.
3. **Resilient Fallbacks (`quotationController.js`)**:
   Updated `buildFulfillmentPayload` to use `quotation.id || quotation.quotationId || payment?.quotationId || null` for `quotationId`, guaranteeing safe non-undefined values.
4. **Daemon Restart**: Restarted `fly-api` backend server with nodemon on port 5001.

---

## [2026-09-28] Feature: Operator Password Reset Request Flow & PayMongo Sandbox Payment Gateway Integration


### Overview
Architected and implemented two interconnected enterprise-grade features for the FairFly Travel & Tours System:
1. **Operator Password Reset Request & Super Admin Review Pipeline**: Allows branch operators to submit password reset requests through an anti-enumeration public intake endpoint. Super Admins inspect verification factors and approve (triggering official Firebase Auth password reset links via email) or reject with audit notes.
2. **PayMongo Payment Integration & Decoupled Fulfillment Workflow**: Decoupled service fulfillment creation from quotation acceptance. Fulfillment is now strictly deferred until server-verified payment completion. Implemented dual-path payment verification (cryptographic HMAC-SHA256 webhook + client redirect sync) with atomic ACID transactions guaranteeing exactly one fulfillment record per payment.

---

### Key Architectural & Security Implementations

#### 1. Part 1 — Operator Password Reset Request & Super Admin Approval Pipeline
- **Anti-Enumeration Public Defense (`authController.js`)**:
  - `POST /api/auth/operator-reset-request` and `POST /api/auth/operator-forgot-password`: Returns a uniform generic HTTP 200 response regardless of whether the email exists, preventing attacker reconnaissance and username harvesting.
  - Zero-Trust Backend Verification: Cross-references Firestore `users` for active `role === 'operator'` or `'branch_operator'`.
  - Duplicate Request Throttling: Enforces a strict 24-hour rate limit on duplicate requests for the same operator account.
  - Automatic Expiration: Sets `expiresAt` to 48 hours in the future. Expired requests are automatically marked as `Expired` during reads.
  - Super Admin Alerts: Automatically dispatches notifications to system administrators via `notifyAdmins`.
- **Super Admin Review & Link Generation (`passwordResetController.js`)**:
  - Guarded strictly by `verifyFirebaseToken`, `requireSuperAdmin`, and `apiRateLimiter`.
  - Approval: Super Admin clicks Approve $\to$ Backend invokes `admin.auth().generatePasswordResetLink(email)` $\to$ Dispatches official password reset email via transactional mailer (`sendPasswordResetEmail`) $\to$ Updates record to `Approved` with `processedBy`, `processedAt`, and `authResetLinkGenerated: true`.
  - Rejection: Records reviewer identity, timestamp, and mandatory rejection notes in `rejectionReason`.
  - No Plaintext Passwords or Credentials: Plaintext passwords are never accepted, stored, or returned.
- **Frontend Super Admin & Operator Views**:
  - `ResetPassword.jsx`: Role switcher tab (`Traveler / Client` vs `Franchise Operator`) with branch selection, verification reasons, and zero-trust security notices.
  - `PasswordResetRequestsTab.jsx`: Super Admin management interface with KPI counters, filter chips (`All`, `Pending`, `Approved`, `Rejected`, `Expired`), search, detailed inspect modal, approve confirmation modal, and reject modal.
  - Integrated into `OperatorsContent.jsx` with sub-tab switcher (`Franchise Operators` vs `Password Reset Requests`).

---

#### 2. Part 2 — PayMongo Sandbox Payment Gateway & Workflow Decoupling
- **Decoupled Business Flow**:
  - Previous Behavior: `acceptQuotation` prematurely spawned `activeServices` records before any financial commitment.
  - Corrected Architecture:
    1. Client accepts Quotation $\to$ `acceptQuotation` sets quotation `status: 'Accepted'` and `paymentStatus: 'UNPAID'`. No fulfillment record is created.
    2. Client opens `PaymentModal` $\to$ Calls `POST /api/payments/checkout-session`.
    3. Backend derives total price strictly server-side from `quotation.totalAmount` (zero-trust client price derivation) $\to$ Generates PayMongo Checkout Session (GCash, Maya, QR Ph, Credit/Debit cards, BillEase, GrabPay).
    4. Client completes payment $\to$ PayMongo triggers dual verification:
       - **Asynchronous Webhook (`POST /api/payments/webhook`)**: Verified via cryptographic HMAC-SHA256 signature against `${timestamp}.${rawBody}` with 5-minute replay attack defense window.
       - **Synchronous Client Return (`POST /api/payments/:id/verify`)**: Invoked when client lands on return URL (`/client/tracking?payment_status=success&payment_id=...`).
    5. Atomic Finalization (`finalizeSuccessfulPayment`): Executes inside a Firestore ACID transaction (`db.runTransaction`). Updates payment to `PAID`, marks quotation `paymentStatus: 'PAID'`, and creates the initial `activeServices` fulfillment document with compiled workflow steps.
- **Strict Idempotency Guarantee**:
  - Prevents race conditions between concurrent webhooks and user return redirects.
  - If a payment is already marked `PAID`, returns the existing `fulfillmentId` immediately without executing duplicate inserts.
  - Guarantees $1\text{ Successful Payment} = \text{Exactly } 1\text{ Active Service Fulfillment}$.
- **Raw Body Preservation (`server.js`)**:
  - Configured `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })` to maintain raw buffer for timing-safe signature comparison (`crypto.timingSafeEqual`).
- **Database & Security Rules (`firestore.rules`)**:
  - Locked down `activeServices`, `payments`, and `passwordResetRequests` against client direct mutations (`allow create, update, delete: if false;`).
  - Added object-level ownership checks for scoped payment reads.

---

### Verification & Testing
- **Automated Verification Suite (`testPaymentAndResetFlows.js`)**:
  - `PayMongo Webhook`: Validates authentic HMAC-SHA256 signature (`PASS`).
  - `PayMongo Webhook`: Rejects forged and tampered signatures (`PASS`).
  - `PayMongo Webhook`: Rejects expired webhook event timestamps (`PASS`).
  - `Quotation Acceptance`: Builds fulfillment payload with complete workflow steps (`PASS`).
  - `ACID Idempotency`: Exactly 1 fulfillment created for 1 successful payment across concurrent calls (`PASS`).
  - `Password Reset Anti-Enumeration`: Verifies uniform generic client response (`PASS`).
- **Regression Security Suite (`testSecurityFixes.js`)**:
  - 26/26 automated security and BOLA/IDOR tests passing.
- **Frontend Production Build**:
  - Ran `npm run build` in `fair-fly` with Vite v8.0.16: 2,690 modules transformed, 0 errors.

---

## [2026-09-28] Refactor: Suppress Notification Badges on Operator Services Tab from Client Service Requests


### Overview
Ensured that client-initiated service requests do not place an unwanted notification badge on the **Services** tab (`/operator/services`) in the Operator sidebar, keeping the Services tab strictly dedicated to Service Catalog management (standard and custom catalog items).

### Fixes & Protections Applied
1. **Direct Procedure Linking & Specific Type Assignment (`activeServiceController.js`)**:
   - Updated `notifyBranch` payload on client service requests (`createActiveService`):
     - `type`: Changed from generic `'service'` to `'active_service'`.
     - `link`: Changed from generic `'/operator/services'` (catalog) to direct procedure execution `'/operator/services/${docId}/procedure'`.
2. **Tab Notification Suppression & Explicit Zero-Badge Handling (`AppSidebar.jsx`)**:
   - Updated `getTabNotificationCount` to respect numeric values of `0` in `tabNotifications`, allowing layouts to explicitly turn off badges on specific tabs without falling through to automated matching.
   - Added explicit boundary guard: in the Operator portal, the `/operator/services` tab (catalog) is barred from receiving automated badges from client intake requests.
3. **Layout Configuration (`OperatorLayout.jsx`)**:
   - Explicitly declared `'/operator/services': 0` in `tabNotifications` to enforce zero-badge behavior for the Services catalog tab.
4. **Notification Bell Visuals (`NotificationBell.jsx`)**:
   - Added support for category `active_service` to render the clipboard list icon (`fa-solid fa-clipboard-list`).
5. **Daemon Restart & Build Verification**:
   - Restarted `fly-api` backend server daemon on port 5001.
   - Built frontend bundle via `npm run build` (vite v8.0.16) with 0 errors.

## [2026-09-28] Feature: Operator Appointment Calendar View (Month & Week Views)

### Overview
Implemented a dedicated, interactive **Appointment Calendar View for Operators** in the FairFly system. Each branch operator can view, navigate, and manage scheduled consultations with visual day indicators, exact appointment times, and a comprehensive consultation details modal.

### Architecture & Security Highlights
1. **Operator-Specific Data Isolation & Zero-Trust Backend**:
   - Guarded by `verifyFirebaseToken` and role checks.
   - Strictly enforces multi-tenant boundary: only appointments where `branchUid === req.user.uid` are retrieved.
2. **Date-Range Filtering with Resilient Index Fallback (`appointmentController.js`)**:
   - Supported `startDate` and `endDate` parameters on `GET /api/appointments`.
   - Bounded queries retrieve only appointments within visible calendar windows (`preferredDate >= startDate && preferredDate <= endDate`), eliminating full-collection downloads.
   - Integrated compound range index fallback: if Firestore throws `FAILED_PRECONDITION` (code 9: missing composite index), automatically executes base branch filter and applies in-memory date range filtering and chronological sorting (`preferredDate ASC, preferredTime ASC`).
   - Declared composite indexes (`branchUid` ASC + `preferredDate` ASC, `clientUid` ASC + `preferredDate` ASC) in `firestore.indexes.json`.
3. **Frontend Calendar Component (`OperatorAppointmentCalendar.jsx`)**:
   - Supports **Month View** (7-column grid Sun–Sat with highlighted today indicator and appointment count badges) and **Week View** (7-day chronological view showing time slots).
   - Exact consultation times (`10:00 AM`), client names, and status color badges (Confirmed: green, Pending: orange, Cancelled: gray).
   - In-memory period caching prevents redundant backend requests during back-and-forth calendar navigation.
   - Built consultation details modal with `BaseModal` displaying date, start time, estimated duration (45 mins), client profile (name, email, phone), branch, status, remarks, quick Confirm/Cancel action buttons, and direct link to the full record (`/operator/appointments/:id`).
4. **Seamless View Switcher (`OperatorAppointments.jsx`)**:
   - Added view toggle buttons in the toolbar (`Calendar View` / `List View`), allowing operators to switch effortlessly between the calendar interface and the paginated list view.
5. **Component Catalog**:
   - Documented `OperatorAppointmentCalendar` in `component-list.md`.


## [2026-09-27] Bugfix: Client Service Store Request 400 (`Invalid fields in request body`)

### Overview
Fixed HTTP 400 `Invalid fields in request body` error when submitting service intake requests with requirements from the client-side Service Store modal (`ClientServiceRequestModal.jsx`).

### Root Cause
In [`activeServiceRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/activeServiceRoutes.js), `ACTIVE_SERVICE_ALLOWED_FIELDS` whitelist omitted `submittedRequirements` (the client's uploaded documents/inputs) and `source` (e.g. `Client Portal` / `Walk-in`). The strict `allowedFields` middleware rejected the client payload upon submission.

### Fix
- Added `submittedRequirements` and `source` to `ACTIVE_SERVICE_ALLOWED_FIELDS` in [`activeServiceRoutes.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/routes/activeServiceRoutes.js).
- Updated [`activeServiceController.js`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fly-api/src/controllers/activeServiceController.js) `createActiveService` to persist `submittedRequirements` and `source` in the new active service record.
- Restarted backend server daemon on port 5001.

## [2026-09-27] Bugfix: Admin Services ReferenceError (`service is not defined`) in ServiceContent

### Overview
Fixed runtime crash `Uncaught ReferenceError: service is not defined at ServiceContent (ServiceContent.jsx:387:7)` on the Admin Services page (`/admin/services`).

### Root Cause
In [`ServiceContent.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx), the paginated service array from `useFirestorePagination` was destructured as `data: services` (plural). An existing `alertBarProps` `useMemo` block was referencing the legacy variable name `service` (singular), causing a runtime reference error on render.

### Fix
- Updated [`ServiceContent.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/pages/Admin/AdminServices/ServiceContent.jsx) `alertBarProps` to reference `services` (plural) and integrated server-aggregated `counts` (`counts.total`, `counts.disabled`) for accurate notification badges.
- Verified compilation with `npm run build` (vite v8.0.16) — 0 errors.

## [2026-09-27] Bugfix: Admin Quick Links Infinite Re-render & Network Query Loop Stabilization

### Overview
Diagnosed and resolved an issue on the Admin Quick Links page (`/admin/quick-links`) where unmemoized default parameters and closure dependencies in `useFirestorePagination.js` combined with redundant in-component count queries created an infinite re-render loop that flooded Firestore with queries, lagged the browser tab, and crashed the page.

### Root Cause
1. **Unstable Hook Arguments**: Consuming components omitting optional `filters` received `filters = []`, producing a new array reference in memory on every render.
2. **Infinite Effect Triggering**: In `useFirestorePagination.js`, `fetchCount` had `[..., filters]` in its `useCallback` dependency array, and the query effect had `[..., searchFilterFn, filters]`. Each render generated new references, continuously re-executing `getCountFromServer` and tearing down/re-subscribing `onSnapshot` listeners in a rapid loop.
3. **State Mutation Cascade**: Each snapshot and count response triggered `setTotalItems()` and `setData()`, forcing subsequent renders that immediately re-invoked the loop.
4. **Component-Level Redundancy**: `QuickLinksContent.jsx` maintained a duplicate `fetchTotal` `useEffect` running additional `getCountFromServer` calls on mount and render.

### Fixes & Protections Applied
1. **Hook Parameter Stabilization (`useFirestorePagination.js`)**:
   - Defined module-level immutable constant `const EMPTY_FILTERS = []` to prevent fresh reference allocation on default arguments.
   - Decoupled `filters` and `searchFilterFn` from effect dependency arrays using `useRef` (`filtersRef`, `searchFilterFnRef`).
   - Reduced `useEffect` dependency arrays strictly to primitive, stable identifiers (`collectionName`, `filterKey`, `orderByField`, `orderDirection`, `currentPage`, `pageSize`, `realtime`, `enabled`, `searchTerm`).
   - Introduced `unfilteredTotal` state and `unfilteredTotalRef` to preserve total collection count while user searches/filters, cleanly restoring pagination limits when search criteria are cleared.
2. **Consolidated Quick Links Component (`QuickLinksContent.jsx`)**:
   - Removed redundant `fetchTotal` / `totalSystemCount` state and effect; directly utilized `unfilteredTotal` and `totalItems` from `useFirestorePagination`.
   - Wired `refetchCount()` directly into Add, Edit, Delete, and Bulk Delete mutation callbacks for instant counter synchronization.
   - Removed component-internal `TrashIcon` re-declaration, passing static string `icon="fa-solid fa-trash-can"` to `ConfirmationModal`.
   - Removed early blocking loader to allow `PageHeader`, `Breadcrumbs`, `KpiCard` skeletons, and `DataTable` skeletons to render seamlessly in-place.
3. **Verification**:
   - Built frontend bundle via `npm run build` (vite v8.0.16) with 0 errors.
   - Verified backend logs: zero recurring request floods or unhandled network exceptions.

## [2026-09-27] Bugfix: Client Appointment Query Index Fallback & Multi-Tenant Data Isolation

### Overview
Resolved an issue where newly created client appointments were not displaying on the client dashboard, while ensuring strict data isolation prevents cross-client appointment exposure. Remediated missing composite index crashes in the backend query layer, ensured proper environment port loading, and wired optimistic UI synchronization in the client portal.

### Fixes & Protections Applied
1. **Resilient Index Fallback (`firebaseService.js`)**:
   - `queryDatabaseAdvanced`: When Firestore throws `FAILED_PRECONDITION` (Error code 9: Missing Composite Index) on queries combining `where()` filters with `orderBy()`, it now automatically falls back to executing the strict equality filter and performing in-memory sorting. This prevents HTTP 500 crashes and allows client and operator queries to return immediately without index-deployment bottlenecks.
2. **Strict Multi-Tenant Data Isolation (`appointmentController.js`)**:
   - Hardened `getAppointments`: Non-admin and non-operator users are strictly restricted to `where('clientUid', '==', req.user.uid)`. Client callers cannot supply or spoof arbitrary `clientUid` query parameters to view appointments from other clients.
3. **Environment & Server Reliability (`server.js`)**:
   - Configured `dotenv.config({ path: path.resolve(__dirname, '../.env') })` so running the server from either the project root or the `src` folder correctly binds to port `5001`.
4. **Immediate Client-Side Display & Form Synchronization (`ClientAppointmentsPage.jsx`)**:
   - Attached `onAppointmentCreated` to `ClientAppointmentForm`: Newly scheduled appointments are immediately added to local state upon successful submission (filtered by `clientUid === user.uid`) followed by `loadAppointments()`.
   - Added robust array parsing in `loadAppointments` to handle both direct array and nested `{ data }` formats.

## [2026-09-27] Performance: Comprehensive Firestore Bandwidth Optimization, Query-Level Cursor Pagination & Server Aggregations

### Overview
Executed an end-to-end audit and implementation of bandwidth, memory, and Firestore data-fetching optimizations across Fairfly. Completely eliminated client-side collection downloading and memory slicing (`.slice()`) on unconstrained collections across all Operator and Admin portal tables, navigation badges, and detail views. Replaced with true query-level cursor pagination (`limit()`, `orderBy()`, `startAfter()`), server-side aggregations (`getCountFromServer()`, `.count().get()`), bounded queries, and dedicated single-document listeners (`onSnapshot(doc(firestore, col, id))`). Reduced initial payload sizes by >90% and generated an executive-grade 7-page PDF report (`Fairfly_Firestore_Bandwidth_Optimization_Plan.pdf`).

### Optimizations Implemented

1. **Universal Query-Level Cursor Pagination Hook (`useFirestorePagination.js`)**:
   - Created `fair-fly/src/hooks/useFirestorePagination.js` implementing true Firestore query-level pagination with `limit(pageSize)`, `orderBy()`, and cursor management (`startAfter()`).
   - Managed bi-directional page navigation with a stateful cursor stack (`cursorsRef`), ensuring constant `O(pageSize)` memory and network usage regardless of total dataset size.
   - Integrated resilient compound query fallback: catches index errors (`failed-precondition`) when pairing `or()` filters with `orderBy()`, automatically falling back to a bounded query (`limit(150)`) and sorting in memory while composite indexes build.
   - Added bounded search safeguards (`limit(50)`) to protect against wildcard query cost spikes.

2. **Critical Memory & Bandwidth Leak Remediations**:
   - `OperatorServiceProcedure.jsx`: Unwrapped `OperatorProvider targetCollection="activeServices"`; replaced with direct single-doc listener `onSnapshot(doc(firestore, 'activeServices', id))`, preventing whole-collection downloads on procedure inspection.
   - `OperatorDetailPage.jsx`: Scoped active services query with `or(where('operatorId', '==', id), where('branchUid', '==', id))` instead of unbounded collection downloads.
   - `OperatorLayout.jsx` & `AdminLayout.jsx`: Replaced unconstrained collections with `getCountFromServer()` server aggregations and `limit(100)` badge queries.
   - `AdminTickets.jsx`: Eliminated unused background leak where `<AdminProvider targetCollection="tickets">` was streaming the entire tickets collection in real-time even though child views did not consume `useAdminContext()`.
   - `AdminDashboard.jsx`: Bounded real-time audit log subscription modal with `limit(100)`.

3. **Operator Portal Refactoring (100% Query-Level Paginated)**:
   - `OperatorAppointments.jsx` & `AppointmentDetailPage.jsx`: Converted to `useFirestorePagination` with `where('branchUid', '==', user.uid)` and single-doc `onSnapshot(doc(firestore, 'appointments', id))`. Unwrapped `OperatorProvider`.
   - `OperatorQuotations.jsx` & `QuotationDetailPage.jsx`: Converted to `useFirestorePagination` with `where('branchUid', '==', user.uid)` and single-doc `onSnapshot(doc(firestore, 'quotations', id))`. Unwrapped `OperatorProvider`.
   - `OperatorInquiryForms.jsx` & `InquiryFormDetailPage.jsx`: Converted to `useFirestorePagination` with `where('branchUid', '==', user.uid)` and single-doc `onSnapshot(doc(firestore, 'inquiries', id))`. Unwrapped `OperatorProvider`.
   - `OperatorDashboard.jsx`: Refactored to `useFirestorePagination` for `activeServices` scoped to `user.uid`. Unwrapped `OperatorProvider`.
   - `OperatorServices.jsx` & `OperatorServicesContent.jsx`: Unwrapped `AdminProvider targetCollection="services"`. Applied `useFirestorePagination` with scope filtering, `getCountFromServer` for all KPI cards, and connected `DataTable`/`Pagination`.

4. **Admin Portal Refactoring & Real-Time Isolation**:
   - Detail Pages: Replaced whole-collection `.find(s => s.id === id)` across detail pages with direct, dedicated `doc(firestore, collection, id)` listeners:
     - `FranchiseAppDetailPage.jsx` -> `onSnapshot(doc(firestore, 'franchiseApplications', id))`
     - `AdminQualificationDetailPage.jsx` -> removed redundant `useAdminContext()`, kept existing doc listener
     - `ServiceDetailPage.jsx` -> `onSnapshot(doc(firestore, 'services', id))`
     - `OperatorServiceDetailPage.jsx` -> `onSnapshot(doc(firestore, 'services', id))`
     - `AdminInquiryDetailPage.jsx` -> `onSnapshot(doc(firestore, 'inquiries', id))`
   - Table Views converted to `useFirestorePagination` and `getCountFromServer()`:
     - `AdminFranchiseApps.jsx` & `FranchiseContent.jsx`
     - `AdminQualifications.jsx` & `QualificationsContent.jsx`
     - `AdminServices.jsx` & `ServiceContent.jsx`
     - `AdminWorkflowTemplates/index.jsx` & `AdminWorkflowTemplates.jsx`
     - `AdminInquiryHistory.jsx` & `HistoryContent.jsx`
     - `AdminQuickLinks.jsx` & `QuickLinksContent.jsx`

5. **Backend REST Server-Side Pagination**:
   - `clientController.js`: Implemented `page` & `limit` query parameters with `.offset()` / `.limit()` and `.count().get()` server aggregation, returning `{ data, total, page, limit, totalPages }`.
   - `fair-fly/src/services/adminService.js`: Enhanced `fetchClients` to support query params.
   - `ClientsContent.jsx`: Connected to server-side paginated `fetchClients`.
   - `resourceController.js`: Supported `page` and `limit` in `getResources`.
   - `fair-fly/src/services/resourceService.js`: Enhanced `fetchResources` to support query params.
   - `ResourcesContent.jsx` & `OperatorResources.jsx`: Updated to handle paginated `{ data }` and direct array responses.
   - `ticketController.js`: Supported `page` parameter in `getTickets`.
   - `fair-fly/src/services/ticketService.js`: Enhanced `fetchTickets` to support query params.
   - `TicketsContent.jsx`: Handled paginated or array response objects.

6. **Documentation & Formal Audit Report**:
   - Generated 7-page executive PDF report `Fairfly_Firestore_Bandwidth_Optimization_Plan.pdf` detailing the full architecture, audit matrix, network data savings (>90% reduction), and implementation plan.
   - Verified automated security and regression test suite: 26/26 tests passed.

## [2026-09-27] Security: Round 2 Security Audit, Strict Input Whitelisting, Formal PDF Report & Secure Design Guidelines

### Overview
Executed a comprehensive second-round security audit across all 20 backend modules in `fly-api`. Remediated public quotation generation loophole, support ticket spoofing, missing payload whitelisting across remaining endpoints, and hardened announcement routing. Created a permanent agent rule in `.agents/rules/secure-backend-auth-guidelines.md` and compiled an executive-grade 7-page PDF report (`Fairfly_Backend_Security_Audit_Report.pdf`).

### Defenses Implemented in Round 2
1. **Quotation Creation Authentication & RBAC (`quotationRoutes.js`)**:
   - Replaced optional public authentication on `POST /api/quotations` with strict `verifyFirebaseToken`, `requireRole(['admin', 'operator'])`, and `allowedFields(QUOTATION_ALLOWED_FIELDS)`. Clients and unauthenticated callers can no longer inject or forge quotations.
2. **Support Ticket Anti-Spoofing & Role Enforceability (`ticketRoutes.js`, `ticketController.js`)**:
   - Restricted `POST /api/tickets` to authenticated operators and admins with strict `allowedFields`.
   - In `ticketController.createTicket`, blocked client accounts with HTTP 403.
   - In `ticketController.addMessageToThread`, derived sender role, name, and ID strictly from verified token state (`req.userDetails` / `req.user.uid`), eliminating sender role spoofing.
3. **Comprehensive Payload Whitelisting (`allowedFields`)**:
   - `operatorRoutes.js`: Added whitelist to `PATCH /api/operators/:id`.
   - `franchiseRoutes.js`: Added whitelist to `POST /applications` and `PATCH /applications/:id/status`.
   - `resourceRoutes.js`: Added whitelist to `POST /resources` and `PATCH /resources/:id`.
   - `appointmentRoutes.js`: Added whitelist to `POST /appointments` and `PATCH /appointments/:id/status`.
   - `activeServiceRoutes.js`: Added whitelist to `POST /services/active`, `PATCH /:id/step`, and `PATCH /:id/cancel`.
   - `workflowRoutes.js`: Added whitelist to template mutations, instance creation, and step transitions.
   - `chatRoutes.js`: Added whitelist to conversations, messages, and announcements.
4. **Chat Announcement Route-Level RBAC (`chatRoutes.js`)**:
   - Added `requireRole('admin')` directly on `POST /announcements`, `PATCH /announcements/:id`, and `DELETE /announcements/:id`.
5. **New Agent Security Rule (`.agents/rules/secure-backend-auth-guidelines.md`)**:
   - Established mandatory system-wide standards for Zero-Trust backend operations, RBAC, BOLA/IDOR prevention, 5-tier file upload verification (MIME, magic bytes, stored XSS defense), and network security headers.
6. **Executive PDF Audit Report (`Fairfly_Backend_Security_Audit_Report.pdf`)**:
   - Generated detailed 7-page PDF documenting all 20 modules, 65+ endpoints in a full route inventory matrix, penetration test findings, Firestore security rules analysis, and audit certification.
7. **Automated Verification Test Suite (`testSecurityFixes.js`)**:
   - Expanded test suite to 26 automated unit and penetration tests covering Round 1 & Round 2 remediations. Result: **26 Passed, 0 Failed**.

## [2026-09-27] Security: Comprehensive Backend Hardening, BOLA/BFLA Remediation & Penetration Testing

### Overview
Conducted an exhaustive penetration test and security audit across all Express endpoints in `fly-api/src`. Identified and remediated critical privilege escalation flaws, Broken Object Level Authorization (BOLA/IDOR), Broken Function Level Authorization (BFLA), mass assignment vulnerabilities, route shadowing conflicts, and missing HTTP security headers. All 24 security regression and edge-case unit/integration tests passed successfully.

### Vulnerabilities Remediated & Defenses Implemented

1. **Active Services Step Privilege Escalation & Revenue Spoofing (`activeServiceRoutes.js`, `activeServiceController.js`)**:
   - *Issue*: `PATCH /api/services/active/:id/step` lacked `requireRole` and the controller conditional only checked if caller was an operator, allowing client accounts to bypass checks, advance fulfillment steps to completion, and trigger `userRef.update` revenue increments on operator accounts.
   - *Fix*: Added `requireRole(['admin', 'operator', 'branch_operator'])` on the route. Enforced strict role and operator branch assignment verification in `updateStepStatus`.
   - *Cancellation Hardening*: In `cancelActiveService`, non-owner clients are blocked (HTTP 403), and client self-cancellation is restricted strictly to services still in `Pending` state with no steps commenced.

2. **Quotation BOLA / IDOR & Unrestricted Price Alteration (`quotationRoutes.js`, `quotationController.js`)**:
   - *Issue*: Quotation modification, status transitions, and deletion endpoints only required a generic Firebase token, permitting clients or rogue operators to arbitrarily modify pricing (`rate`, `totalAmount`), transition status, or delete quotations.
   - *Fix*: Protected `PATCH /api/quotations/:id`, `PUT /api/quotations/:id`, `PATCH /api/quotations/:id/status`, and `DELETE /api/quotations/:id` with `requireRole(['admin', 'operator'])`. Enforced branch ownership checks in `updateQuotation`, `updateQuotationStatus`, and `deleteQuotation`.
   - *Client Acceptance Validation*: In `POST /api/quotations/:id/accept`, added verification preventing clients from accepting quotations prepared for other clients (`quotation.clientUid !== req.user.uid`).
   - *Mass Assignment Protection*: Added `allowedFields` whitelist to quotation updates and enabled `PUT` method handling to support frontend service caller conventions.

3. **Inquiry BOLA & Mass Assignment Overwrite (`inquiryRoutes.js`, `inquiryController.js`)**:
   - *Issue*: `PATCH /api/inquiries/:id` and `DELETE /api/inquiries/:id` lacked role and ownership checks, and `updateInquiry` merged unvalidated `req.body` directly into Firestore documents.
   - *Fix*: Added `INQUIRY_ALLOWED_FIELDS` whitelist middleware. Added ownership verification in `updateInquiry` (Client owner, Assigned Branch Operator, or Admin only), `deleteInquiry` (Assigned Operator or Admin only), and `getInquiryById` (prevents cross-client data harvesting).

4. **Appointment Status Tampering (`appointmentController.js`)**:
   - *Issue*: `PATCH /api/appointments/:id/status` lacked role restriction, enabling clients to mark their own or others' bookings as `Confirmed`.
   - *Fix*: Enforced that clients may only cancel their own appointment (`status: 'Cancelled'`). Operators and admins alone can confirm or reschedule appointments. Automated branch notification when client cancels.

5. **Operator Support Ticket & Thread Protection (`ticketController.js`)**:
   - *Issue*: `getTickets` and `getTicketById` exposed operational support threads across all operators to any authenticated client or third-party operator.
   - *Fix*: Blocked client accounts from ticket routes (HTTP 403). Scoped operator queries strictly to their own `operatorId`. Blocked unauthorized users from injecting messages into ticket threads.

6. **Workflow Instance Scoping (`workflowController.js`)**:
   - *Issue*: `getInstances` and `getInstanceById` allowed clients to enumerate all internal workflow instances across the company.
   - *Fix*: Automatically scoped client queries to `clientId == req.user.uid` and restricted `getInstanceById` to the instance owner or staff.

7. **Internal Resource Download Protection (`resourceRoutes.js`)**:
   - *Issue*: Internal operator resources and guidelines were readable by client accounts.
   - *Fix*: Attached `requireRole(['admin', 'operator', 'branch_operator'])` to `GET /resources`, `GET /resources/:id`, and `POST /resources/:id/download`.

8. **Service Quicklinks Route Shadowing Defect (`serviceRoutes.js`)**:
   - *Issue*: Express route `GET /services/:id` was declared prior to `/services/quicklinks`, causing Express to treat `quicklinks` as a service ID parameter and returning `404 Not Found`.
   - *Fix*: Reordered all `/quicklinks` route registrations above dynamic `/:id` parameterized handlers.

9. **Broadcast Notification Deletion Integrity (`notificationController.js`)**:
   - *Issue*: When notifications lacked `recipientUid` (e.g. system broadcasts), non-admins could delete them.
   - *Fix*: Enforced that only administrators can modify or delete notifications without a specific `recipientUid`.

10. **HTTP Security Headers & Environment-Scoped CORS (`server.js`)**:
    - Added `X-Content-Type-Options: nosniff` (MIME confusion defense).
    - Added `X-Frame-Options: DENY` (Clickjacking defense).
    - Added `X-XSS-Protection: 1; mode=block`.
    - Added `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
    - Added `Referrer-Policy: strict-origin-when-cross-origin`.
    - Disabled `X-Powered-By: Express` fingerprinting.
    - Scoped CORS to authorized origins (`FRONTEND_URL`, `http://localhost:5173`, `http://localhost:3000`).

11. **Verification Test Suite (`fly-api/src/scripts/testSecurityFixes.js`)**:
    - Created automated verification test suite covering 24 test cases across all 9 security groups. Result: **24 Passed, 0 Failed**.

---

## [2026-09-27] Security: Backend File Upload Hardening & Magic-Byte Validation

### Overview
Conducted a comprehensive security audit on the Express backend (`fly-api`) upload pipeline. Identified and eliminated critical vulnerabilities in file upload handling, transitioning from an easily bypassable 15-extension blacklist to a strict multi-layer whitelist with magic-byte file signature validation, double-extension blocking, script tag sanitization, safe MIME derivation, and upload rate limiting.

### Vulnerabilities Identified During Scan
1. **Blacklist Bypass (`uploadController.js`)**: Previously checked a hardcoded `PROHIBITED_EXTENSIONS` list (`.exe`, `.bat`, etc.). Crucial web shell/script formats (e.g. `.php`, `.jsp`, `.asp`, `.py`, `.cgi`, `.html`, `.svg`) were completely unblocked, allowing arbitrary scripts to be saved to Firebase Storage.
2. **Missing Magic Byte Verification (Extension Spoofing)**: Uploads were validated solely by string extension (`req.file.originalname`). An executable (`MZ` header) or PHP script renamed to `.pdf` or `.png` bypassed all checks and was accepted.
3. **MIME Confusion & Stored XSS**: `req.file.mimetype` was blindly trusted from client request headers and stored directly in Firebase Storage metadata, enabling MIME-type confusion attacks.
4. **Unfiltered Multer Memory Allocation (`uploadRoutes.js`)**: Multer lacked a `fileFilter`, meaning arbitrary files up to 25MB were fully buffered into server RAM before controller logic fired.
5. **Missing Rate Limiting**: `apiRateLimiter` was imported in `uploadRoutes.js` but never attached to the `POST /api/upload` route.
6. **Path Traversal in Target Folder**: `req.body.folder` was accepted without whitelist sanitization.

### Key Changes & Remediations
1. **Dedicated File Security Engine (`fly-api/src/utils/fileSecurity.js`)**:
   - **Strict Whitelist**: Permitted extensions strictly mirror the frontend forms: Documents (`.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`), Images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`), Archives (`.zip`), and Media (`.mp4`, `.webm`, `.mov`).
   - **Magic Bytes Validation**: Added deep buffer inspection verifying actual binary headers (`%PDF-`, `FF D8 FF` JPEG, `89 50 4E 47` PNG, `RIFF...WEBP`, `PK\x03\x04` Office OpenXML/ZIP, `D0 CF 11 E0` OLE Office, `ftyp` MP4/MOV, `1A 45 DF A3` WebM).
   - **Payload Anti-Malware / Anti-Script Heuristics**: Rejects files with executable headers (`MZ`, `\x7FELF`, Mach-O), shell shebangs (`#!`), or embedded script/HTML payloads (`<?php`, `<?=`, `<script`, `<html`, `<!doctype html`, `<svg`, `javascript:`).
   - **Double-Extension Protection**: Identifies and blocks disguise patterns such as `invoice.php.pdf` or `photo.exe.jpg`.
   - **Canonical MIME Mapping**: Automatically assigns verified canonical Content-Types based on genuine file signatures rather than spoofed client headers.
   - **Folder Sanitization**: Restricts target folders to an approved list (`uploads`, `client_ids`, `service_requirements`, `workflow_documents`, `resources`, `announcements`, `inquiry_requirements`, `qualification_documents`, `chat_attachments`).
2. **Multer Early-Rejection Pipeline (`fly-api/src/routes/uploadRoutes.js`)**:
   - Added `fileFilter` to reject unapproved extensions before buffering files into memory.
   - Applied `apiRateLimiter` to protect `/api/upload` from flooding and denial-of-service attempts.
   - Added error-handling wrapper returning structured HTTP 400 responses with descriptive security rejection messages.
3. **Controller Overhaul (`fly-api/src/controllers/uploadController.js`)**:
   - Validates metadata and performs magic-byte buffer verification before bucket write.
   - Generates collision-resistant, sanitized storage destinations using random cryptographic entropy.
   - Saves files to Firebase Storage with verified canonical MIME types.

---

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

---

## [2026-10-02] Support Ticket Data Lean-Out, Dynamic Participant Resolution & Redundancy Removal

### Files Modified
- `fly-api/src/routes/ticketRoutes.js`
- `fly-api/src/controllers/ticketController.js`
- `fair-fly/src/components/Admin/Tickets/CreateTicketModal.jsx`
- `fair-fly/src/pages/Operator/OperatorTickets/OperatorTicketsContent.jsx`
- `fair-fly/src/components/Admin/Tickets/TicketThread.jsx`
- `fair-fly/src/pages/Admin/AdminTickets/TicketsContent.jsx`
- `fair-fly/src/pages/Admin/AdminTickets/admin-tickets.css`

### Summary of Changes
- **Lean Ticket Whitelist**: Updated `TICKET_ALLOWED_FIELDS` to strictly `['title', 'category', 'priority', 'initialMessage', 'operatorId']`, dropping `operatorName` and `operatorEmail`.
- **Server-Side Identity Derivation**: In `ticketController.js`, removed `operatorName` and `operatorEmail` from ticket creation body extraction. Resolved operator branch details dynamically via `userCache` and Firestore lookups.
- **Redundant Message Field Removal**: Stripped redundant `senderName` and `senderRole` from all message items in `ticket.messages` (`initialMessageObj` and `newMessageObj`), persisting only `{ id, senderId, message, createdAt }`.
- **Single Terminal Field (`closedAt`)**: Removed redundant `closedBy` field from ticket documents and controllers, standardizing exclusively on the ISO timestamp `closedAt`.
- **Dynamic In-Memory Participant Resolution**: In `TicketThread.jsx`, introduced an in-memory/React state `participants` map (`{ [uid]: { id, name, role, email } }`). Pre-populated from backend `ticket.participants` (resolved in `getTicketById`) and cached client-side lookups for any unknown sender IDs to avoid repeated Firestore network requests.
- **Backwards-Compatible Thread UI**: Rendered participant names and role badges by matching `msg.senderId` against the cached `participants` map with fallback to existing ticket operator metadata. Updated closed banner to use `closedAt`.
- **Admin Tickets Page Layout Fix**: Removed unstyled wrapper `div`s and restored layout margin spacing between KPI cards and the tickets table.

### Reason
- Fulfill user request to lean out the ticket schema and message array by removing redundant fields (`operatorName`, `operatorEmail`, `senderName`, `senderRole`, `closedBy`) and resolving participants via caching.

### Breaking Changes
- None. Fully backward-compatible with existing ticket records.

---

## [2026-10-02] Service History Client Requirements & Lightbox Attachments Viewer

### Files Modified
- `fair-fly/src/components/Operator/HistoryDetailModal/HistoryDetailModal.jsx`
- `fair-fly/src/components/Operator/HistoryDetailModal/history-detail-modal.css`
- `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx`
- `fair-fly/src/pages/Operator/OperatorHistory/operator-history.css`

### Summary of Changes
- **Client Requirements Integration in History**: Integrated `useSubmittedRequirements` into `HistoryDetailModal.jsx` to dynamically load client-submitted requirements and uploaded documents for completed or cancelled service records (via `submittedRequirementsId` or originating inquiries/quotations fallback).
- **Universal Image Lightbox Linking**: Connected the application's root `useLightbox()` hook in `HistoryDetailModal.jsx`. Image requirement thumbnails and file actions can now be clicked to open high-resolution previews in `ImageLightbox`, supporting keyboard navigation, zoom controls, and gallery browsing across all attachments.
- **Document & Data Support**: Handled non-image documents (e.g. PDF certificates) with clean document cards, file metadata, and secure download links. Handled text and date responses with formatted value cards.
- **Table Requirements Column**: Added a "Client Requirements" column to the Service History table in `OperatorHistory.jsx` with quick action buttons (`<i className="fa-solid fa-paperclip"></i> View Files`) to directly inspect requirements from the history table.

### Reason
- Fulfill user request to display and link client-submitted attachments/requirements at Service History with direct System Lightbox inspection.

### Breaking Changes
- None.

---

## [2026-10-02] Fix React Error #310, Enhance 'View Files' Contrast & Strip Legacy Fallback Bloat

### Files Modified
- `fair-fly/src/components/Operator/HistoryDetailModal/HistoryDetailModal.jsx`
- `fair-fly/src/pages/Operator/OperatorHistory/OperatorHistory.jsx`
- `fair-fly/src/pages/Operator/OperatorHistory/operator-history.css`
- `lessons-learned.md`

### Summary of Changes
- **React Error #310 Resolution**: Resolved the React Hook order mismatch by strictly calling all hooks unconditionally at the top level of `HistoryDetailModal.jsx` and conditionally mounting `<HistoryDetailModal>` in `OperatorHistory.jsx` only when `isModalOpen && selectedRecord` is true, ensuring complete unmounting when closed.
- **Removed Legacy Fallback Bloat**: Stripped obsolete fallback parameter passing and array checking (`submittedRequirements`, `requirements`), querying directly with `useSubmittedRequirements(reqRefId)`. Checked attachments using a clean `if (!submittedDocs || submittedDocs.length === 0)` empty state.
- **Enhanced Button Readability**: Updated `.op-history-table-attach-btn` and its nested text `span` / `i` in `operator-history.css` with `color: #ffffff !important` to ensure crisp white contrast against the purple button background.

### Reason
- Address user report of Minified React error #310 when viewing files in service history, poor button readability on "View Files", and request to remove unnecessary legacy fallback bloat.

### Breaking Changes
- None.

---

## [2026-10-02] HistoryDetailModal Button & Badge Contrast and Readability Fixes

### Files Modified
- `fair-fly/src/components/Operator/HistoryDetailModal/history-detail-modal.css`

### Summary of Changes
- **High-Contrast Count Badge**: Replaced the low-contrast purple-on-purple styling of `.op-history-reqs-count-badge` with a soft lilac background (`var(--purple-light-2, #EEF2FF)`), dark indigo text (`var(--purple-dark, #4338CA)`), bold font weight (`700`), and a subtle border.
- **Lightbox Action Buttons**: Replaced `.op-history-lightbox-action-btn` and `.op-history-gallery-btn` purple-on-purple text with solid brand purple backgrounds (`#5558E3`) and crisp pure white text (`#ffffff !important`) and icons with smooth hover transitions.
- **Document Download Buttons**: Updated `.op-history-doc-download-btn` with a subtle slate border and dark text for clean visibility.

### Reason
- Resolve poor contrast and illegibility on buttons and count badges inside the service history requirements section.

### Breaking Changes
- None.

