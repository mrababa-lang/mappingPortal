import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Make, Model, VehicleType } from '../types';

// Helper to normalize array responses to handle { data: [...] } or direct [...]
const normalizeArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// --- MAKES ---
export const useMakes = () => {
  return useQuery({
    queryKey: ['makes'],
    queryFn: async () => {
      const { data } = await api.get<Make[]>('/makes');
      return normalizeArray(data);
    }
  });
};

export const useCreateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Partial<Make>) => {
      // Ensure ID is not sent for creation
      const { id, ...payload } = make;
      const { data } = await api.post<Make>('/makes', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useUpdateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Make) => {
      const { data } = await api.put<Make>(`/makes/${make.id}`, make);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useDeleteMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/makes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
      queryClient.invalidateQueries({ queryKey: ['models'] }); // Models cascade delete
    },
  });
};

export const useBulkImportMakes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
       const content = await file.text();
       await api.post('/makes/bulk', content, {
          headers: { 'Content-Type': 'application/json' }
       });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

// --- MODELS ---
export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const { data } = await api.get<Model[]>('/models');
      return normalizeArray(data);
    }
  });
};

export const useCreateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Partial<Model>) => {
      // Ensure ID is not sent for creation; Backend generates it.
      const { id, ...payload } = model;
      const { data } = await api.post<Model>('/models', payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
       const { data } = await api.put<Model>(`/models/${model.id}`, model);
       return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/models/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useBulkImportModels = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const content = await file.text();
         await api.post('/models/bulk', content, {
            headers: { 'Content-Type': 'application/json' }
         });
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
    });
};

// --- TYPES ---
export const useTypes = () => {
  return useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const { data } = await api.get<VehicleType[]>('/types');
      return normalizeArray(data);
    }
  });
};

export const useCreateType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (type: Partial<VehicleType>) => {
        // Ensure ID is not sent for creation; Backend generates it.
        const { id, ...payload } = type;
        const { data } = await api.post<VehicleType>('/types', payload);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useUpdateType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (type: VehicleType) => {
         const { data } = await api.put<VehicleType>(`/types/${type.id}`, type);
         return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useDeleteType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/types/${id}`);
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useBulkImportTypes = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const content = await file.text();
         await api.post('/types/bulk', content, {
             headers: { 'Content-Type': 'application/json' }
         });
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};