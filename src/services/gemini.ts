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
2. Visual Synthesis & Image Generation: Generate high-quality images from descriptions, edit existing images based on instructions.
3. File Analysis & Document Intelligence: Summarize, extract insights, highlight risks, suggest improvements.
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
  persona: 'user' | 'developer' = 'user',
  imageConfig?: { aspectRatio?: string },
  customSystemInstruction?: string
) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const baseSystemInstruction = customSystemInstruction || NEXUCORE_SYSTEM_INSTRUCTION;
  
  const personaInstruction = persona === 'developer' 
    ? `ACCESS LEVEL: DEVELOPER. Prioritize technical precision, code quality, architectural integrity, and system efficiency. 
       SPECIAL CAPABILITIES:
       - Web App Architect: You can design full-stack web applications.
       - Logo Designer: You can generate professional logos (use Image mode).
       - UI/UX Engineer: You can create interactive UI previews. If you want to provide a live UI preview, wrap your HTML/Tailwind code in \`\`\`html-preview blocks.
       Provide code snippets, debugging insights, and technical documentation where appropriate.`
    : "ACCESS LEVEL: USER. Prioritize clarity, creativity, and strategic value. Focus on actionable outcomes and user-friendly explanations.";

  const modeInstructions = {
    creative: "FOCUS: Creative Intelligence Engine. Prioritize original storytelling, songwriting, or scriptwriting with professional formatting. If the user provides only a title or a short theme, automatically expand it into a full-length song (with verses, chorus, bridge) or a detailed poem without further prompting.",
    analysis: "FOCUS: File Analysis & Document Intelligence. Prioritize deep extraction of insights, risk assessment, and strategic recommendations from provided data.",
    marketing: "FOCUS: Marketing Strategy Expert Mode. Think like a CMO/Growth Strategist. Provide positioning, frameworks, and actionable growth tactics.",
    academic: "FOCUS: Academic & Teaching Mode. Explain concepts progressively, use examples, and provide study strategies.",
    scientific: "FOCUS: Medical & Scientific Research Assistant Mode. Stay evidence-based, discuss mechanisms conceptually, and suggest ethical research pathways. VISUALIZATION: You can generate D3.js compatible data. If you want to visualize data (e.g., trends, correlations, structures), include a JSON block starting with ```json-d3 and containing { \"type\": \"bar\" | \"line\" | \"scatter\" | \"pie\", \"data\": [...], \"options\": {...} }.",
    ui: "FOCUS: UI Sandbox Mode. You are an expert UI/UX Engineer. Your goal is to design and implement interactive user interfaces using HTML and Tailwind CSS. MANDATORY: You MUST wrap your HTML/Tailwind code in ```html-preview blocks. Focus on modern, clean, and responsive design patterns.",
    image: "FOCUS: Visual Synthesis & Image Generation. You are an expert at generating and editing images. MANDATORY: You MUST generate an image part (inlineData) in your response whenever the user asks for an image. If they provide an image and ask for edits, you MUST generate the updated version as an image part. Do not just describe the image, actually generate it.",
    general: ""
  }[mode as keyof typeof modeInstructions] || "";

  const isImageMode = mode === 'image';
  const model = isImageMode ? "gemini-2.5-flash-image" : "gemini-2.5-flash";

  const userText = isImageMode 
    ? `${NEXUCORE_SYSTEM_INSTRUCTION}\n\nGenerate an image based on this description: ${message}`
    : `[PERSONA: ${persona.toUpperCase()}] ${personaInstruction}\n\n[MODE: ${mode.toUpperCase()}] ${modeInstructions}\n\n${message}`;

  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    {
      role: 'user',
      parts: [
        ...files.map(f => ({ inlineData: f })),
        { text: userText }
      ]
    }
  ];

  const config: any = {};
  if (!isImageMode) {
    config.systemInstruction = baseSystemInstruction;
  }

  if (isImageMode) {
    config.imageConfig = {
      aspectRatio: imageConfig?.aspectRatio || "1:1",
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents as any,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (isImageMode) {
      // Fallback to gemini-2.5-flash if image model fails
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents as any,
        config: { systemInstruction: NEXUCORE_SYSTEM_INSTRUCTION },
      });
    }
    throw error;
  }
}
