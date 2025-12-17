import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ADPMaster, ADPMapping } from '../types';
import * as XLSX from 'xlsx';

export interface ADPQueryParams {
  q?: string;
  page?: number;
  size?: number;
}

export interface ADPMappingQueryParams extends ADPQueryParams {
  reviewStatus?: 'pending' | 'reviewed' | 'all';
  mappingType?: string;
  dateFrom?: string;
  dateTo?: string;
  statusFilter?: string; // For compatibility
  userId?: string;
}

// Helper to normalize array responses
const normalizeArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

// Helper to normalize object responses (unwrapping data.data if present)
const normalizeObject = (data: any): any => {
  if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }
  return data;
};

// --- MASTER DATA ---
export const useADPMaster = (params: ADPQueryParams) => {
  return useQuery({
    queryKey: ['adpMaster', params],
    queryFn: async () => {
      const { data } = await api.get('/adp/master', { 
        params: {
          q: params.q,
          page: (params.page || 1) - 1, // API is 0-indexed
          size: params.size || 20
        } 
      });
      // Handle Spring Data Page structure or Custom Meta structure
      const content = normalizeArray(data);
      const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
      const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;

      return {
          content: content,
          totalElements: totalElements,
          totalPages: totalPages
      };
    }
  });
};

export const useCreateADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (item: Partial<ADPMaster>) => {
        const { data } = await api.post('/adp/master', item);
        return data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

export const useUpdateADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: ADPMaster) => {
            const { data } = await api.put(`/adp/master/${encodeURIComponent(item.id)}`, item);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

export const useDeleteADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/adp/master/${encodeURIComponent(id)}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

export const useBulkImportADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const buffer = await file.arrayBuffer();
         const workbook = XLSX.read(buffer);
         const sheetName = workbook.SheetNames[0];
         const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

         const response = await api.post('/adp/master/upload', jsonData);
         return response.data;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

// --- HISTORY ---
export const useADPHistory = (adpId: string | null) => {
  return useQuery({
    queryKey: ['adpHistory', adpId],
    queryFn: async () => {
      if (!adpId) return [];
      const { data } = await api.get(`/adp/history/${encodeURIComponent(adpId)}`);
      return normalizeArray(data);
    },
    enabled: !!adpId
  });
};

// --- MAPPINGS ---
export const useADPMappings = (params: ADPMappingQueryParams) => {
  return useQuery({
    queryKey: ['adpMappings', params],
    queryFn: async () => {
      // Map frontend filters to backend params
      const backendParams: any = {
        page: (params.page || 1) - 1,
        size: params.size || 20
      };
      
      if (params.q) backendParams.q = params.q;
      if (params.dateFrom) backendParams.dateFrom = params.dateFrom;
      if (params.dateTo) backendParams.dateTo = params.dateTo;
      if (params.userId) backendParams.userId = params.userId;
      
      // Handle status filters
      if (params.reviewStatus && params.reviewStatus !== 'all') {
          backendParams.reviewStatus = params.reviewStatus;
      }
      if (params.statusFilter && params.statusFilter !== 'all') {
          // 'mapped', 'issues', 'unmapped'
          backendParams.status = params.statusFilter.toUpperCase();
      }
      if (params.mappingType && params.mappingType !== 'all') {
          backendParams.mappingType = params.mappingType;
      }

      const { data } = await api.get('/adp/mappings', { params: backendParams });
      
      const content = normalizeArray(data);
      const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
      const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;

      return {
          content: content,
          totalElements: totalElements,
          totalPages: totalPages
      };
    }
  });
};

export const useUpsertMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: { adpId: string, status: string, makeId?: string, modelId?: string }) => {
      const { data } = await api.put(`/adp/mappings/${encodeURIComponent(mapping.adpId)}`, mapping);
      return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adpMappings'] });
        queryClient.invalidateQueries({ queryKey: ['adpMaster'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['adpMappedVehicles'] });
    },
  });
};

export const useApproveMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adpId: string) => {
      await api.post(`/adp/mappings/${encodeURIComponent(adpId)}/approve`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMappings'] }),
  });
};

export const useRejectMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adpId: string) => {
      await api.delete(`/adp/mappings/${encodeURIComponent(adpId)}/reject`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMappings'] }),
  });
};

export const useBulkMappingAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { action: 'APPROVE' | 'REJECT', ids: string[] }) => {
      await api.post('/adp/mappings/bulk-action', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMappings'] }),
  });
};

// --- MAPPED VEHICLES REPORT ---

export const useADPMappedVehicles = (params: { page: number, size: number, q?: string, dateFrom?: string, dateTo?: string }) => {
  return useQuery({
    queryKey: ['adpMappedVehicles', params],
    queryFn: async () => {
      // Backend expects an endpoint that filters only mapped items. 
      // If endpoint doesn't exist yet, we can reuse /adp/mappings with status filters.
      // However, per spec, we should target: /api/adp/mapped-vehicles
      
      const backendParams: any = {
        page: (params.page || 1) - 1,
        size: params.size || 20,
        q: params.q,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo
      };

      // Try dedicated endpoint, if fails fall back to mappings with filters? 
      // For now assuming the backend implemented the spec provided in the text file.
      // If not, we fall back to /adp/mappings?status=MAPPED,MISSING_MODEL
      
      try {
        const { data } = await api.get('/adp/mapped-vehicles', { params: backendParams });
        const content = normalizeArray(data);
        const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
        const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;

        return {
            content: content,
            totalElements: totalElements,
            totalPages: totalPages
        };
      } catch (e) {
         // Fallback logic for mock/dev if dedicated endpoint missing
         console.warn("Dedicated endpoint /adp/mapped-vehicles failed, using generic mappings endpoint.");
         backendParams.status = 'MAPPED'; // Simple fallback
         const { data } = await api.get('/adp/mappings', { params: backendParams });
         const content = normalizeArray(data);
         return {
            content: content,
            totalElements: data.meta?.totalItems ?? 0,
            totalPages: data.meta?.totalPages ?? 1
         }
      }
    }
  });
};

export const downloadMappedVehiclesReport = async (dateFrom?: string, dateTo?: string) => {
    try {
        const response = await api.get('/adp/mapped-vehicles/export', {
            params: { dateFrom, dateTo, format: 'csv' },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `mapped_vehicles_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error("Export failed", e);
        throw e;
    }
};

// --- UNIQUE MAKES & TYPES ---

export const useADPUniqueMakes = (params?: { page: number, size: number, q?: string, status?: string }) => {
    return useQuery({
        queryKey: ['adpUniqueMakes', params],
        queryFn: async () => {
            const { data } = await api.get('/adp/makes', { params: {
                page: (params?.page || 1) - 1,
                size: params?.size || 20,
                q: params?.q,
                status: params?.status === 'all' ? undefined : params?.status
            }});
            
            const content = normalizeArray(data);
            const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
            const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
            
            return {
                content: content,
                totalPages: totalPages,
                totalElements: totalElements
            }
        }
    })
}

export const downloadADPMakesReport = async (status?: string) => {
    try {
        const response = await api.get('/adp/makes/export', {
            params: { format: 'csv', status: status === 'all' ? undefined : status },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `adp_makes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error("Export failed", e);
        throw e;
    }
}

export const useSaveMakeMapping = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { adpMakeId: string, sdMakeId: string }) => {
             await api.post('/adp/makes/map', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adpUniqueMakes'] });
            queryClient.invalidateQueries({ queryKey: ['adpMappings'] });
            queryClient.invalidateQueries({ queryKey: ['adpMappedVehicles'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    })
}

export const useADPUniqueTypes = (params?: { page: number, size: number, q?: string, status?: string }) => {
    return useQuery({
        queryKey: ['adpUniqueTypes', params],
        queryFn: async () => {
            const { data } = await api.get('/adp/types', { params: {
                page: (params?.page || 1) - 1,
                size: params?.size || 20,
                q: params?.q,
                status: params?.status === 'all' ? undefined : params?.status
            }});
            
            const content = normalizeArray(data);
            const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
            const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
            
            return {
                content: content,
                totalPages: totalPages,
                totalElements: totalElements
            }
        }
    })
}

export const downloadADPTypesReport = async (status?: string) => {
    try {
        const response = await api.get('/adp/types/export', {
            params: { format: 'csv', status: status === 'all' ? undefined : status },
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `adp_types_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error("Export failed", e);
        throw e;
    }
}

export const useSaveTypeMapping = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { adpTypeId: string, sdTypeId: string }) => {
             await api.post('/adp/types/map', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adpUniqueTypes'] });
            queryClient.invalidateQueries({ queryKey: ['adpMappings'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    })
}

// --- STATS ---
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/dashboard');
      const raw = normalizeObject(data);
      
      // Map potentially different backend keys to frontend expected keys
      return {
          totalMakes: raw.makes ?? raw.totalMakes ?? 0,
          totalModels: raw.models ?? raw.totalModels ?? 0,
          totalTypes: raw.types ?? raw.vehicleTypes ?? raw.totalTypes ?? 0,
          
          adpTotalMakes: raw.adpTotalMakes ?? 0,
          adpTotalModels: raw.adpTotalModels ?? 0,
          adpTotalTypes: raw.adpTotalTypes ?? 0,

          // New fields for specific view KPIs
          adpMappedMakes: raw.adpMappedMakes ?? 0,
          adpMappedTypes: raw.adpMappedTypes ?? 0,

          mappedCount: raw.mappedCount ?? raw.mapped ?? 0,
          unmappedCount: raw.unmappedCount ?? raw.unmapped ?? 0,
          missingModelCount: raw.missingModelCount ?? 0,
          missingMakeCount: raw.missingMakeCount ?? 0,
          localizationScore: raw.localizationScore ?? 0,
          
          ...raw
      };
    },
  });
};

export const useActivityLog = () => {
    return useQuery({
        queryKey: ['activity'],
        queryFn: async () => {
            const response = await api.get('/dashboard/activity').catch(() => ({ data: [] }));
            return normalizeArray(response.data);
        }
    })
}

export const useTrendStats = (from: string, to: string) => {
    return useQuery({
        queryKey: ['trends', from, to],
        queryFn: async () => {
            const response = await api.get('/dashboard/trends', { params: { from, to } }).catch(() => ({ data: [] }));
            return normalizeArray(response.data);
        }
    })
}