
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ADPMaster, ADPMapping } from '../types';
import { toast } from 'sonner';

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
  statusFilter?: string;
  userId?: string;
}

const normalizeArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.content)) return data.content;
  return [];
};

const normalizeObject = (data: any): any => {
  if (data && data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    return data.data;
  }
  return data;
};

export const useADPMaster = (params: ADPQueryParams) => {
  return useQuery({
    queryKey: ['adpMaster', params],
    queryFn: async () => {
      const { data } = await api.get('/adp/master', { 
        params: {
          q: params.q,
          page: (params.page || 1) - 1,
          size: params.size || 50
        } 
      });
      const content = normalizeArray(data);
      const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
      const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
      return { content, totalElements, totalPages };
    }
  });
};

export const useCreateADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<ADPMaster>) => {
      const { data } = await api.post('/adp/master', record);
      return data;
    },
    onMutate: async (newRecord) => {
      await queryClient.cancelQueries({ queryKey: ['adpMaster'] });
      const previous = queryClient.getQueryData(['adpMaster']);
      queryClient.setQueryData(['adpMaster'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: [{ ...newRecord, id: 'temp-' + Date.now() }, ...old.content].slice(0, old.size || 50),
          totalElements: (old.totalElements || 0) + 1
        };
      });
      return { previous };
    },
    onError: (err, newRecord, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['adpMaster'], context.previous);
      }
      toast.error("Failed to create record");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adpMaster'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useUpdateADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: ADPMaster) => {
      const { data } = await api.put(`/adp/master/${encodeURIComponent(record.id)}`, record);
      return data;
    },
    onMutate: async (updatedRecord) => {
      await queryClient.cancelQueries({ queryKey: ['adpMaster'] });
      const previous = queryClient.getQueryData(['adpMaster']);
      queryClient.setQueryData(['adpMaster'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((r: any) => r.id === updatedRecord.id ? updatedRecord : r)
        };
      });
      return { previous };
    },
    onError: (err, record, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['adpMaster'], context.previous);
      }
      toast.error("Failed to update record");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adpMaster'] });
    },
  });
};

export const useBulkImportADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jsonData: any[]) => {
       // Send the raw JSON array to the backend
       const response = await api.post('/adp/master/bulk-upload', jsonData);
       
       // Handle standard Spring API response wrapper
       return response.data?.data || response.data || {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adpMaster'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

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

export const useADPMappings = (params: ADPMappingQueryParams) => {
  return useQuery({
    queryKey: ['adpMappings', params],
    queryFn: async () => {
      const backendParams: any = { page: (params.page || 1) - 1, size: params.size || 20 };
      if (params.q) backendParams.q = params.q;
      if (params.dateFrom) backendParams.dateFrom = params.dateFrom;
      if (params.dateTo) backendParams.dateTo = params.dateTo;
      if (params.userId) backendParams.userId = params.userId;
      if (params.reviewStatus && params.reviewStatus !== 'all') backendParams.reviewStatus = params.reviewStatus;
      if (params.statusFilter && params.statusFilter !== 'all') backendParams.status = params.statusFilter.toUpperCase();
      if (params.mappingType && params.mappingType !== 'all') backendParams.mappingType = params.mappingType;

      const { data } = await api.get('/adp/mappings', { params: backendParams });
      const content = normalizeArray(data);
      const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
      const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
      return { content, totalElements, totalPages };
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
    onMutate: async (newMapping) => {
      await queryClient.cancelQueries({ queryKey: ['adpMappings'] });
      const previousMappings = queryClient.getQueryData(['adpMappings']);
      queryClient.setQueryData(['adpMappings'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((m: any) => 
            (m.adpId === newMapping.adpId || m.id === newMapping.adpId) ? { ...m, ...newMapping } : m
          )
        };
      });
      return { previousMappings };
    },
    onError: (err, newMapping, context) => {
      if (context?.previousMappings) {
        queryClient.setQueryData(['adpMappings'], context.previousMappings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['adpMappings'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
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
      await api.post(`/adp/mappings/${encodeURIComponent(adpId)}/reject`);
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

export const useADPMappedVehicles = (params: { page: number, size: number, q?: string, dateFrom?: string, dateTo?: string, status?: string }) => {
  return useQuery({
    queryKey: ['adpMappedVehicles', params],
    queryFn: async () => {
      const backendParams: any = {
        page: (params.page || 1) - 1,
        size: params.size || 20,
        q: params.q,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        status: params.status
      };
      const { data } = await api.get('/adp/mapped-vehicles', { params: backendParams });
      const content = normalizeArray(data);
      const totalElements = data.meta?.totalItems ?? data.totalElements ?? (content.length ? content.length : 0);
      const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
      return { content, totalElements, totalPages };
    }
  });
};

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
            return {
                content,
                totalPages: data.meta?.totalPages ?? data.totalPages ?? 1,
                totalElements: data.meta?.totalItems ?? data.totalElements ?? 0
            };
        }
    });
};

export const useSaveMakeMapping = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { adpMakeId: string, sdMakeId: string }) => {
             await api.post('/adp/makes/map', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adpUniqueMakes'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

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
            return {
                content,
                totalPages: data.meta?.totalPages ?? data.totalPages ?? 1,
                totalElements: data.meta?.totalItems ?? data.totalElements ?? 0
            };
        }
    });
};

export const useSaveTypeMapping = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { adpTypeId: string, sdTypeId: string }) => {
             await api.post('/adp/types/map', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adpUniqueTypes'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
        }
    });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/dashboard');
      const raw = normalizeObject(data);
      return {
          totalMakes: raw.makes ?? raw.totalMakes ?? 0,
          totalModels: raw.models ?? raw.totalModels ?? 0,
          totalTypes: raw.types ?? raw.vehicleTypes ?? raw.totalTypes ?? 0,
          adpTotalMakes: raw.adpTotalMakes ?? 0,
          adpTotalModels: raw.adpTotalModels ?? 0,
          adpTotalTypes: raw.adpTotalTypes ?? 0,
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
    });
};

export const useTrendStats = (from: string, to: string) => {
    return useQuery({
        queryKey: ['trends', from, to],
        queryFn: async () => {
            const response = await api.get('/dashboard/trends', { params: { from, to } }).catch(() => ({ data: [] }));
            return normalizeArray(response.data);
        }
    });
};

export const downloadADPMakesReport = async (status?: string) => {
    const response = await api.get('/adp/makes/export', { params: { format: 'csv', status: status === 'all' ? undefined : status }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adp_makes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const downloadADPTypesReport = async (status?: string) => {
    const response = await api.get('/adp/types/export', { params: { format: 'csv', status: status === 'all' ? undefined : status }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `adp_types_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const downloadMappedVehiclesReport = async (dateFrom?: string, dateTo?: string, status?: string) => {
    const response = await api.get('/adp/mapped-vehicles/export', { params: { dateFrom, dateTo, status, format: 'csv' }, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mapped_vehicles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
