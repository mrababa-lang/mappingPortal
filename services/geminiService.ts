import { toast } from 'sonner';
import { GoogleGenAI, Type } from "@google/genai";

export const generateDescription = async (itemName: string, context: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Generate a concise and professional description for a vehicle item named "${itemName}". Context: ${context}.`
        }]
      }],
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `List 5 popular car models for the manufacturer "${makeName}".`
        }]
      }],
      config: {
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
    const json = JSON.parse(text);
    return json.suggestions || [];
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

export const suggestMapping = async (adpDescription: string): Promise<{ make: string, model: string } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Extract the vehicle Manufacturer (make) and Model from this raw description: "${adpDescription}". If you cannot find them, return empty strings.`
        }]
      }],
      config: {
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
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Mapping Error:", error);
    toast.error("Failed to get AI suggestion");
    return null;
  }
};