import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { User, AppConfig } from '../types';
import { toast } from 'sonner';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const { data } = await api.post<User>('/users', user);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      const { data } = await api.put<User>(`/users/${user.id}`, user);
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
            const { data } = await api.get<AppConfig>('/config');
            return data;
        },
        // Provide reasonable defaults to avoid null checks everywhere before data loads
        initialData: {
            enableAI: true,
            apiKey: '',
            aiConfidenceThreshold: 70,
            maintenanceMode: false,
            enableAuditLog: true
        } as AppConfig
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