import { GoogleGenAI } from "@google/genai";
import { GroundingChunk } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GeminiResponse {
  text: string;
  groundingChunks?: GroundingChunk[];
}

export const sendMessageToGemini = async (
  message: string,
  context?: string,
  userLocation?: { lat: number; lng: number }
): Promise<GeminiResponse> => {
  if (!process.env.API_KEY) {
    return { text: "Error: API Key not found. Please configure process.env.API_KEY." };
  }

  try {
    const systemInstruction = `You are an intelligent assistant for a Map BI application. 
    You have access to data about Points of Interest (POIs) on the map via the context provided.
    You also have access to Google Maps to find real-world information about places.
    Context provided: ${context || 'No specific context'}.
    When analyzing, combine the context data with real-world knowledge if relevant.
    If using Google Maps to answer, ensure the information is relevant to the user's query.
    `;

    // Configure tools
    const config: any = {
      systemInstruction: systemInstruction,
      tools: [{ googleMaps: {} }],
    };

    // Add retrieval config if location is available
    if (userLocation) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLocation.lat,
                    longitude: userLocation.lng
                }
            }
        };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: config,
    });
    
    // Extract grounding chunks if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;

    return {
        text: response.text || "I couldn't generate a response.",
        groundingChunks: chunks
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: `Error: ${error.message || 'Something went wrong with the AI service.'}` };
  }
};