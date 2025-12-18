# SlashData Vehicle Portal - Project Specification

## 1. UI/UX Enhancements
*   **SlashData Branding Integration**: Fully adopt the corporate palette (#E11D48 "Slash Red" and #0F172A "Slash Dark"). Transition from generic Slate backgrounds to subtle gradient variants of the brand colors in headers and card headers.
*   **Bilingual RTL Support**: Since the data contains Arabic descriptions (`nameAr`, `descriptionAr`), implement a global RTL/LTR toggle. When in Arabic mode, the sidebar should shift to the right and typography should switch to a localized font like 'Cairo' or 'Amiri'.
*   **Interactive AI Confidence Gauges**: Replace static text scores in the AI Matching Workspace with animated circular or linear gauges that transition from Red (low) to Emerald (high) as Gemini processes the records.
*   **Skeleton Loading States**: Implement skeleton screens for tables and dashboard widgets to provide a smoother perceived performance during data fetching compared to simple spinners.
*   **Search Term Highlighting**: Dynamically wrap matching substrings in search results with a `<mark>` tag or a subtle background color to help users quickly identify why a result appeared.

## 2. Frontend Suggestions
*   **React Query Optimistic Updates**: Implement optimistic UI updates for mapping confirmations. When a user clicks "Confirm" in the AI Matching Workspace, the row should visually move or disappear immediately before the API response is received, reverting only on failure.
*   **Web Workers for CSV Parsing**: Shift the heavy lifting of Excel/CSV parsing from the main UI thread to a Web Worker. This ensures the interface remains responsive during bulk imports of thousands of vehicle models.
*   **Global State for AI Logic**: Centralize AI configuration (confidence threshold, auto-approve toggle) in a React Context or specialized TanStack Query cache that persists across views, preventing repeated API calls for settings.
*   **Virtualized Tables**: For the "Master Data List" and "Mapped List," utilize `@tanstack/react-virtual` more aggressively to handle datasets exceeding 10,000+ rows without performance degradation.

## 3. Backend Enhancements
*   **Stateless JWT & Refresh Tokens**: Implement a robust JWT-based authentication system with short-lived access tokens and longer-lived refresh tokens stored in HTTP-only cookies to prevent XSS-based token theft.
*   **Database Indexing Strategy**: Add composite indexes on `ADPMaster` (adp_make_id, adp_model_id) and `ADPMappings` (status, reviewed_at) to optimize the complex joins required for the "Pending Mapping" and "Review Queue" views.
*   **Transactional Audit Logging**: Use Spring Data JPA `@EntityListeners` or Hibernate Envers to automatically capture "Who changed What" in the `ADPMappingHistory` table, ensuring every single update is logged for compliance.
*   **Server-Side Batching**: Implement a server-side "Match Batch" endpoint that accepts multiple ADP descriptions at once. This allows the backend to optimize the Gemini API call by sending one large structured prompt instead of multiple sequential requests.

## 4. Backend Suggestions
*   **Search Optimization (OpenSearch)**: As the vehicle master data grows, transition the full-text search from standard SQL `LIKE` queries to a dedicated engine like OpenSearch or ElasticSearch for fuzzy matching and faster retrieval.
*   **Webhook Integration**: Provide an outbound webhook system that notifies external inventory or ERP systems the moment an ADP record is approved in the Review Queue.
*   **Redis Caching for Master Lists**: Use a Redis cache to store the "Makes" and "Models" lookup lists. Since these change infrequently compared to mappings, caching them reduces database load significantly.
*   **Role-Based Attribute Control (RBAC)**: Fine-tune the security layer to ensure `MAPPING_USER` can only update specific mapping fields, while `MAPPING_ADMIN` is required for the final `reviewed_at` timestamp.