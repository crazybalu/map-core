import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

export const sendMessageToGemini = async (
  message: string,
  context?: string
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key not found. Please configure process.env.API_KEY.";
  }

  try {
    const systemInstruction = `You are an intelligent assistant for a Map BI application. 
    You have access to data about Points of Interest (POIs) on the map.
    Context provided: ${context || 'No specific context'}.
    When analyzing, be thorough and use your reasoning capabilities.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: {
          thinkingBudget: 32768, // Maximum budget for Gemini 3 Pro
        }
        // Note: maxOutputTokens is purposely omitted when using thinkingConfig 
        // to allow the model to balance thinking and output tokens, 
        // or it handles the budget internally.
      },
    });

    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `Error: ${error.message || 'Something went wrong with the AI service.'}`;
  }
};
