# Lessons Learned
# A File for Agents to write their mistakes so that next runs can prevent doing the same thing (Automatic Improvement)

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