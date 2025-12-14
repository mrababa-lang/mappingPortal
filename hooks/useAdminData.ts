import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User, AppConfig } from '../types';
import { toast } from 'sonner';

// Helper to normalize array responses
const normalizeArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// Helper to normalize object responses
const normalizeObject = (data: any): any => {
  if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }
  return data;
};

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return normalizeArray(data);
    }
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const { data } = await api.post('/users', user);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      const { data } = await api.put(`/users/${user.id}`, user);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useAppConfig = () => {
    return useQuery({
        queryKey: ['appConfig'],
        queryFn: async () => {
            const { data } = await api.get('/config');
            return normalizeObject(data);
        }
    });
};

export const useUpdateAppConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (config: AppConfig) => {
            const { data } = await api.put('/config', config);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appConfig'] });
        }
    });
};