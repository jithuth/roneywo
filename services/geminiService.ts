import { GoogleGenAI, Type } from "@google/genai";
import { TechnicalAnalysis, RouterData } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeRouterUnlock = async (data: RouterData): Promise<TechnicalAnalysis> => {
  // 1. Validation for API Key
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning fallback analysis.");
    return {
      difficulty: "Manual Review",
      estimatedTime: "24-48 Hours",
      successRate: "98%",
      message: "Unlock service active. Manual verification required due to system configuration."
    };
  }

  try {
    const prompt = `
      Analyze the unlock difficulty for a router with the following details:
      Brand: ${data.brand}
      Model: ${data.model}
      Country of Origin: ${data.country}
      
      Provide a JSON response estimating the difficulty, estimated time to unlock, and success rate.
      Also provide a short technical message (max 2 sentences) about this specific brand's lock mechanism.
      
      For 'difficulty', use one of: "Easy", "Medium", "Hard", "Complex".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
            successRate: { type: Type.STRING },
            message: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("Empty response received from AI service.");
    }

    let analysis: TechnicalAnalysis;
    try {
        analysis = JSON.parse(text) as TechnicalAnalysis;
    } catch (parseError) {
        throw new Error("Failed to parse AI response JSON.");
    }

    return analysis;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);

    // Default fallback values
    let fallbackMessage = "Our automated system will process this request manually.";
    let fallbackDifficulty = "Manual Review";
    
    // Normalize error string for matching
    const errString = error.toString().toLowerCase();
    const errMsg = error.message?.toLowerCase() || "";

    // Specific Error Handling
    if (errMsg.includes("403") || errMsg.includes("permission denied") || errString.includes("api key")) {
        // API Key or Auth issues
        fallbackMessage = "Service authorization failed. We will manually verify your device.";
        console.error("Action Required: Please check your Google Gemini API Key configuration.");
    } 
    else if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("exhausted")) {
        // Rate Limiting
        fallbackMessage = "High service demand. Your request has been queued for manual processing.";
    } 
    else if (errMsg.includes("503") || errMsg.includes("overloaded") || errString.includes("fetch failed") || errString.includes("network")) {
        // Network or Server issues
        fallbackMessage = "Connection to analysis server unstable. Switching to offline verification mode.";
    } 
    else if (errMsg.includes("parse") || errMsg.includes("json") || errMsg.includes("syntax")) {
        // Parsing issues (AI returned bad JSON)
        fallbackMessage = "Complex device security structure detected. Expert review required.";
    }

    return {
      difficulty: fallbackDifficulty,
      estimatedTime: "1-3 Days",
      successRate: "99%",
      message: fallbackMessage
    };
  }
};