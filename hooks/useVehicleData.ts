import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataService } from '../services/storageService';
import { Make } from '../types';
import { MOCK_DELAY } from '../constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useMakes = () => {
  return useQuery({
    queryKey: ['makes'],
    queryFn: async () => {
      await wait(MOCK_DELAY);
      return DataService.getMakes();
    },
  });
};

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      await wait(MOCK_DELAY);
      return DataService.getModels();
    },
  });
};

export const useTypes = () => {
  return useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      await wait(MOCK_DELAY);
      return DataService.getTypes();
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
      queryClient.invalidateQueries({ queryKey: ['adp_mappings'] }); // Assuming key usage elsewhere or future proofing
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
