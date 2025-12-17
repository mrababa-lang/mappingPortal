import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Make, Model, VehicleType, SlashMasterVehicle } from '../types';
import * as XLSX from 'xlsx';

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
      // Send ID for creation (Manual ID Entry)
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
      const { data } = await api.put<Make>(`/makes/${encodeURIComponent(make.id)}`, make);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['makes'] }),
  });
};

export const useDeleteMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/makes/${encodeURIComponent(id)}`);
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
      // Send ID for creation (Manual ID Entry)
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
       const { data } = await api.put<Model>(`/models/${encodeURIComponent(model.id)}`, model);
       return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/models/${encodeURIComponent(id)}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
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
        // Send ID for creation (Manual ID Entry)
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
         const { data } = await api.put<VehicleType>(`/types/${encodeURIComponent(type.id)}`, type);
         return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
    });
};

export const useDeleteType = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/types/${encodeURIComponent(id)}`);
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['types'] }),
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
      // Fallback: If backend endpoint /api/master/vehicles doesn't exist yet, we can construct it client-side
      // But adhering to the requirement, we assume the endpoint exists or will exist.
      // If mock mode, we could manually join useModels with useMakes/useTypes here.
      
      try {
        const { data } = await api.get('/master/vehicles', { params: {
            page: (params.page || 1) - 1,
            size: params.size || 20,
            q: params.q,
            makeId: params.makeId,
            typeId: params.typeId
        }});

        const content = normalizeArray(data);
        const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
        const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;

        return {
            content: content,
            totalElements: totalElements,
            totalPages: totalPages
        };
      } catch (e) {
        // Fallback for demo if endpoint not ready: Fetch lists separately
        console.warn("Using fallback client-side join for master data");
        const [modelsRes, makesRes, typesRes] = await Promise.all([
             api.get('/models'),
             api.get('/makes'),
             api.get('/types')
        ]);
        const models = normalizeArray(modelsRes.data);
        const makes = normalizeArray(makesRes.data);
        const types = normalizeArray(typesRes.data);

        // Client side join
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

        // Client side filtering
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
        console.error("Export failed, falling back to client generation if possible", e);
        throw e;
    }
};