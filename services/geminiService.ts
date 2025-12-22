
import { toast } from 'sonner';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Strips markdown code blocks from a string if present.
 */
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|```/g, '').trim();
};

const getAIClient = (providedKey?: string) => {
  const key = providedKey || process.env.API_KEY;
  if (!key) {
    throw new Error("Gemini API Key is missing. Please check system configuration.");
  }
  return new GoogleGenAI({ apiKey: key });
};

export const generateDescription = async (itemName: string, context: string, apiKey?: string, systemInstruction?: string): Promise<string> => {
  try {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a concise and professional description for a vehicle item named "${itemName}". Context: ${context}.`,
      config: {
        systemInstruction: systemInstruction || "You are a professional vehicle data specialist. Provide technical and accurate descriptions."
      }
    });
    return response.text || "";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    toast.error(error.message || "Failed to generate description via AI");
    return "";
  }
};

export const suggestModels = async (makeName: string, apiKey?: string, systemInstruction?: string): Promise<string[]> => {
  try {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `List 5 popular car models for the manufacturer "${makeName}".`,
      config: {
        systemInstruction: systemInstruction || "You are a professional automotive researcher.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions"]
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const cleanedText = cleanJsonString(text);
    const json = JSON.parse(cleanedText);
    return json.suggestions || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

export const suggestMapping = async (adpDescription: string, apiKey?: string, systemInstruction?: string): Promise<{ make: string, model: string } | null> => {
  try {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Extract the vehicle Manufacturer (make) and Model from this raw description: "${adpDescription}". If you cannot find them, return empty strings.`,
      config: {
        systemInstruction: systemInstruction || "You are a data cleaning specialist specializing in automotive ERP exports. Match raw strings to normalized vehicle makes and models.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            make: { type: Type.STRING },
            model: { type: Type.STRING }
          },
          required: ["make", "model"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("AI Mapping Error:", error);
    return null;
  }
};
