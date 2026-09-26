# FairFly Component Catalog & Style Reference (`component-list.md`)

> **Reference Document:** Governed by [`.agents/rules/style-guide-components.md`](file:///c:/Users/Isaac/Downloads/Fair2/.agents/rules/style-guide-components.md).  
> **Mandatory Rule:** When creating or modifying pages and components, consult this document first. Reuse existing components and configure via props instead of creating redundant UI.

---

## Table of Contents
1. [Core UI Design System Primitives (`src/components/UI`)](#1-core-ui-design-system-primitives-srccomponentsui)
   - [DataTable](#datatable)
   - [KpiCard](#kpicard)
   - [PageHeader](#pageheader)
   - [WelcomeHero](#welcomehero)
   - [RecordDetailLayout](#recorddetaillayout)
   - [BaseModal](#basemodal)
   - [SearchBar](#searchbar)
   - [FilterChipGroup](#filterchipgroup)
   - [Pagination](#pagination)
   - [BranchSelectSearch](#branchselectsearch)
   - [Breadcrumbs](#breadcrumbs)
   - [AlertBar](#alertbar)
   - [Toast & ToastProvider](#toast--toastprovider)
   - [Skeleton & Composite Skeletons](#skeleton--composite-skeletons)
   - [ServiceCarouselGallery](#servicecarouselgallery)
   - [ServiceCard](#servicecard)
   - [NotificationBell](#notificationbell)
   - [AppLayout, AppNavbar, AppSidebar](#applayout-appnavbar-appsidebar)
   - [FooterCard & ScrollToTop](#footercard--scrolltotop)
   - [Loading](#loading)
2. [Shared Modals & Feature Dialogs (`src/components/Shared`)](#2-shared-modals--feature-dialogs-srccomponentsshared)
   - [PdfDocumentView](#pdfdocumentview)
   - [ValidIdUpload & ValidIdInfoModal](#valididupload--valididinfomodal)
   - [ServiceDetailModal](#servicedetailmodal)
   - [AnnouncementsModal](#announcementsmodal)
   - [NewChatModal & TeamChatModal](#newchatmodal--teamchatmodal)
   - [TermsPrivacyModal](#termsprivacymodal)
   - [FranchiseApplicationForm](#franchiseapplicationform)
   - [Chatbot](#chatbot)
3. [Admin Feature Components & Modals (`src/components/Admin`)](#3-admin-feature-components--modals-srccomponentsadmin)
   - [ConfirmationModal](#confirmationmodal)
   - [AdminLogsModal](#adminlogsmodal)
   - [AdminModal & AdminForm](#adminmodal--adminform)
   - [OperatorModal & OperatorForm](#operatormodal--operatorform)
   - [ClientEditModal & ClientEditForm](#clienteditmodal--clienteditform)
   - [ServiceModal & ServiceForm](#servicemodal--serviceform)
   - [WorkflowModal & WorkflowForm](#workflowmodal--workflowform)
   - [ServiceRequirementsModal](#servicerequirementsmodal)
   - [ServiceWorkflowsModal](#serviceworkflowsmodal)
   - [QuickLinkModal & QuickLinkForm](#quicklinkmodal--quicklinkform)
   - [ResourceModal & ResourceForm](#resourcemodal--resourceform)
   - [RejectClientModal](#rejectclientmodal)
   - [IdPreviewModal](#idpreviewmodal)
   - [ApplicationModal](#applicationmodal)
   - [InquiryFormBuilderModal](#inquiryformbuildermodal)
   - [TicketTable, TicketThread, CreateTicketModal](#tickettable-ticketthread-createticketmodal)
   - [FranchiseeCard & Loader](#franchiseecard--loader)
4. [Client Feature Components (`src/components/Client`)](#4-client-feature-components-srccomponentsclient)
   - [ClientServicesMarketplace](#clientservicesmarketplace)
   - [ClientServiceTracker & Steps](#clientservicetracker--steps)
   - [ClientAppointmentForm](#clientappointmentform)
   - [ClientInquiryModal](#clientinquirymodal)
   - [ClientServiceRequestModal](#clientservicerequestmodal)
5. [Operator Feature Components (`src/components/Operator`)](#5-operator-feature-components-srccomponentsoperator)
   - [CreateQuotationModal](#createquotationmodal)
   - [CreateInquiryFormModal](#createinquiryformmodal)
   - [ServiceWorkflowModal](#serviceworkflowmodal)
   - [QualificationApplicationModal](#qualificationapplicationmodal)
   - [AddServiceModal](#addservicemodal)

---

## 1. Core UI Design System Primitives (`src/components/UI`)

### `DataTable`
- **Location:** [`src/components/UI/DataTable/DataTable.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/DataTable/DataTable.jsx)
- **Functionality:** High-performance, accessible data table supporting dynamic columns, cell formatters, row selection (single & select all with indeterminate state), bulk actions (Enable, Disable, Delete, or custom), loading skeleton rows, and customizable empty states.
- **Appropriate Use:** Any tabular data list (operators, clients, services, inquiries, quotations, applications, logs).
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `columns` | `Array<Object>` | `[]` | Yes | Column configs: `{ key, header, render?, className?, headerClassName? }` |
  | `data` | `Array<Object>` | `[]` | Yes | Array of record objects |
  | `keyField` | `string` | `'id'` | No | Unique ID property key on each row |
  | `selectable` | `boolean` | `false` | No | Enables checkboxes and bulk selection |
  | `selectedIds` | `Array<string>` | `[]` | No | Controlled array of selected item IDs |
  | `onSelectionChange` | `Function` | `undefined` | No | Callback `(newSelectedIds) => void` |
  | `onBulkDelete` | `Function` | `undefined` | No | Callback when Bulk Delete clicked: `(selectedIds) => void` |
  | `onBulkEnable` | `Function` | `undefined` | No | Callback when Bulk Enable clicked: `(selectedIds) => void` |
  | `onBulkDisable` | `Function` | `undefined` | No | Callback when Bulk Disable clicked: `(selectedIds) => void` |
  | `bulkActions` | `Array<Object>` | `[]` | No | Custom bulk buttons: `[{ label, icon, variant, onClick }]` |
  | `emptyState` | `ReactNode \| Object` | `null` | No | Custom empty node or `{ icon: string, message: string }` |
  | `isLoading` / `loading` | `boolean` | `false` | No | Renders `<SkeletonTable />` when true |
  | `disabled` | `boolean` | `false` | No | Disables checkboxes & bulk buttons during network requests |
  | `rowClassName` | `string \| Function` | `undefined` | No | Custom class string or `(row, index) => string` |
- **Example:**
  ```jsx
  <DataTable
    columns={[
      { key: 'name', header: 'Operator', render: (row) => <strong>{row.name}</strong> },
      { key: 'email', header: 'Email' },
      { key: 'status', header: 'Status', render: (row) => <span className={`badge ${row.status.toLowerCase()}`}>{row.status}</span> }
    ]}
    data={operators}
    selectable
    selectedIds={selectedIds}
    onSelectionChange={setSelectedIds}
    onBulkDelete={handleBulkDelete}
    isLoading={loading}
  />
  ```

---

### `KpiCard`
- **Location:** [`src/components/UI/KpiCard/KpiCard.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/KpiCard/KpiCard.jsx)
- **Functionality:** Standardized metric/statistic card featuring title, large metric value, secondary descriptor, tinted icon bubble, optional pill badge, trend arrow indicator, and built-in skeleton loading state.
- **Appropriate Use:** Top of dashboards, analytical summaries, performance overviews. Do NOT turn small ordinary text items into KPI cards.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `title` | `string` | — | Yes | Card heading label (e.g. "Total Revenue") |
  | `value` | `string \| number` | — | Yes | Primary metric figure (e.g. "₱142,500.00" or `42`) |
  | `detail` | `string` | `undefined` | No | Explanatory subtitle below the metric |
  | `icon` | `string` | `undefined` | No | FontAwesome icon class (e.g. `"fa-solid fa-peso-sign"`) |
  | `iconColor` | `string` | `'#374151'` | No | Hex / CSS color for the icon and subtle bubble tint |
  | `badge` | `string` | `undefined` | No | Optional status pill (e.g. "3 High Priority") |
  | `badgeType` | `'ok'\|'warn'\|'error'\|'info'\|'neutral'` | `'neutral'` | No | Badge color scheme |
  | `trend` | `{ label: string, direction: 'up'\|'down'\|'neutral' }` | `undefined` | No | Growth or contraction indicator |
  | `isLoading` / `loading` | `boolean` | `false` | No | Displays animated shimmer skeleton if true |
- **Example:**
  ```jsx
  <KpiCard
    title="Total Revenue"
    value="₱385,400.00"
    detail="Selected period totals"
    icon="fa-solid fa-peso-sign"
    iconColor="var(--complete-green-dark)"
    isLoading={loading}
  />
  ```

---

### `PageHeader`
- **Location:** [`src/components/UI/PageHeader/PageHeader.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/PageHeader/PageHeader.jsx)
- **Functionality:** Semantic page title banner with structured typography, optional right-aligned primary call-to-action button, optional right-side travel illustration/graphic, and slot for search/filter controls.
- **Appropriate Use:** Header section on main portal pages (Clients, Operators, Services, Applications, Resources).
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `title` | `string` | — | Yes | Main page `<h1>` title |
  | `subtitle` | `string` | `undefined` | No | Descriptive subtitle underneath title |
  | `primaryAction` | `Object` | `undefined` | No | `{ label: string, icon?: string, onClick: Function }` |
  | `illustrationSrc` | `string` | `undefined` | No | Path to header travel illustration |
  | `children` | `ReactNode` | `undefined` | No | Nested controls (e.g. `<SearchBar />`, filters) |
- **Example:**
  ```jsx
  <PageHeader
    title="Branch Operators"
    subtitle="Manage authorized franchisee operators and branches"
    primaryAction={{ label: 'New Operator', icon: 'fa-solid fa-plus', onClick: () => setIsModalOpen(true) }}
  />
  ```

---

### `WelcomeHero`
- **Location:** [`src/components/UI/WelcomeHero/WelcomeHero.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/WelcomeHero/WelcomeHero.jsx)
- **Functionality:** Top-of-dashboard welcome card with contextual greeting (`Welcome back, {userName}!`), calendar date header, subtitle, and brand illustration with eager loading.
- **Appropriate Use:** Top row on Admin, Operator, and Client dashboards.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `userName` | `string` | `'User'` | No | Logged-in user's display name or email |
  | `subtitle` | `string` | `undefined` | No | Short helpful operational summary |
  | `illustrationSrc` | `string` | `undefined` | No | Artwork asset path |
  | `dateDisplay` | `string` | Current date | No | Custom date string override |

---

### `RecordDetailLayout`
- **Location:** [`src/components/UI/RecordDetailLayout/RecordDetailLayout.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/RecordDetailLayout/RecordDetailLayout.jsx)
- **Functionality:** Standardized single-record inspection layout. Handles loading skeletons, 404/not found states, breadcrumbs, back button, record title/subtitle, status badges, and action buttons header.
- **Appropriate Use:** Any detail page (e.g. `/admin/operators/:id`, `/admin/clients/:id`, `/admin/services/:id`).
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `title` | `string` | — | Yes | Record name or heading |
  | `subtitle` | `string` | `undefined` | No | Record ID, email, or metadata |
  | `status` | `string` | `undefined` | No | Status badge label (e.g. "Active") |
  | `statusType` | `'success'\|'warning'\|'danger'\|'info'\|'neutral'` | `undefined` | No | Status color theme |
  | `breadcrumbs` | `Array<{ label: string, to?: string }>` | `[]` | No | Breadcrumb items trail |
  | `backTo` | `string` | `undefined` | No | Link path for the Back button |
  | `backLabel` | `string` | `'Back'` | No | Label for Back button |
  | `actions` | `Array<Object>` | `[]` | No | Buttons array: `[{ label, icon, onClick, className, disabled }]` |
  | `thumbnail` | `string \| ReactNode` | `undefined` | No | Image URL or thumbnail element |
  | `avatarIcon` | `string` | `undefined` | No | Fallback FontAwesome icon class |
  | `isLoading` | `boolean` | `false` | No | Renders comprehensive detail skeleton |
  | `isNotFound` | `boolean` | `false` | No | Renders friendly Not Found screen |
  | `notFoundMessage` | `string` | — | No | Custom not found message |
  | `children` | `ReactNode` | — | Yes | Content panels, cards, and data tabs |

---

### `BaseModal`
- **Location:** [`src/components/UI/ModalBase/BaseModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ModalBase/BaseModal.jsx)
- **Functionality:** Accessible modal container built on React `createPortal`. Supports backdrop click to close, ESC key listener, body scroll lock, customizable sizes (`'small'`, `'medium'`, `'large'`, `'xl'`), explicit `maxWidth` / `width`, header with title/subtitle and close button, and both controlled (`isOpen`, `onClose`) or ref-based imperative control (`ref.current.openModal(data)`).
- **Appropriate Use:** Base wrapper for all application modals. Never write ad-hoc modal overlays from scratch.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `isOpen` | `boolean` | `undefined` | No | Controlled visibility state |
  | `onClose` | `Function` | `undefined` | No | Callback when modal closes |
  | `onOpen` | `Function` | `undefined` | No | Callback when modal opens `(data) => void` |
  | `title` | `string \| ReactNode` | `undefined` | No | Modal title |
  | `subtitle` | `string \| ReactNode` | `undefined` | No | Modal descriptive subtitle |
  | `size` | `'small'\|'medium'\|'large'\|'xl'` | `undefined` | No | Preset sizing scale |
  | `maxWidth` / `width` | `string` | `undefined` | No | Custom CSS width dimensions |
  | `isLoading` | `boolean` | `false` | No | Disables backdrop click & close button during submit |
  | `children` | `ReactNode \| Function` | — | Yes | Modal content or render function `({ closeModal, data }) => JSX` |

---

### `SearchBar`
- **Location:** [`src/components/UI/SearchBar/SearchBar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/SearchBar/SearchBar.jsx)
- **Functionality:** Universal search input with magnifying glass icon, built-in optional 300ms debounce, clear button (`x`), and instant state update.
- **Appropriate Use:** Search controls above tables, catalogs, and modal lists.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `searchQuery` | `string` | `''` | Yes | Controlled search query string |
  | `setSearchQuery` | `Function` | — | Yes | State setter `(query) => void` |
  | `debounceSearch` | `boolean` | `false` | No | Enables 300ms debouncing |
  | `placeholder` | `string` | `'Search...'` | No | Placeholder text |
  | `onClear` | `Function` | `undefined` | No | Callback when `x` button is clicked |
  | `className` | `string` | `''` | No | Extra CSS container class |

---

### `FilterChipGroup`
- **Location:** [`src/components/UI/FilterChipGroup/FilterChipGroup.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/FilterChipGroup/FilterChipGroup.jsx)
- **Functionality:** Horizontal filter chips list with active state highlighting, counts badges (e.g. `All (12)`), and flexible prop aliases for backward compatibility.
- **Appropriate Use:** Category filters, status tabs, priority filters.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `chips` | `Array<string \| { value, label, count? }>` | `[]` | Yes | List of chip strings or objects |
  | `activeChip` / `activeValue` | `string` | `''` | No | Selected chip identifier |
  | `onChipChange` / `onChange` | `Function` | — | Yes | Callback `(val) => void` |
  | `className` | `string` | `''` | No | Custom container class |

---

### `Pagination`
- **Location:** [`src/components/UI/Pagination/Pagination.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/Pagination/Pagination.jsx)
- **Functionality:** Accessible pagination bar showing "Showing X–Y of Z entries", previous/next arrows, ellipsis handling for large page numbers, and optional items-per-page dropdown selector. Returns `null` if `totalItems === 0`.
- **Appropriate Use:** Beneath any paginated table or grid.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `currentPage` | `number` | `1` | Yes | Active page index (1-based) |
  | `totalItems` | `number` | `0` | Yes | Total count of records |
  | `pageSize` | `number` | `8` | No | Records per page |
  | `onPageChange` | `Function` | — | Yes | Callback `(pageNumber) => void` |
  | `onPageSizeChange` | `Function` | `undefined` | No | Optional callback `(newSize) => void` |
  | `pageSizeOptions` | `number[]` | `[5, 8, 15, 25]` | No | Available page size choices |

---

### `BranchSelectSearch`
- **Location:** [`src/components/UI/BranchSelectSearch/BranchSelectSearch.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/BranchSelectSearch/BranchSelectSearch.jsx)
- **Functionality:** Reusable, debounced (300ms) searchable dropdown for selecting an authorized FairFly branch operator. Features search by branch name, address, or email, clear button, click-outside detection, keyboard navigation, and selected state banner.
- **Appropriate Use:** Client inquiry forms, service booking requests, appointment scheduling.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `branches` | `Array<Object>` | `[]` | Yes | Array of branch objects `{ uid, branchName, address, email }` |
  | `selectedBranchUid` | `string` | `''` | Yes | Currently selected branch ID |
  | `onSelectBranch` | `Function` | — | Yes | Callback `(branchUid, branchObj) => void` |
  | `isLoading` | `boolean` | `false` | No | Displays loading spinner |
  | `label` | `string` | `'Preferred Processing Branch'` | No | Field label |
  | `required` | `boolean` | `false` | No | Renders required red asterisk |
  | `placeholder` | `string` | `'Search branch by name, city or location...'` | No | Search box placeholder |

---

### `Breadcrumbs`
- **Location:** [`src/components/UI/Breadcrumbs/Breadcrumbs.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/Breadcrumbs/Breadcrumbs.jsx)
- **Functionality:** Accessible `<nav aria-label="Breadcrumb">` trail with clickable router links and separator chevrons.
- **Appropriate Use:** Top of detail views, multi-step wizards, or sub-pages.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `items` | `Array<{ label: string, to?: string }>` | `[]` | Yes | Breadcrumb items (last item is active) |

---

### `AlertBar`
- **Location:** [`src/components/UI/AlertBar/AlertBar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AlertBar/AlertBar.jsx)
- **Functionality:** Inline alert message banner with icon and color theme.
- **Appropriate Use:** Inline error alerts, warnings, and informational notices on forms and detail cards.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `message` | `string` | — | Yes | Alert message text |
  | `type` | `'info'\|'success'\|'warning'\|'error'` | `'info'` | No | Visual variant |

---

### `Toast & ToastProvider`
- **Location:** [`src/components/UI/toast/ToastProvider.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/toast/ToastProvider.jsx), [`Toast.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/toast/Toast.jsx)
- **Functionality:** Context-driven notification toast system. Auto-dismisses after 5 seconds with exit animation. Exported via `useToast()` hook with `addToast(message, type)` and `removeToast(id)`.
- **Appropriate Use:** Feedback for async actions (success, failure, validation warnings).
- **Usage:**
  ```jsx
  const { addToast } = useToast();
  addToast('Operator updated successfully!', 'success');
  addToast('Unable to complete request.', 'error');
  ```

---

### `Skeleton & Composite Skeletons`
- **Location:** [`src/components/UI/Skeleton/Skeleton.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/Skeleton/Skeleton.jsx)
- **Functionality:** Suite of shimmer loading placeholders:
  - `Skeleton`: Primitive with variants (`'text'`, `'title'`, `'circle'`, `'rect'`, `'button'`, `'badge'`).
  - `SkeletonTable`: Tabular skeleton with configurable `columns`, `rows`, and `selectable` checkboxes.
  - `SkeletonCard`: Card listing placeholder with optional avatar, customizable text line count.
  - `SkeletonKpi`: Metric card skeleton.
  - `SkeletonAnnouncement`: Social feed card placeholder.
- **Appropriate Use:** Any component or table waiting for network data.

---

### `ServiceCarouselGallery`
- **Location:** [`src/components/UI/ServiceCarouselGallery/ServiceCarouselGallery.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ServiceCarouselGallery/ServiceCarouselGallery.jsx)
- **Functionality:** Photo gallery for service packages. Combines cover photo and carousel images into a deduplicated gallery, featuring main preview stage, prev/next arrows, counter, thumbnail strip, zoom badge, and full-screen lightbox modal with ESC and arrow key navigation.
- **Appropriate Use:** Service detail pages, client service previews.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `service` | `Object` | — | Yes | Service object with `coverImage`, `carouselImages`, `category`, `name` |

---

### `ServiceCard`
- **Location:** [`src/components/UI/ServiceCard/ServiceCard.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ServiceCard/ServiceCard.jsx)
- **Functionality:** Simple feature/service card with colored icon wrapper, title, and description.
- **Appropriate Use:** Marketing pages and landing page service overview.
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `icon` | `ReactNode` | — | Yes | Icon element |
  | `iconBg` | `string` | — | No | Background color for icon wrapper |
  | `title` | `string` | — | Yes | Card title |
  | `desc` | `string` | — | Yes | Descriptive text |

---

### `NotificationBell`
- **Location:** [`src/components/UI/NotificationBell/NotificationBell.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/NotificationBell/NotificationBell.jsx)
- **Functionality:** Real-time notification trigger with badge counter, popover dropdown menu, unread filters, relative timestamp formatting (`5m ago`, `Yesterday`), delete-on-read Firestore integration, and navigation link routing.
- **Appropriate Use:** Top navigation navbar in Admin, Operator, and Client portals.

---

### `AppLayout, AppNavbar, AppSidebar`
- **Location:** [`src/components/UI/AppLayout/AppLayout.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppLayout/AppLayout.jsx), [`AppNavbar/AppNavbar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppNavbar/AppNavbar.jsx), [`AppSidebar/AppSidebar.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/AppSidebar/AppSidebar.jsx)
- **Functionality:** Core SaaS portal layout system:
  - `AppLayout`: Shell wrapping sidebar, top navbar, mobile hamburger toggle, optional stat cards header, and main page content.
  - `AppNavbar`: Top navigation bar with user profile, portal name, notification bell, and logout confirmation dialog.
  - `AppSidebar`: Left navigation drawer with brand logo, route links, dynamic tab notification badges, role title, and mobile drawer transitions.

---

### `FooterCard & ScrollToTop`
- **Location:** [`src/components/UI/FooterCard/FooterCard.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/FooterCard/FooterCard.jsx), [`ScrollToTop/ScrollToTop.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/ScrollToTop/ScrollToTop.jsx)
- **Functionality:**
  - `FooterCard`: Call-to-action banner ("Ready to Start Your Journey with Fairfly?") with link to `/register`.
  - `ScrollToTop`: Route-change watcher resetting browser window scroll position to `(0, 0)`.

---

### `Loading`
- **Location:** [`src/components/UI/Loading/Loading.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/UI/Loading/Loading.jsx)
- **Functionality:** Root application skeleton layout displayed while initial user authentication is resolving.

---

## 2. Shared Modals & Feature Dialogs (`src/components/Shared`)

### `PdfDocumentView`
- **Location:** [`src/components/Shared/PdfDocument/PdfDocumentView.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/PdfDocument/PdfDocumentView.jsx)
- **Functionality:** High-fidelity printable document viewer and PDF exporter (using `html2pdf.js`). Renders official FairFly documents:
  - Standard Inquiry Form (`SAF-01-002`)
  - Formal Price Quotation
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `isOpen` | `boolean` | — | Yes | Modal visibility |
  | `onClose` | `Function` | — | Yes | Close callback |
  | `type` | `'quotation'\|'inquiry'` | `'quotation'` | No | Document template type |
  | `data` | `Object` | — | Yes | Inquiry or quotation payload |

---

### `ValidIdUpload & ValidIdInfoModal`
- **Location:** [`src/components/Shared/ValidIdUpload/ValidIdUpload.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/ValidIdUpload/ValidIdUpload.jsx), [`ValidIdInfoModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/ValidIdInfoModal/ValidIdInfoModal.jsx)
- **Functionality:**
  - `ValidIdUpload`: Dual-side ID document uploader (Front and Back) with format verification (JPEG, PNG, WEBP, PDF, max 15MB), image preview, removal actions, and launcher for guidelines modal.
  - `ValidIdInfoModal`: Guide explaining recognized Philippine government IDs and submission requirements.
- **Props (`ValidIdUpload`):**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `idType` | `string` | `''` | Yes | Selected government ID type name |
  | `onChangeIdType` | `Function` | — | Yes | `(newType) => void` |
  | `idFront` | `Object` | `null` | No | Front image payload `{ file, previewUrl, url, name }` |
  | `idBack` | `Object` | `null` | No | Back image payload `{ file, previewUrl, url, name }` |
  | `onUploadFront` / `onUploadBack` | `Function` | — | Yes | File upload handlers |
  | `onRemoveFront` / `onRemoveBack` | `Function` | — | Yes | Remove handlers |
  | `disabled` | `boolean` | `false` | No | Disables inputs |
  | `error` | `string` | `null` | No | Validation error message |

---

### `ServiceDetailModal`
- **Location:** [`src/components/Shared/Services/ServiceDetailModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Services/ServiceDetailModal.jsx)
- **Functionality:** E-commerce/travel style modal displaying comprehensive service details: cover photo, category badge, description, required documents checklist, turnaround time, formatted price, and "Book Service" CTA.
- **Props:** `{ isOpen, onClose, service, onAvailService }`

---

### `AnnouncementsModal`
- **Location:** [`src/components/Shared/AnnouncementsModal/AnnouncementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/AnnouncementsModal/AnnouncementsModal.jsx)
- **Functionality:** Feed of Head Office broadcast announcements. For Admins, includes a broadcast creation form (`title`, `content`, `priority`).
- **Props:** `{ isOpen, onClose }`

---

### `NewChatModal & TeamChatModal`
- **Location:** [`src/components/Shared/Messaging/NewChatModal/NewChatModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Messaging/NewChatModal/NewChatModal.jsx), [`TeamChatModal/TeamChatModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/TeamChatModal/TeamChatModal.jsx)
- **Functionality:**
  - `NewChatModal`: Contact selector for starting new conversations. Debounces search and prioritizes assigned operators for admins.
  - `TeamChatModal`: Real-time group messaging modal for internal team communications.
- **Props (`NewChatModal`):** `{ isOpen, onClose, onSelectContact, currentUserRole }`

---

### `TermsPrivacyModal`
- **Location:** [`src/components/Shared/TermsPrivacyModal/TermsPrivacyModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/TermsPrivacyModal/TermsPrivacyModal.jsx)
- **Functionality:** Tabbed modal displaying FairFly's Terms of Service and Privacy Policy.
- **Props:** `{ isOpen, onClose, initialTab = 'terms' }`

---

### `FranchiseApplicationForm`
- **Location:** [`src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx)
- **Functionality:** Intake modal for prospective franchisee applications (contact info, preferred location, investment capacity, meeting schedule).
- **Props:** `{ isOpen, onClose }`

---

### `Chatbot`
- **Location:** [`src/components/Shared/Chatbot/Chatbot.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Shared/Chatbot/Chatbot.jsx)
- **Functionality:** Floating Gemini AI assistant on the public landing and client portal. Dynamically loads live services catalog and FAQs to answer customer inquiries.

---

## 3. Admin Feature Components & Modals (`src/components/Admin`)

### `ConfirmationModal`
- **Location:** [`src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ConfirmationModal/ConfirmationModal.jsx)
- **Functionality:** Compact dialog for confirming destructive or critical actions (deleting records, activating/deactivating accounts, rejecting applications).
- **Props:**
  | Prop | Type | Default | Required | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `isOpen` | `boolean` | — | Yes | Modal visibility |
  | `onClose` | `Function` | — | Yes | Close handler |
  | `title` | `string` | — | Yes | Dialog title |
  | `message` / `desc` | `string` | — | Yes | Explanation or warning text |
  | `icon` | `string` | `undefined` | No | FontAwesome icon class |
  | `onConfirm` | `Function` | — | Yes | Async confirm callback |
  | `confirmText` | `string` | `'Confirm'` | No | Button label |
  | `cancelText` | `string` | `'Cancel'` | No | Cancel label |
  | `isDanger` | `boolean` | `false` | No | Red styling for destructive actions |
  | `isLoading` | `boolean` | `false` | No | Displays spinner and disables buttons |

---

### `AdminLogsModal`
- **Location:** [`src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/AdminLogsModal/AdminLogsModal.jsx)
- **Functionality:** Audit trail viewer with search by admin/resource, action filter chips, pagination, and text export.
- **Props:** `{ isOpen, onClose, allLogs, allLogsLoading, onExportLogs }`

---

### `AdminModal & AdminForm`
- **Location:** [`src/components/Admin/Modals/AdminModal/AdminModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/AdminModal/AdminModal.jsx)
- **Functionality:** Create and edit support administrator accounts with branch assignments.
- **Props:** `{ isOpen, onClose, editingAdmin, onSubmit, isLoading }`

---

### `OperatorModal & OperatorForm`
- **Location:** [`src/components/Admin/Modals/OperatorModal/OperatorModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/OperatorModal/OperatorModal.jsx)
- **Functionality:** Create and edit branch operator accounts (branch name, address, contact, email, status). Supports both controlled props and ref `openModal(operator)`.
- **Props:** `{ isOpen, onClose, editingOperator, onSubmit, isLoading }`

---

### `ClientEditModal & ClientEditForm`
- **Location:** [`src/components/Admin/Modals/ClientEditModal/ClientEditModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ClientEditModal/ClientEditModal.jsx)
- **Functionality:** Modal to update client profile, contact info, and status.
- **Props:** `{ isOpen, onClose, editingClient, onSubmit, isLoading }`

---

### `ServiceModal & ServiceForm`
- **Location:** [`src/components/Admin/Modals/ServiceModal/ServiceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceModal/ServiceModal.jsx)
- **Functionality:** Create and edit services in the main catalog (name, category, price, turnaround time, cover photo, carousel images).
- **Props:** `{ isOpen, onClose, editingService, onSubmit, isLoading }`

---

### `WorkflowModal & WorkflowForm`
- **Location:** [`src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/WorkflowModal/WorkflowModal.jsx)
- **Functionality:** Create and edit multi-step workflow templates with reorderable steps, attached links, and reference documents.
- **Props:** `{ isOpen, onClose, editingTemplate, initialData, onSubmit, isLoading }`

---

### `ServiceRequirementsModal`
- **Location:** [`src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceRequirementsModal/ServiceRequirementsModal.jsx)
- **Functionality:** Dedicated builder for configuring required documents on a service (input types: file, image, text, date; attachment links; file security validation against executables).
- **Props:** `{ isOpen, onClose, initialRequirements, onSaveRequirements }`

---

### `ServiceWorkflowsModal`
- **Location:** [`src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ServiceWorkflowsModal/ServiceWorkflowsModal.jsx)
- **Functionality:** Attach workflow templates to a service with live Firestore search and instant workflow creation.
- **Props:** `{ isOpen, onClose, initialWorkflowIds, onSaveWorkflows }`

---

### `QuickLinkModal & QuickLinkForm`
- **Location:** [`src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/QuickLinkModal/QuickLinkModal.jsx)
- **Functionality:** Manage external portal quick links (title, URL, description, category).
- **Props:** `{ isOpen, onClose, editingLink, initialData, onSubmit, isLoading }`

---

### `ResourceModal & ResourceForm`
- **Location:** [`src/components/Admin/Modals/ResourceModal/ResourceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ResourceModal/ResourceModal.jsx)
- **Functionality:** Upload and manage reference documents and operator materials.
- **Props:** `{ onSubmit, isLoading, initialData }` (Ref-based control)

---

### `RejectClientModal`
- **Location:** [`src/components/Admin/Modals/RejectClientModal/RejectClientModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/RejectClientModal/RejectClientModal.jsx)
- **Functionality:** Dialog with preset rejection reasons for invalid government ID submissions.
- **Props:** `{ isOpen, onClose, client, onConfirmReject, isLoading }`

---

### `IdPreviewModal`
- **Location:** [`src/components/Admin/Modals/IdPreviewModal/IdPreviewModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/IdPreviewModal/IdPreviewModal.jsx)
- **Functionality:** High-resolution zoom inspection view for submitted client IDs.
- **Props:** `{ isOpen, onClose, imageUrl, title, side, idType }`

---

### `ApplicationModal`
- **Location:** [`src/components/Admin/Modals/ApplicationModal/ApplicationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/ApplicationModal/ApplicationModal.jsx)
- **Functionality:** Full application inspector for prospective franchisees with Approve and Reject actions.
- **Props:** `{ handleApprove, handleReject, isLoading, showButtons }` (Controlled via ref)

---

### `InquiryFormBuilderModal`
- **Location:** [`src/components/Admin/Modals/InquiryFormBuilderModal/InquiryFormBuilderModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Modals/InquiryFormBuilderModal/InquiryFormBuilderModal.jsx)
- **Functionality:** Schema builder allowing admins to configure custom intake fields on inquiry forms.
- **Props:** `{ isOpen, onClose }`

---

### `TicketTable, TicketThread, CreateTicketModal`
- **Location:** [`src/components/Admin/Tickets/`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Tickets/)
- **Functionality:**
  - `TicketTable`: Standardized DataTable rendering of open/closed support tickets.
  - `TicketThread`: Real-time chat forum for ticket resolution, reopening, and closing.
  - `CreateTicketModal`: Dialog for raising new support tickets.
- **Props (`TicketTable`):** `{ tickets, loading, onViewThread, onStatusChange, onCloseTicket, disabled }`
- **Props (`TicketThread`):** `{ ticket, onBack, onSendMessage, onCloseForum, onStatusChange, isLoading }`

---

### `FranchiseeCard & Loader`
- **Location:** [`src/components/Admin/FranchiseeApplication/FranchiseeCard.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/FranchiseeApplication/FranchiseeCard.jsx), [`Loader/Loader.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Admin/Loader/Loader.jsx)
- **Functionality:**
  - `FranchiseeCard`: Card view for reviewing prospective franchise applications.
  - `Loader`: Simple admin panel skeleton container with optional status text.

---

## 4. Client Feature Components (`src/components/Client`)

### `ClientServicesMarketplace`
- **Location:** [`src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServicesMarketplace/ClientServicesMarketplace.jsx)
- **Functionality:** Complete client travel services store with debounced search, category filters, branch filters, price tier filtering, sorting, grid/list view toggle, and progressive loading.
- **Props:** `{ services, loading, onRequestService }`

---

### `ClientServiceTracker & Steps`
- **Location:** [`src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceTracker/ClientServiceTracker.jsx), [`Steps/Steps.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceTracker/Steps/Steps.jsx)
- **Functionality:** Live order progress tracker for clients. Shows step-by-step procedure checklist, current stage status, progress bar percentage, and branch details.
- **Props:** `{ service }`

---

### `ClientAppointmentForm`
- **Location:** [`src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientAppointmentForm/ClientAppointmentForm.jsx)
- **Functionality:** Appointment scheduling modal with branch picker, date/time pickers, and prefilled user profile.
- **Props:** `{ isOpen, onClose, onAppointmentCreated, lockedBranchUid, lockedBranchName, initialServiceType }`

---

### `ClientInquiryModal`
- **Location:** [`src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientInquiryModal/ClientInquiryModal.jsx)
- **Functionality:** Intake modal adhering to official FairFly `SAF-01-002` inquiry structure. Includes branch selection via `BranchSelectSearch`.
- **Props:** `{ isOpen, onClose, onInquirySubmitted }`

---

### `ClientServiceRequestModal`
- **Location:** [`src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Client/ClientServiceRequestModal/ClientServiceRequestModal.jsx)
- **Functionality:** Service checkout modal that dynamically renders required document upload fields according to the selected service's requirements.
- **Props:** `{ isOpen, onClose, onRequestSuccess, initialServiceId, lockedBranchUid, lockedBranchName }`

---

## 5. Operator Feature Components (`src/components/Operator`)

### `CreateQuotationModal`
- **Location:** [`src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateQuotationModal/CreateQuotationModal.jsx)
- **Functionality:** Price quotation builder for operators. Prefills from client inquiries, allows custom inclusions, exclusions, tax calculations, and rate breakdowns.
- **Props:** `{ isOpen, onClose, initialData, onQuotationCreated }`

---

### `CreateInquiryFormModal`
- **Location:** [`src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/CreateInquiryFormModal/CreateInquiryFormModal.jsx)
- **Functionality:** Operator-facing intake form generating official `SAF-01-002` inquiries with control numbers.
- **Props:** `{ onClose }`

---

### `ServiceWorkflowModal`
- **Location:** [`src/components/Operator/ServiceWorkflowModal/ServiceWorkflowModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/ServiceWorkflowModal/ServiceWorkflowModal.jsx)
- **Functionality:** Operator fulfillment execution modal. Enforces strict sequential step completion rule, external portal links, and step-level document attachments.
- **Props:** `{ serviceRecord, onClose }`

---

### `QualificationApplicationModal`
- **Location:** [`src/components/Operator/QualificationApplicationModal/QualificationApplicationModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/QualificationApplicationModal/QualificationApplicationModal.jsx)
- **Functionality:** Modal allowing branch operators to apply for specialized service qualifications by uploading credential documents (max 5 documents, 15MB each).
- **Props:** `{ isOpen, onClose, onApplicationSubmitted }`

---

### `AddServiceModal`
- **Location:** [`src/components/Operator/AddServiceModal/AddServiceModal.jsx`](file:///c:/Users/Isaac/Downloads/Fair2/Fairfly/fair-fly/src/components/Operator/AddServiceModal/AddServiceModal.jsx)
- **Functionality:** Operator modal to initiate fulfillment for walk-in or offline clients by picking an approved service from the head office catalog.
- **Props:** `{ onClose }`
