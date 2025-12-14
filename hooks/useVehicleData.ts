import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataService } from '../services/storageService';
import { Make, Model, VehicleType, ADPMaster, ADPMapping, User } from '../types';
import { MOCK_DELAY } from '../constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MAKES ---
export const useMakes = () => {
  return useQuery({
    queryKey: ['makes'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2); // Faster read
      return DataService.getMakes();
    },
  });
};

export const useCreateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Make) => {
      await wait(MOCK_DELAY);
      const makes = DataService.getMakes();
      DataService.saveMakes([...makes, make]);
      return make;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
    },
  });
};

export const useUpdateMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (make: Make) => {
      await wait(MOCK_DELAY);
      const makes = DataService.getMakes();
      const updated = makes.map((m) => (m.id === make.id ? make : m));
      DataService.saveMakes(updated);
      return make;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
    },
  });
};

export const useDeleteMake = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await wait(MOCK_DELAY);
      // Logic for cascading delete
      const allModels = DataService.getModels();
      const modelsToDelete = allModels.filter((m) => m.makeId === id);
      const modelIdsToDelete = new Set(modelsToDelete.map((m) => m.id));
      const remainingModels = allModels.filter((m) => m.makeId !== id);
      DataService.saveModels(remainingModels);

      const allMappings = DataService.getADPMappings();
      const updatedMappings = allMappings.filter((m) => {
        const linksToDeletedModel = m.modelId && modelIdsToDelete.has(m.modelId);
        const linksToDeletedMake = m.makeId === id;
        return !linksToDeletedModel && !linksToDeletedMake;
      });
      DataService.saveADPMappings(updatedMappings);

      const makes = DataService.getMakes();
      const remainingMakes = makes.filter((m) => m.id !== id);
      DataService.saveMakes(remainingMakes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['adp_mappings'] });
    },
  });
};

export const useBulkImportMakes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMakes: Make[]) => {
      await wait(MOCK_DELAY);
      const makes = DataService.getMakes();
      const updated = [...makes, ...newMakes];
      DataService.saveMakes(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['makes'] });
    },
  });
};

// --- MODELS ---
export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2);
      return DataService.getModels();
    },
  });
};

export const useCreateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
      await wait(MOCK_DELAY);
      const models = DataService.getModels();
      DataService.saveModels([...models, model]);
      return model;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
      await wait(MOCK_DELAY);
      const models = DataService.getModels();
      const updated = models.map((m) => (m.id === model.id ? model : m));
      DataService.saveModels(updated);
      return model;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await wait(MOCK_DELAY);
      // Clean up Mappings
      const allMappings = DataService.getADPMappings();
      const updatedMappings = allMappings.filter(m => m.modelId !== id);
      DataService.saveADPMappings(updatedMappings);

      // Delete Model
      const models = DataService.getModels();
      const remainingModels = models.filter(m => m.id !== id);
      DataService.saveModels(remainingModels);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      queryClient.invalidateQueries({ queryKey: ['adp_mappings'] });
    },
  });
};

export const useBulkImportModels = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newModels: Model[]) => {
      await wait(MOCK_DELAY);
      const models = DataService.getModels();
      const updated = [...models, ...newModels];
      DataService.saveModels(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
};

// --- TYPES ---
export const useTypes = () => {
  return useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2);
      return DataService.getTypes();
    },
  });
};

export const useCreateType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: VehicleType) => {
      await wait(MOCK_DELAY);
      const types = DataService.getTypes();
      DataService.saveTypes([...types, type]);
      return type;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
    },
  });
};

export const useUpdateType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: VehicleType) => {
      await wait(MOCK_DELAY);
      const types = DataService.getTypes();
      const updated = types.map((t) => (t.id === type.id ? type : t));
      DataService.saveTypes(updated);
      return type;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
    },
  });
};

export const useDeleteType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await wait(MOCK_DELAY);
      const types = DataService.getTypes();
      const filtered = types.filter(t => t.id !== id);
      DataService.saveTypes(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
    },
  });
};

export const useBulkImportTypes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTypes: VehicleType[]) => {
      await wait(MOCK_DELAY);
      const types = DataService.getTypes();
      const updated = [...types, ...newTypes];
      DataService.saveTypes(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
    },
  });
};

// --- ADP MASTER ---
export const useADPMaster = () => {
  return useQuery({
    queryKey: ['adp_master'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2);
      return DataService.getADPMaster();
    },
  });
};

export const useCreateADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ADPMaster) => {
      await wait(MOCK_DELAY);
      const list = DataService.getADPMaster();
      DataService.saveADPMaster([...list, item]);
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adp_master'] });
    },
  });
};

export const useUpdateADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: ADPMaster) => {
      await wait(MOCK_DELAY);
      const list = DataService.getADPMaster();
      const updated = list.map((i) => (i.id === item.id ? item : i));
      DataService.saveADPMaster(updated);
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adp_master'] });
    },
  });
};

export const useDeleteADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await wait(MOCK_DELAY);
      // Delete Mappings
      const mappings = DataService.getADPMappings();
      const updatedMappings = mappings.filter(m => m.adpId !== id);
      DataService.saveADPMappings(updatedMappings);

      // Delete Item
      const list = DataService.getADPMaster();
      const filtered = list.filter(i => i.id !== id);
      DataService.saveADPMaster(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adp_master'] });
      queryClient.invalidateQueries({ queryKey: ['adp_mappings'] });
    },
  });
};

export const useBulkImportADPMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newItems: ADPMaster[]) => {
      await wait(MOCK_DELAY);
      const list = DataService.getADPMaster();
      const updated = [...list, ...newItems];
      DataService.saveADPMaster(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adp_master'] });
    },
  });
};

// --- ADP MAPPINGS ---
export const useADPMappings = () => {
  return useQuery({
    queryKey: ['adp_mappings'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2);
      return DataService.getADPMappings();
    },
  });
};

// Generic save for bulk or complex list updates
export const useSaveADPMappings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mappings: ADPMapping[]) => {
      await wait(MOCK_DELAY);
      DataService.saveADPMappings(mappings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adp_mappings'] });
    },
  });
};

// --- USERS ---
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      await wait(MOCK_DELAY / 2);
      return DataService.getUsers();
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      await wait(MOCK_DELAY);
      const users = DataService.getUsers();
      DataService.saveUsers([...users, user]);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: User) => {
      await wait(MOCK_DELAY);
      const users = DataService.getUsers();
      const updated = users.map((u) => (u.id === user.id ? user : u));
      DataService.saveUsers(updated);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await wait(MOCK_DELAY);
      const users = DataService.getUsers();
      const filtered = users.filter(u => u.id !== id);
      DataService.saveUsers(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
