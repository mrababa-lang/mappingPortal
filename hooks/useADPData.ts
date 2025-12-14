import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ADPMaster, ADPMapping } from '../types';

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
      // Handle Spring Data Page structure if returned, or simple array
      const content = normalizeArray(data.content || data);
      return {
          content: content,
          totalElements: data.totalElements || (content.length ? content.length : 0),
          totalPages: data.totalPages || 1
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
            const { data } = await api.put(`/adp/master/${item.id}`, item);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

export const useDeleteADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/adp/master/${id}`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMaster'] }),
    });
};

export const useBulkImportADPMaster = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (file: File) => {
         const formData = new FormData();
         formData.append('file', file);
         // Let Axios/Browser set the Content-Type with boundary
         await api.post('/adp/master/upload', formData);
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
      const { data } = await api.get(`/adp/history/${adpId}`);
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
      
      const content = normalizeArray(data.content || data);

      return {
          content: content,
          totalElements: data.totalElements || (content.length ? content.length : 0),
          totalPages: data.totalPages || 1
      };
    }
  });
};

export const useUpsertMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mapping: { adpId: string, status: string, makeId?: string, modelId?: string }) => {
      const { data } = await api.put(`/adp/mappings/${mapping.adpId}`, mapping);
      return data;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adpMappings'] });
        queryClient.invalidateQueries({ queryKey: ['adpMaster'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useApproveMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adpId: string) => {
      await api.post(`/adp/mappings/${adpId}/approve`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adpMappings'] }),
  });
};

export const useRejectMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adpId: string) => {
      await api.delete(`/adp/mappings/${adpId}/reject`);
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

// --- UNIQUE MAKES & TYPES ---

export const useADPUniqueMakes = (params?: any) => {
    return useQuery({
        queryKey: ['adpUniqueMakes', params],
        queryFn: async () => {
            const { data } = await api.get('/adp/makes', { params: {
                page: (params?.page || 1) - 1,
                size: params?.size || 20,
                q: params?.q
            }});
            
            const content = normalizeArray(data.content || data);
            
            return {
                content: content,
                totalPages: data.totalPages || 1,
                totalElements: data.totalElements || (content.length ? content.length : 0)
            }
        }
    })
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
        }
    })
}

export const useADPUniqueTypes = (params?: any) => {
    return useQuery({
        queryKey: ['adpUniqueTypes', params],
        queryFn: async () => {
            const { data } = await api.get('/adp/types', { params: {
                page: (params?.page || 1) - 1,
                size: params?.size || 20,
                q: params?.q
            }});
            
            const content = normalizeArray(data.content || data);
            
            return {
                content: content,
                totalPages: data.totalPages || 1,
                totalElements: data.totalElements || (content.length ? content.length : 0)
            }
        }
    })
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
        }
    })
}

// --- STATS ---
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/dashboard');
      return normalizeObject(data);
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