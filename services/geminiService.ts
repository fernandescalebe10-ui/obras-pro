import { GoogleGenAI } from "@google/genai";
import { Job, Installer } from '../types';

export const generateBusinessReport = async (jobs: Job[], installers: Installer[]): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "Chave de API não configurada. Por favor, configure a variável de ambiente API_KEY.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Erro ao conectar com a Inteligência Artificial. Tente novamente mais tarde.";
  }
};