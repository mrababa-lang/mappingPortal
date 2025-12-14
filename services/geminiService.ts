import { GoogleGenAI, Type } from "@google/genai";
import { DataService } from './storageService';

const isAIEnabled = () => {
  const config = DataService.getAppConfig();
  return config.enableAI;
};

const getApiKey = () => {
  const config = DataService.getAppConfig();
  // Prioritize User Configured Key, then Environment Variable
  return config.apiKey || process.env.API_KEY || '';
};

const getClient = () => {
  const key = getApiKey();
  return new GoogleGenAI({ apiKey: key });
};

export const generateDescription = async (itemName: string, context: string): Promise<string> => {
  if (!isAIEnabled()) {
    return "AI generation is disabled in configuration.";
  }
  
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return `AI Description unavailable for ${itemName} (Missing API Key).`;
  }

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a professional, concise (max 2 sentences) description for a vehicle ${context}: "${itemName}". Do not include quotes.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `AI Description unavailable for ${itemName}.`;
  }
};

export const suggestModels = async (makeName: string): Promise<string[]> => {
  if (!isAIEnabled()) {
    return [];
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return [];
  }

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `List 3 popular car model names for the manufacturer "${makeName}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const suggestMapping = async (adpDescription: string): Promise<{ makeId?: string, modelId?: string, reasoning?: string } | null> => {
  if (!isAIEnabled()) {
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return null;
  }

  const makes = DataService.getMakes();
  const models = DataService.getModels();
  
  // Create a context string of available makes/models for the AI to choose from
  const contextData = {
    makes: makes.map(m => ({ id: m.id, name: m.name })),
    models: models.map(m => ({ id: m.id, name: m.name, makeId: m.makeId }))
  };

  try {
    const ai = getClient();
    const prompt = `
      You are an expert vehicle data mapper. 
      I have an ADP Vehicle Description: "${adpDescription}".
      
      Map this to the closest matching Make and Model from the following JSON list:
      ${JSON.stringify(contextData)}
      
      Return JSON only: { "makeId": "string", "modelId": "string", "reasoning": "string" }.
      If no close match is found, return null values for IDs.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             makeId: { type: Type.STRING, nullable: true },
             modelId: { type: Type.STRING, nullable: true },
             reasoning: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini Suggest Error:", error);
    return null;
  }
};