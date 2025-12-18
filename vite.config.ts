import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This ensures process.env.API_KEY is available in the browser context
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    host: true,
    port: 5173
  }
});