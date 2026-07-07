# FairFly Project Documentation

## 1. Project Status
**Date:** 2026-07-07
**Current Phase:** Development (Sprint 3 completion/validation)
**Overall Status:** Stable / Feature Complete (Sprint 1-3)

### Completed Milestones
- [x] **Backend Migration**: Realtime Database $\to$ Firestore (Standard).
- [x] **Franchise Management**: CRUD for Applications, Operators, Services, and Quick-links.
- [x] **Workflow System**: Template CRUD and Instance tracking with state snapshots.
- [x] **Authentication**: Secure Firebase Auth with Firestore user profiles.
- [x] **UI/UX Enhancements**: Global Toast notification system and professional Loading states.
- [x] **Global Safeguards**: Implemented Sliding Window Rate Limiting for all database write operations.
- [x] **UI Components**: Modular `BaseModal` system for confirmations and alerts.

---

## 2. Core Technical Implementation

### 🛠️ Database Utility (`firebaseutils.js`)
The project uses a centralized service layer to interact with Firestore.

| Function | Description | Usage |
| :--- | :--- | :--- |
| `addToDatabase(col, data)` | Adds a document with auto-generated ID. | `await addToDatabase('users', userData)` |
| `getFromDatabase(path)` | Fetches a single document by path. | `await getFromDatabase('users/id')` |
| `updateToDatabase(path, data)`| Updates specific fields in a document. | `await updateToDatabase('users/id', {status: 'active'})` |
| `queryDatabaseAdvanced(col, opt)`| Complex queries with filters and ordering. | `await queryDatabaseAdvanced('services', { filters: [...] })` |

### 🛡️ Rate Limiting (`rateLimiter.js`)
To prevent griefing and spam, the `globalRateLimiter` tracks requests using a sliding window.

- **Default Limit**: 5 requests per 60 seconds.
- **Implementation**: Applied to all `franchiseService.js` write functions.
- **Logic**: Checks `isAllowed(key)` where key is usually `action-userId`.

### 🗄️ Service Layer Patterns
All business logic is isolated from UI components.
- `franchiseService.js`: Handles franchise applications and operator management.
- `workflowService.js`: Manages template creation and instance step transitions.

---

## 3. How to Use

### Adding a New Database Feature
1. **Utility**: Add any required Firestore logic to `src/utils/firebaseutils.js`.
2. **Service**: Create a function in the relevant service file (e.g., `src/services/xxxService.js`).
3. **Protection**: Wrap the service function with a `globalRateLimiter.isAllowed()` check.
4. **UI**: Call the service function from the React component and handle the result with `ToastProvider`.

### Creating a Modal
1. Use the `BaseModal` component.
2. Define a `useRef` in the parent component.
3. Pass the ref to `BaseModal` and call `ref.current.openModal()`.
4. Provide custom JSX as children for the modal body.

---

## 4. Recent Updates & Changes
- **Routing Fixes**: Resolved absolute path import bugs in `App.jsx` for the Operator module.
- **Refactor**: Migrated `GenericModal` to `BaseModal` to fix `forwardRef` propagation issues.
- **Security**: Integrated `auth.currentUser.uid` into rate limiting keys to prevent anonymous bulk-spam.
- **Performance**: Optimized `App.jsx` routing to prevent unnecessary re-renders during auth state transitions.
