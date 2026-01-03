import { GoogleGenerativeAI } from "@google/generative-ai";
import { StudentData } from "../types";

// A TUA CHAVE (Mantém-se a mesma)
const GEN_AI_KEY = "AIzaSyBb7sKKicuLBwCYCEEwy4r_HIeVjCg3FmI";

export const extractDataFromSheetsText = async (text: string, apiKey: string): Promise<StudentData[]> => {
    // Inicializa a biblioteca
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
    
    // ATENÇÃO: Usamos agora o "gemini-2.0-flash" que está na tua lista!
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

    const prompt = `
      You are a data extraction assistant.
      Analyze the following text from a school grade sheet.
      Extract a list of students with their grades.
      
      Return ONLY a valid JSON array. Do not include markdown code blocks.
      
      The JSON objects must have these exact keys:
      "numero" (number), "aluno" (string), "portugues" (number or null), "ingles" (number or null), "matematica" (number or null), "psicologia" (number or null), "quimica" (number or null), "educacaoFisica" (number or null), "emrc" (number or null).

      Treat empty values, "-", or missing grades as 0 or null.
      Convert comma decimals (e.g., "12,5") to dots (e.g., 12.5).

      Data Text:
      ${text}
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      if (!responseText) {
        throw new Error("A IA devolveu uma resposta vazia.");
      }

      // Limpeza de segurança para garantir que o JSON é válido
      const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(cleanText);
      
    } catch (e: any) {
      console.error("ERRO NO GEMINI SERVICE:", e);
      // Mostra o erro de forma mais amigável
      alert("Erro de IA: " + (e.message || "Falha desconhecida"));
      return [];
    }
};
