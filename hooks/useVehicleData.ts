
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Make, Model, VehicleType } from '../types';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Helper to normalize array responses to handle { data: [...] } or direct [...]
const normalizeArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// --- MAKES ---
export const useMakes = (params?: { page?: number; size?: number; q?: string }) => {
  return useQuery({
    queryKey: ['makes', params],
    queryFn: async () => {
      const { data } = await api.get('/makes', {
        params: {
          page: params?.page ? params.page - 1 : 0,
          size: params?.size || 20,
          q: params?.q
        }
      });
      
      const content = normalizeArray(data);
      const totalElements = data.totalElements ?? content.length;
      const totalPages = data.totalPages ?? 1;
      
      return { content, totalElements, totalPages };
    }
  });
};

export const useCreateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Partial<Make>) => {
      const { data } = await api.post<Make>('/makes', make);
      return data;
    },
    onMutate: async (newMake) => {
        await queryClient.cancelQueries({ queryKey: ['makes'] });
        const previousMakes = queryClient.getQueryData(['makes']);
        queryClient.setQueryData(['makes'], (old: any) => {
            if (!old) return { content: [newMake], totalElements: 1, totalPages: 1 };
            return {
                ...old,
                content: [{ ...newMake, id: newMake.id || 'TEMP_ID' }, ...old.content].slice(0, old.size || 20),
                totalElements: (old.totalElements || 0) + 1
            };
        });
        return { previousMakes };
    },
    onError: (err, newMake, context) => {
        if(context?.previousMakes) {
            queryClient.setQueryData(['makes'], context.previousMakes);
        }
        toast.error("Failed to create make");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useUpdateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Make) => {
      const { data } = await api.put<Make>(`/makes/${encodeURIComponent(make.id)}`, make);
      return data;
    },
    onMutate: async (updatedMake) => {
        await queryClient.cancelQueries({ queryKey: ['makes'] });
        const previousMakes = queryClient.getQueryData(['makes']);
        queryClient.setQueryData(['makes'], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                content: old.content.map((m: any) => m.id === updatedMake.id ? updatedMake : m)
            };
        });
        return { previousMakes };
    },
    onError: (err, newMake, context) => {
        if(context?.previousMakes) {
            queryClient.setQueryData(['makes'], context.previousMakes);
        }
        toast.error("Failed to update make");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useDeleteMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/makes/${encodeURIComponent(id)}`);
    },
    onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['makes'] });
        const previousMakes = queryClient.getQueryData(['makes']);
        queryClient.setQueryData(['makes'], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                content: old.content.filter((m: any) => m.id !== id),
                totalElements: Math.max(0, (old.totalElements || 0) - 1)
            };
        });
        return { previousMakes };
    },
    onError: (err, id, context) => {
        if(context?.previousMakes) {
             queryClient.setQueryData(['makes'], context.previousMakes);
        }
        toast.error("Failed to delete make");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

export const useBulkImportMakes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
       const buffer = await file.arrayBuffer();
       const workbook = XLSX.read(buffer);
       const sheetName = workbook.SheetNames[0];
       const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
       
       const response = await api.post('/makes/bulk', jsonData);
       return response.data;
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
      const { data } = await api.post<Model>('/models', model);
      return data;
    },
    onMutate: async (newModel) => {
        await queryClient.cancelQueries({ queryKey: ['models'] });
        const previousModels = queryClient.getQueryData(['models']);
        queryClient.setQueryData(['models'], (old: Model[] = []) => [
             { ...newModel, id: newModel.id || 'TEMP', name: newModel.name || 'New Model' } as Model, 
             ...old
        ]);
        return { previousModels };
    },
    onError: (err, newModel, context) => {
        if(context?.previousModels) queryClient.setQueryData(['models'], context.previousModels);
        toast.error("Failed to create model");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
       const { data } = await api.put<Model>(`/models/${encodeURIComponent(model.id)}`, model);
       return data;
    },
    onMutate: async (updatedModel) => {
        await queryClient.cancelQueries({ queryKey: ['models'] });
        const previousModels = queryClient.getQueryData(['models']);
        queryClient.setQueryData(['models'], (old: Model[] = []) => 
            old.map(m => m.id === updatedModel.id ? updatedModel : m)
        );
        return { previousModels };
    },
    onError: (err, model, context) => {
        if(context?.previousModels) queryClient.setQueryData(['models'], context.previousModels);
        toast.error("Failed to update model");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/models/${encodeURIComponent(id)}`);
    },
    onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ['models'] });
        const previousModels = queryClient.getQueryData(['models']);
        queryClient.setQueryData(['models'], (old: Model[] = []) => old.filter(m => m.id !== id));
        return { previousModels };
    },
    onError: (err, id, context) => {
         if(context?.previousModels) queryClient.setQueryData(['models'], context.previousModels);
         toast.error("Failed to delete model");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useBulkImportModels = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const buffer = await file.arrayBuffer();
         const workbook = XLSX.read(buffer);
         const sheetName = workbook.SheetNames[0];
         const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

         const response = await api.post('/models/bulk', jsonData);
         return response.data;
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
        const { data } = await api.post<VehicleType>('/types', type);
        return data;
      },
      onMutate: async (newType) => {
         await queryClient.cancelQueries({ queryKey: ['types'] });
         const previousTypes = queryClient.getQueryData(['types']);
         queryClient.setQueryData(['types'], (old: VehicleType[] = []) => [
             { ...newType, id: newType.id || 'TEMP', name: newType.name || 'New Type' } as VehicleType,
             ...old
         ]);
         return { previousTypes };
      },
      onError: (err, type, context) => {
         if(context?.previousTypes) queryClient.setQueryData(['types'], context.previousTypes);
         toast.error("Failed to create type");
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useUpdateType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (type: VehicleType) => {
         const { data } = await api.put<VehicleType>(`/types/${encodeURIComponent(type.id)}`, type);
         return data;
      },
      onMutate: async (updatedType) => {
         await queryClient.cancelQueries({ queryKey: ['types'] });
         const previousTypes = queryClient.getQueryData(['types']);
         queryClient.setQueryData(['types'], (old: VehicleType[] = []) => 
            old.map(t => t.id === updatedType.id ? updatedType : t)
         );
         return { previousTypes };
      },
      onError: (err, type, context) => {
         if(context?.previousTypes) queryClient.setQueryData(['types'], context.previousTypes);
         toast.error("Failed to update type");
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useDeleteType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/types/${encodeURIComponent(id)}`);
      },
      onMutate: async (id) => {
         await queryClient.cancelQueries({ queryKey: ['types'] });
         const previousTypes = queryClient.getQueryData(['types']);
         queryClient.setQueryData(['types'], (old: VehicleType[] = []) => old.filter(t => t.id !== id));
         return { previousTypes };
      },
      onError: (err, id, context) => {
         if(context?.previousTypes) queryClient.setQueryData(['types'], context.previousTypes);
         toast.error("Failed to delete type");
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useBulkImportTypes = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const buffer = await file.arrayBuffer();
         const workbook = XLSX.read(buffer);
         const sheetName = workbook.SheetNames[0];
         const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

         const response = await api.post('/types/bulk', jsonData);
         return response.data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

// --- SLASH MASTER DATA (CONSOLIDATED) ---

export const useSlashMasterData = (params: { page: number, size: number, q?: string, makeId?: string, typeId?: string }) => {
  return useQuery({
    queryKey: ['slashMaster', params],
    queryFn: async () => {
      try {
        const { data } = await api.get('/master/vehicles', { params: {
            page: (params.page || 1) - 1,
            size: params.size || 20,
            q: params.q,
            makeId: params.makeId,
            typeId: params.typeId
        }});

        const content = normalizeArray(data);
        const totalElements = data.totalElements ?? (content.length ? content.length : 0);
        const totalPages = data.totalPages ?? 1;

        return {
            content: content,
            totalElements: totalElements,
            totalPages: totalPages
        };
      } catch (e) {
        console.warn("Using fallback client-side join for master data");
        const [modelsRes, makesRes, typesRes] = await Promise.all([
             api.get('/models'),
             api.get('/makes'),
             api.get('/types')
        ]);
        
        // Handle paginated responses from makes/models fallback if necessary
        const models = normalizeArray(modelsRes.data);
        const makes = normalizeArray(makesRes.data);
        const types = normalizeArray(typesRes.data);

        let joined = models.map((m: any) => {
           const make = makes.find((mk:any) => mk.id == (m.makeId || (m.make && m.make.id)));
           const type = types.find((t:any) => t.id == (m.typeId || (m.type && m.type.id)));
           return {
               modelId: m.id,
               modelName: m.name,
               modelNameAr: m.nameAr,
               makeId: make?.id || '?',
               makeName: make?.name || '?',
               makeNameAr: make?.nameAr,
               typeId: type?.id || '?',
               typeName: type?.name || '?'
           };
        });

        if (params.makeId) {
            joined = joined.filter((i:any) => i.makeId === params.makeId);
        }
        if (params.typeId) {
            joined = joined.filter((i:any) => i.typeId === params.typeId);
        }
        if (params.q) {
            const q = params.q.toLowerCase();
            joined = joined.filter((i:any) => i.makeName.toLowerCase().includes(q) || i.modelName.toLowerCase().includes(q));
        }

        const total = joined.length;
        const start = ((params.page || 1) - 1) * (params.size || 20);
        const paged = joined.slice(start, start + (params.size || 20));

        return {
            content: paged,
            totalElements: total,
            totalPages: Math.ceil(total / (params.size || 20))
        }
      }
    }
  });
};

export const downloadSlashMasterReport = async (makeId?: string, typeId?: string) => {
    try {
        const response = await api.get('/master/vehicles/export', {
            params: { format: 'csv', makeId, typeId },
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `slashdata_master_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error("Export failed", e);
        throw e;
    }
};
