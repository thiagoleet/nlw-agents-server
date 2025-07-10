import { GoogleGenAI } from "@google/genai";
import { env } from "../env.ts";

const gemimi = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const model = "gemini-2.5-flash";

export async function transcribeAudio(audioAsBase64: string, mimeType: string) {
  const response = await gemimi.models.generateContent({
    model,
    contents: [
      {
        text: "Transcreva o áudio para português do Brasil. Seja preciso e natural na transcrição. Mantenha a pontuação adequada e divida o texto em parágrafos quando for apropriado.",
      },
      {
        inlineData: {
          mimeType,
          data: audioAsBase64,
        },
      },
    ],
  });

  if (!response.text) {
    throw new Error("Não foi possível transcrever o áudio");
  }
  return response.text;
}

export async function generateEmbedings(text: string) {
  const response = await gemimi.models.embedContent({
    model: "text-embedding-004",
    contents: [{ text }],
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });

  if (!response.embeddings?.[0].values) {
    throw new Error("Não foi possível gerar os embeddings");
  }

  return response.embeddings[0].values;
}

export async function generateAnswer(
  question: string,
  transcriptions: string[]
) {
  const context = transcriptions.join("\n\n");
  const prompt = `
  Com base no texto fornecido abaixo como contexto, responda à pergunta de forma clara e precisa, em português do Brasil.

  CONTEXTO: 
  ${context}

  PERGUNTA:
  ${question}

  INSTRUÇÕES:
  - Use apenas informações contidas no contexto enviado;
  - Se a resposta não for encontrada no contexto, responda que não foi possível encontrar a resposta;
  - Seja objetivo;
  - Mantenha um tom educativo e profissional;
  - Cite trechos relevantes do contexto se apropriado;
  - Se for citar o contexto, utilize o termo "conteúdo da aula";
  `.trim();

  const response = await gemimi.models.generateContent({
    model,
    contents: [
      {
        text: prompt,
      },
    ],
  });

  if (!response.text) {
    throw new Error("Não foi possível gerar a resposta pelo Gemini");
  }

  return response.text;
}
