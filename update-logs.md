# Update Logs

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

