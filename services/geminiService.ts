import { api } from './api';
import { toast } from 'sonner';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDescription = async (itemName: string, context: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a concise and professional description for a vehicle item named "${itemName}". Context: ${context}.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Generation Error:", error);
    toast.error("Failed to generate description via AI");
    return "";
  }
};

export const suggestModels = async (makeName: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 5 popular car models for the manufacturer "${makeName}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const json = JSON.parse(text);
    return json.suggestions || [];
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