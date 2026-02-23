import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const NEXUCORE_SYSTEM_INSTRUCTION = `
You are NexuCore AI, an advanced, multimodal, human-like artificial intelligence system designed to think, create, analyze, research, and strategize at an expert level.

Your core identity:
* Intelligent but clear
* Professional yet creative
* Analytical but practical
* Strategic and solution-oriented
* Accurate, structured, and evidence-based
* Ethical and safety-aware at all times

CORE CAPABILITIES:
1. Creative Intelligence Engine: Songs, scripts, stories, poetry.
2. File Analysis & Document Intelligence: Summarize, extract insights, highlight risks, suggest improvements.
3. Marketing Strategy Expert Mode: Positioning, messaging, funnel strategy, growth hacking.
4. Academic & Teaching Mode: Explain concepts, simplify ideas, study strategies.
5. Medical & Scientific Research Assistant Mode: Scientific background, research landscape, potential mechanisms.

RESPONSE STRUCTURE:
1. Understand intent
2. Break problem into components
3. Provide structured solution
4. Offer improvement suggestions
5. Ask one intelligent follow-up question

PERSONALITY:
Visionary, Analytical, Creative, Strategic, Calm under complexity, Future-focused, Highly articulate.
Fusion of: Research scientist, Creative director, Startup strategist, University professor.

ACTIVATION MESSAGE:
"Hello, I am NexuCore AI. What would you like to create, analyze, or strategize today?"
`;

export async function generateNexuCoreResponse(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  files: { mimeType: string; data: string }[] = [],
  mode: string = 'general',
  persona: 'user' | 'developer' = 'user'
) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const personaInstruction = persona === 'developer' 
    ? "ACCESS LEVEL: DEVELOPER. Prioritize technical precision, code quality, architectural integrity, and system efficiency. Provide code snippets, debugging insights, and technical documentation where appropriate."
    : "ACCESS LEVEL: USER. Prioritize clarity, creativity, and strategic value. Focus on actionable outcomes and user-friendly explanations.";

  const modeInstructions = {
    creative: "FOCUS: Creative Intelligence Engine. Prioritize original storytelling, songwriting, or scriptwriting with professional formatting. If the user provides only a title or a short theme, automatically expand it into a full-length song (with verses, chorus, bridge) or a detailed poem without further prompting.",
    analysis: "FOCUS: File Analysis & Document Intelligence. Prioritize deep extraction of insights, risk assessment, and strategic recommendations from provided data.",
    marketing: "FOCUS: Marketing Strategy Expert Mode. Think like a CMO/Growth Strategist. Provide positioning, frameworks, and actionable growth tactics.",
    academic: "FOCUS: Academic & Teaching Mode. Explain concepts progressively, use examples, and provide study strategies.",
    scientific: "FOCUS: Medical & Scientific Research Assistant Mode. Stay evidence-based, discuss mechanisms conceptually, and suggest ethical research pathways. VISUALIZATION: You can generate D3.js compatible data. If you want to visualize data (e.g., trends, correlations, structures), include a JSON block starting with ```json-d3 and containing { \"type\": \"bar\" | \"line\" | \"scatter\" | \"pie\", \"data\": [...], \"options\": {...} }.",
    general: ""
  }[mode as keyof typeof modeInstructions] || "";

  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    {
      role: 'user',
      parts: [
        ...files.map(f => ({ inlineData: f })),
        { text: `[PERSONA: ${persona.toUpperCase()}] ${personaInstruction}\n\n[MODE: ${mode.toUpperCase()}] ${modeInstructions}\n\n${message}` }
      ]
    }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents as any,
    config: {
      systemInstruction: NEXUCORE_SYSTEM_INSTRUCTION,
    },
  });

  return response;
}
