import { api } from './api';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password });
    const { token, user } = response.data;
    
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
