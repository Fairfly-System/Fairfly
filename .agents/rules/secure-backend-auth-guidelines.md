---
trigger: always_on
---

# FairFly Secure Authentication & Backend Design Guidelines

> **Purpose:** This rule establishes the mandatory security and architectural standards for all backend services, Express routes, controllers, middleware, and database operations in the FairFly System (`fly-api`). Every new feature or modification must comply with these standards.

---

## 1. Zero-Trust Core Architecture & "Never Trust the Client"

1. **Backend Exclusivity for Mutations (CUD):**
   - All Create, Update, and Delete (CUD) operations on database records (`users`, `services`, `quotations`, `inquiries`, `activeServices`, `appointments`, `tickets`, etc.) **must be handled strictly by the backend** via the Firebase Admin SDK.
   - The frontend client must **never** be permitted to directly create or update user accounts, roles, service catalogs, or operational states in Firestore.
2. **Untrusted Client Inputs:**
   - Every value from `req.body`, `req.query`, and `req.params` is considered untrusted and potentially malicious until validated, sanitized, and whitelisted.
3. **Session & Identity Ground Truth:**
   - Never accept user IDs, client UIDs, operator IDs, or roles from the request body or query parameters to determine authorization.
   - Always derive the acting user's identity and privileges directly from the cryptographically verified JWT token (`req.user.uid`) and the server-side Firestore user record (`req.userDetails.role`).

---

## 2. Authentication & Role-Based Access Control (RBAC)

### 2.1 Route-Level Middleware Defense
Every backend endpoint must have explicit authentication and role checks declared in the router before reaching the controller:

```javascript
// Example: Strict multi-role protection
router.patch(
  '/:id',
  performanceProfiler('PATCH /resource/:id',
    verifyFirebaseToken,                  // 1. Authenticate JWT token
    requireRole(['admin', 'operator']),   // 2. Validate RBAC permissions
    allowedFields(ALLOWED_FIELD_LIST),    // 3. Whitelist allowed payload keys
    apiRateLimiter,                       // 4. Protect against brute force / DoS
    controllerHandler                     // 5. Execute business logic
  )
);
```

### 2.2 Role Hierarchy & Aliases
- **Super Admin (`role === 'admin'` with `isSuperAdmin: true` or `admin@gmail.com`):** Unrestricted system administration, operator creation/deletion, admin creation/deletion, custom service qualification approval. Guarded by `requireSuperAdmin`.
- **Support Admin (`role === 'admin'`):** Global catalog management, inquiry review, client approval/rejection, announcements, system logs. Guarded by `requireRole('admin')`.
- **Branch Operator (`role === 'operator'` or `'branch_operator'`):** Scoped strictly to their own branch location (`branchUid` / `operatorId`).
  > **Rule:** Middleware `requireRole` must always treat `'operator'` and `'branch_operator'` interchangeably.
- **Client (`role === 'client'`):** Self-service travel requests, service browsing, inquiry submission, appointment bookings, quotations acceptance. Scoped strictly to `clientUid === req.user.uid`.

### 2.3 Object-Level Access Control (BOLA / IDOR Prevention)
In addition to route-level role checks, every controller handler that touches an individual resource (`/:id`) **must enforce ownership**:
- **Clients:** Can only read, accept, or cancel resources where `doc.clientUid === req.user.uid`.
- **Operators:** Can only read or mutate resources assigned to their specific branch (`doc.branchUid === req.user.uid` or `doc.operatorId === req.user.uid`).
- **Cross-Tenant Guard:** Return `403 Forbidden` immediately if an authenticated user attempts to access a record belonging to another client or branch.

---

## 3. Strict Multi-Tier File Upload Security

All file uploads processed through `POST /api/upload` (or any custom upload endpoint) must pass through a strict 5-tier defense-in-depth pipeline:

### 3.1 Tier 1: Strict File Extension Whitelisting
Only explicitly required business document and image formats are permitted. All executable, script, and code extensions are strictly rejected:
```javascript
const ALLOWED_EXTENSIONS = new Set([
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  // Media & Archives (Administrative resources only)
  '.zip', '.mp4', '.webm', '.mov'
]);
```

### 3.2 Tier 2: Double-Extension & Dangerous Token Detection
Attackers frequently disguise malicious scripts using multi-extension patterns (e.g., `payroll.php.pdf`, `contract.exe.png`).
- The filename must be split on `.` and all prefix parts inspected against a blacklist of executable tokens (`exe`, `bat`, `cmd`, `sh`, `ps1`, `php`, `js`, `vbs`, `html`, `svg`, `wasm`, `dll`, etc.).
- If any dangerous token is found, the upload must be rejected immediately with `400 Bad Request`.
- Null-byte injection (`\0`, `%00`) in filenames must be strictly detected and blocked.

### 3.3 Tier 3: Magic Bytes / Binary Header Verification
Never trust client-supplied `Content-Type` headers or file extensions alone. Inspect the actual buffered binary bytes:
- **PDF:** Must contain `%PDF-` signature (`0x25 0x50 0x44 0x46 0x2D`) within the first 1024 bytes.
- **JPEG:** First 3 bytes must match `0xFF 0xD8 0xFF`.
- **PNG:** First 8 bytes must match `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`.
- **GIF:** First 6 bytes must match `GIF87a` or `GIF89a`.
- **WEBP:** Must match `RIFF` at offset 0 and `WEBP` at offset 8.
- **ZIP / DOCX / XLSX / PPTX:** Must match PK Zip signature `0x50 0x4B` (`PK\x03\x04`, `PK\x05\x06`, or `PK\x07\x08`).
- **Binary Rejection:** Automatically reject any buffer containing Windows PE executable signatures (`MZ` / `0x4D 0x5A`), Unix shell script headers (`#!` / `0x23 0x21`), Linux ELF binaries (`\x7FELF`), or Mach-O binary headers.

### 3.4 Tier 4: Payload Scanning for Web Scripts / Stored XSS
Inspect the first 2048 bytes of the file for embedded web scripting tags that could execute if served inline by browsers:
- Reject any file containing: `<?php`, `<?=`, `<script`, `javascript:`, `<!doctype html`, `<html`, `<svg`, `xmlns="http://www.w3.org/2000/svg"`.

### 3.5 Tier 5: Canonical MIME Normalization & Path Sanitization
- **Canonical Content-Type:** Set the Firebase Storage `contentType` strictly based on the server-verified extension mapping (e.g., `.pdf` -> `application/pdf`). Never store client-spoofed MIME headers.
- **Storage Path Traversal Protection:** Sanitize target folders against a strict whitelist (`uploads`, `client_ids`, `service_requirements`, `resources`, etc.). Remove any `../` or special characters.
- **Randomized File Naming:** Append timestamp and cryptographic random hex bytes (`crypto.randomBytes(6).toString('hex')`) to generate collision-free, unguessable storage paths:
  `${safeFolder}/${Date.now()}_${randomSuffix}_${cleanBase}`

---

## 4. Input Sanitization & Mass Assignment Prevention

1. **`allowedFields` Whitelisting Middleware:**
   - Every endpoint accepting `POST`, `PUT`, or `PATCH` payloads must use the `allowedFields([...])` middleware.
   - Any extra, unexpected, or injected properties must cause the request to fail with `400 Bad Request` before any controller logic executes.
2. **Immutable System Fields:**
   - Payloads must never be permitted to overwrite system-controlled properties:
     `role`, `isSuperAdmin`, `uid`, `id`, `createdAt`, `createdBy`, `downloadCount`.
3. **Status Field Normalization:**
   - Status updates must validate against a strict enum whitelist and normalize to standard casing (Title Case: `Pending`, `Approved`, `Cancelled`, `Ongoing`, `Closed`).

---

## 5. Network Hardening, CORS & Security Headers

1. **HTTP Response Security Headers:**
   Every HTTP response emitted by Express must include:
   - `X-Content-Type-Options: nosniff` (Prevents MIME sniffing attacks)
   - `X-Frame-Options: DENY` (Eliminates clickjacking)
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Enforces HTTPS)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `app.disable('x-powered-by')` (Hides Express server banner)
2. **Strict CORS Policy:**
   - Whitelist only authorized frontend origins (`FRONTEND_URL`, `http://localhost:5173`, etc.).
   - Explicitly define allowed HTTP methods: `GET, POST, PATCH, PUT, DELETE`.
   - Explicitly define allowed headers: `Content-Type, Authorization`.
3. **Tiered Rate Limiting:**
   - `publicRateLimiter`: Strict limits (e.g. 15-30 requests per minute) on unauthenticated/public endpoints (`/auth/register`, `/auth/forgot-password`, `/franchise/applications`).
   - `apiRateLimiter`: Generous yet protective limits (e.g. 120-200 requests per minute) on authenticated API routes.

---

## 6. Route Declaration Ordering & Shadowing Prevention

Express matches routes sequentially from top to bottom.
- **Rule:** Always register specific static routes **before** parameterized dynamic routes (`/:id`):
  ```javascript
  // CORRECT:
  router.get('/quicklinks', getQuickLinks);
  router.get('/:id', getServiceById);

  // INCORRECT (Shadowing Bug):
  // router.get('/:id', getServiceById);
  // router.get('/quicklinks', getQuickLinks); // Never reached! Treated as id="quicklinks"
  ```

---

## 7. Audit Logging & Error Handling

1. **Admin Action Logging (`adminLogger`):**
   - All state-altering administrative requests (`POST`, `PUT`, `PATCH`, `DELETE`) performed by admins must be automatically captured post-response via `res.on('finish')` and persisted to the `adminLogs` collection.
2. **Information Leakage Prevention:**
   - Production error responses must return generic, actionable error messages:
     `res.status(500).json({ error: 'Internal Server Error' })`.
   - Never expose internal database stack traces, file paths, or raw SQL/Firestore error messages to client applications.
3. **Cache Invalidation:**
   - Any mutation altering a user document must immediately invalidate `userCache.delete(uid)` to guarantee fresh authorization state on subsequent requests.
