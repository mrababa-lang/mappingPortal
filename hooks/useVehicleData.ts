import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Make, Model, VehicleType } from '../types';

// --- MAKES ---
export const useMakes = () => {
  return useQuery({
    queryKey: ['makes'],
    queryFn: async () => {
      const { data } = await api.get<Make[]>('/makes');
      return data;
    },
  });
};

export const useCreateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Partial<Make>) => {
      const { data } = await api.post<Make>('/makes', make);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useUpdateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Make) => {
      // Assuming PUT endpoint exists or using POST for update based on REST standards
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
       const formData = new FormData();
       formData.append('file', file);
       await api.post('/makes/bulk', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
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
      return data;
    },
  });
};

export const useCreateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Partial<Model>) => {
      const { data } = await api.post<Model>('/models', model);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
       // Assuming PUT based on standard REST
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
         const formData = new FormData();
         formData.append('file', file);
         await api.post('/models/bulk', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
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
      // Assuming endpoint exists based on spec, though missing in simple Postman list
      const { data } = await api.get<VehicleType[]>('/types');
      return data;
    },
  });
};

export const useCreateType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (type: Partial<VehicleType>) => {
        const { data } = await api.post<VehicleType>('/types', type);
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
         const formData = new FormData();
         formData.append('file', file);
         await api.post('/types/bulk', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
         });
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};
