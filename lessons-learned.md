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