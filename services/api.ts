import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    // We strictly avoid auto-logout here to allow users to save data or handle the error manually.
    if (status === 401) {
      // Unauthorized (Invalid Token)
      toast.error('Session invalid or expired. Please refresh or login again.');
    } else if (status === 403) {
      // Forbidden (Permission Issue)
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (status === 404) {
      // Not Found
      toast.error('The requested resource was not found.');
    } else if (status >= 500) {
      // Server Error
      toast.error('Server error. Please try again later.');
    } else if (!status) {
      // Network Error (status is undefined)
      toast.error('Network error. Unable to reach the server.');
    } else {
      // Other errors
      toast.error(error.response?.data?.message || 'An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);