import { api } from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post<any>('/auth/login', { email, password });
    
    // Explicitly handle the provided response structure: { data: { token, user: {...} }, meta: ... }
    const responseData = response.data;
    
    // Try to find user in responseData.data.user (Standard wrapper) or responseData.user (Direct)
    let user = responseData.data?.user || responseData.user;
    
    // Try to find token
    const token = responseData.data?.token || responseData.token;

    if (!user) {
      console.error("Login failed: Invalid response structure", responseData);
      throw new Error("User data missing from server response.");
    }

    // Safety check for fullName, fallback to 'name' if present (API compatibility)
    if (!user.fullName && (user as any).name) {
       user.fullName = (user as any).name;
    }

    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    
    return user;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};