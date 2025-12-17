
# SlashData Vehicle Portal: Quality Assurance & Enhancement Strategy

This document outlines a roadmap for elevating the quality of the SlashData Vehicle Portal. It focuses on robust data validation, user experience improvements, and technical debt reduction.

---

## 1. Data Validation Strategy

As a Master Data Management (MDM) tool, data integrity is paramount.

### 1.1 Frontend Validation (Client-Side)
**Goal:** Provide immediate feedback and prevent bad data from reaching the server.

*   **Standardize Zod Schemas:**
    *   Apply `zod` + `react-hook-form` to **all** forms (Models, Types, Users, ADP Mappings) to match the implementation in `Makes.tsx`.
*   **Manual ID Rules:**
    *   **Makes:** `^[A-Z0-9-]{2,10}$` (Uppercase alphanumeric, hyphens allowed, 2-10 chars).
    *   **Models:** `^[0-9]+$` (Strictly numeric integers, positive).
    *   **Types:** `^[0-9]+$` (Strictly numeric integers).
*   **Text Validation:**
    *   **Arabic Names:** Use Regex `[\u0600-\u06FF\u0750-\u077F]` to warn users if English text is entered in Arabic fields.
    *   **Trimming:** Auto-trim whitespace from start/end of all text inputs.
*   **Async Validation:**
    *   Implement "Check Availability" for IDs. When a user types a manual ID (e.g., `TOY`), fire a lightweight request to check if it already exists to prevent a 409 Conflict error upon submission.
*   **CSV Pre-validation:**
    *   Validate CSV headers client-side before upload.
    *   Check for empty rows or duplicate IDs within the CSV file before sending to the server.

### 1.2 Backend Validation (Server-Side)
**Goal:** Enforce business rules and integrity constraints.

*   **Duplicate Checks:**
    *   Check `Make + Model Name` uniqueness. (e.g., "Toyota" cannot have two models named "Camry").
*   **Referential Integrity:**
    *   Prevent deletion of a **Make** if it has associated **Models**. Return a clear error: *"Cannot delete Make 'Toyota' because it has 5 associated models."*
    *   Prevent deletion of a **Model** if it is used in **ADP Mappings**.
*   **Cross-Field Logic:**
    *   When mapping ADP data, ensure the selected `Model` actually belongs to the selected `Make`.
*   **Sanitization:**
    *   Sanitize all string inputs to prevent XSS (Cross-Site Scripting) stored in the database.

---

## 2. User Experience (UX) Enhancements

### 2.1 Optimistic UI Updates
*   **Current Behavior:** The UI waits for the server response before updating the list (Spinners).
*   **Improvement:** When a user creates/updates a record, update the UI list *immediately*. If the server fails, roll back the change and show a toast error. This makes the app feel instant.

### 2.2 Advanced Filtering
*   **Multi-Select Filters:** Allow selecting multiple statuses (e.g., Show "Missing Model" AND "Missing Make").
*   **Saved Views:** Allow users to save their filter combinations (e.g., "My Pending Reviews").

### 2.3 Visual Feedback
*   **Diff View in History:** In the Audit Log, show a "Before vs After" comparison for updates (e.g., `Status: MAPPED -> MISSING_MODEL`).
*   **Empty States:** Add helpful illustrations or "Call to Action" buttons when tables are empty (e.g., "No Models found. Import via CSV?").

### 2.4 Keyboard Navigation
*   **Mapping Review:** Allow power users to use keyboard shortcuts:
    *   `Arrow Keys`: Navigate rows.
    *   `A`: Approve.
    *   `R`: Reject.

---

## 3. Technical Architecture Improvements

### 3.1 Caching Strategy (TanStack Query)
*   **Stale Time Tuning:**
    *   **Reference Data (Makes/Types):** Set `staleTime` to `Infinity` or 1 hour. These rarely change.
    *   **Operational Data (Mappings):** Keep `staleTime` low (0-30s) to reflect team collaboration.
*   **Prefetching:** Prefetch the "Next Page" of data in paginated tables to eliminate loading spinners during navigation.

### 3.2 Error Handling Boundary
*   Implement a global **Error Boundary** component. If a specific view crashes (e.g., malformed data), the rest of the app should remain usable, and a "Report Error" button should appear.

### 3.3 Large Dataset Handling
*   **Virtualization:** Extend virtualization (currently in `ADPMaster`) to `ADPMappedVehicles` and `SlashMasterData` if record counts exceed 1,000 rows.

---

## 4. Bulk Operations & Workflows

### 4.1 "Safe" Bulk Import
*   **Dry Run Mode:** When uploading a CSV, provide a "Validate Only" option that returns a report of what *would* happen (e.g., "10 rows valid, 2 duplicates, 1 invalid ID") without modifying the DB.

### 4.2 Batch Editing
*   Add checkboxes to the **Models** table.
*   Allow actions like: *Change Type for Selected Models* (e.g., Move 50 models from "Car" to "SUV" at once).

---

## 5. Security Enhancements

### 5.1 RBAC enforcement (Backend)
*   Ensure that even if the UI hides the "Delete" button, the API endpoint returns `403 Forbidden` if a standard user attempts to call it.

### 5.2 Session Management
*   Implement an "Idle Timeout". If the user is inactive for 15 minutes, auto-logout or show a lock screen.

### 5.3 Audit Granularity
*   Ensure every single write operation records the `IP Address` and `User Agent` in the `SystemConfig` or `AuditLog` for forensic security.

---

## 6. Implementation Checklist

### Phase 1: hardening (Immediate)
- [ ] Add Zod validation to all forms.
- [ ] Add regex validation for Manual IDs (Frontend & Backend).
- [ ] Implement confirmation dialogs for all Delete actions.

### Phase 2: UX (Short Term)
- [ ] Add loading skeletons instead of spinners for smoother transitions.
- [ ] Implement "Dry Run" for CSV imports.
- [ ] Add Arabic input validation warnings.

### Phase 3: Advanced (Long Term)
- [ ] Optimistic UI updates.
- [ ] Keyboard shortcuts for Review Queue.
- [ ] Visual Diff for History logs.
