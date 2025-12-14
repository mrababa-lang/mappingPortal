import { api } from './api';
import { toast } from 'sonner';

export const generateDescription = async (itemName: string, context: string): Promise<string> => {
  try {
    const { data } = await api.post('/ai/generate-description', { name: itemName, context });
    return data.description || "";
  } catch (error) {
    console.error("AI Generation Error:", error);
    toast.error("Failed to generate description via AI");
    return "";
  }
};

export const suggestModels = async (makeName: string): Promise<string[]> => {
  try {
    const { data } = await api.post('/ai/suggest-models', { makeName });
    return data.suggestions || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

export const suggestMapping = async (adpDescription: string): Promise<{ makeId?: string, modelId?: string, reasoning?: string } | null> => {
  try {
    const { data } = await api.post('/ai/suggest-mapping', { description: adpDescription });
    return data;
  } catch (error) {
    console.error("AI Mapping Error:", error);
    return null;
  }
};
