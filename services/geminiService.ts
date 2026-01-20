
import { GoogleGenAI } from "@google/genai";
import { Job, Installer } from '../types';

export const generateBusinessReport = async (jobs: Job[], installers: Installer[]): Promise<string> => {
  try {
    // Initializing Gemini SDK following mandatory patterns
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare data summary for the prompt
    const summary = {
      totalJobs: jobs.length,
      revenue: jobs.reduce((acc, j) => acc + j.value, 0),
      installersCount: installers.length,
      recentJobs: jobs.slice(0, 5).map(j => ({ status: j.status, val: j.value, date: j.date })),
      paymentIssues: jobs.filter(j => j.paymentStatus === 'Atrasado').length
    };

    const prompt = `
      Atue como um consultor de negócios experiente em gestão de obras e construção civil.
      Analise os seguintes dados brutos da minha empresa de instalações:
      ${JSON.stringify(summary)}

      Forneça um relatório executivo curto (máximo 3 parágrafos) em Português do Brasil.
      Foque em:
      1. Saúde financeira atual.
      2. Eficiência operacional.
      3. Uma sugestão prática para melhoria baseada nos dados (ex: cobrar atrasados, aumentar equipe, etc).
      
      Use formatação Markdown simples.
    `;

    // Updated to gemini-3-flash-preview as per model selection guidelines for general text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Accessing .text property directly instead of calling a method
    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Erro ao conectar com a Inteligência Artificial. Tente novamente mais tarde.";
  }
};
