# SlashData Vehicle Portal

## Overview
A premium master data management portal for vehicle configurations, featuring AI-assisted data entry, ADP mapping visualization, and robust role-based access control.

## Project Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query.
- **Backend (Target)**: Java Spring Boot 3.x, MySQL 8.0.
- **AI Integration**: Google Gemini API (2.5 Flash).

## Local Development Setup

This project is configured to run with [Vite](https://vitejs.dev/).

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory.

**For Mock/Prototype Mode (Current Default):**
```env
# Optional: Google Gemini API Key for AI suggestions
VITE_GEMINI_API_KEY=your_google_gemini_api_key_here
```

**For Production / Real Backend Connection:**
To connect the frontend to the developed Java Spring Boot backend, configure the following variables:

```env
# API Base URL (Java Backend)
VITE_API_BASE_URL=http://localhost:8080/api

# Toggle to disable mock services (Implementation required in services/api.ts)
VITE_USE_MOCK=false
```

### 4. Running the App
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

## Backend Integration Guide

The frontend is designed to transition from `LocalStorage` mock data to real REST API calls. Since the backend is already developed, follow these steps to finalize the integration:

### 1. API Client Setup
The current `services/storageService.ts` handles local data simulation. To point to the real backend:
1.  Create a new service file `services/api.ts` using `axios`.
2.  Configure the axios instance to use `import.meta.env.VITE_API_BASE_URL`.
3.  Implement a **Request Interceptor** to inject the JWT token:
    ```typescript
    axiosInstance.interceptors.request.use(config => {
      const token = localStorage.getItem('auth_token'); // Or from AuthContext
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    ```

### 2. Hook Refactoring
The data layer currently resides in `hooks/useVehicleData.ts`. You must update the `queryFn` and `mutationFn` in these hooks to call the new API endpoints instead of `DataService`.

**Example Migration:**
*Current (Mock):*
```typescript
queryFn: async () => DataService.getMakes()
```
*Target (Backend):*
```typescript
queryFn: async () => {
  const { data } = await api.get('/makes');
  return data;
}
```

### 3. Authentication Flow
The backend expects a stateless JWT flow.
1.  Update `views/Login.tsx` to call `POST /api/auth/login` with email and password.
2.  On success, store the received `token` and `user` object.
3.  Remove the `DataService.getUsers()` mock check.

### 4. File Uploads (Bulk Import)
The current Bulk Import features parse CSV files client-side.
- **Change:** Update the `handleBulkImport` functions in `Makes.tsx` and `Models.tsx`.
- **Action:** Instead of parsing text, use `FormData` to append the file and send a `POST /api/{resource}/upload` request to the backend for asynchronous processing.

## Features

- **Dashboard**: High-level metrics, trend analysis, and activity feeds.
- **Vehicle Management**: CRUD operations for Makes, Models, and Types with Zod validation.
- **ADP Integration**:
  - Virtualized list for high-performance Master Data viewing.
  - Interactive Mapping Review workflow.
- **AI Assistance**: Auto-generate descriptions and model suggestions using Google Gemini.
