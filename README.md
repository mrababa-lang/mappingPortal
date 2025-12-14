# SlashData Vehicle Portal

## How to run locally

This project is configured to run with [Vite](https://vitejs.dev/).

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    To use the Gemini AI features, you need an API key.
    Create a `.env` file in the root directory:
    ```
    API_KEY=your_google_gemini_api_key_here
    ```
    *Note: The app will run without an API key, but AI generation features will fail gracefully.*

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the app:**
    Visit `http://localhost:5173` in your browser.

## Features

- **Dashboard**: High-level metrics and charts.
- **Vehicle Management**: Manage Makes, Models, and Types.
- **ADP Integration**: View master data and manage mappings.
- **AI Assistance**: Auto-generate descriptions and model suggestions using Google Gemini.
