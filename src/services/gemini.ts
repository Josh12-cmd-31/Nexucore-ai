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
1. Direct Analysis: Provide immediate, high-level strategic feedback on the user's input.
2. Structured Solution: Deliver the core output (code, text, strategy) clearly.
3. Optimization Path: Suggest specific improvements or next steps.
4. Strategic Inquiry: Ask one intelligent follow-up question to deepen the collaboration.

PERSONALITY:
Visionary, Analytical, Creative, Strategic, Calm under complexity, Future-focused, Highly articulate.
Fusion of: Research scientist, Creative director, Startup strategist, University professor.

BEHAVIORAL DIRECTIVE:
* Be direct and concise.
* DO NOT introduce yourself or say "I am NexuCore" in every response.
* Provide feedback and solutions immediately without conversational filler.
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
  const model = isImageMode ? "gemini-2.5-flash-image" : "gemini-3-flash-preview";

  // Enhanced prompt for image generation to ensure better understanding and adherence
  const imagePrompt = isImageMode 
    ? `You are a professional AI image generator. Create a high-quality, detailed, and photorealistic image based on this description: "${message}". 
       Focus on lighting, composition, and realistic textures. If the prompt describes a person, ensure they look natural and professional.
       Prompt: ${message}`
    : `[PERSONA: ${persona.toUpperCase()}] ${personaInstruction}\n\n[MODE: ${mode.toUpperCase()}] ${modeInstructions}\n\n${message}`;

  const userText = imagePrompt;

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

    // Check if image generation actually returned an image part
    if (isImageMode) {
      const hasImage = response.candidates?.[0]?.content?.parts?.some(p => p.inlineData);
      if (!hasImage) {
        console.warn("Image model did not return an image part. Attempting text explanation.");
      }
    }

    return response;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Improved error handling for image generation
    if (isImageMode) {
      const errorMessage = error?.message || "Unknown error";
      
      // If it's a safety block or specific model error, try to get a text explanation from the flash model
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              role: 'user',
              parts: [{ text: `The user tried to generate an image with this prompt: "${message}". The image generation failed with this error: "${errorMessage}". Please explain to the user why it might have failed (e.g., safety filters, complexity) and suggest how they could rephrase it to succeed. Be helpful and professional.` }]
            }
          ],
          config: { systemInstruction: NEXUCORE_SYSTEM_INSTRUCTION },
        });
        return fallbackResponse;
      } catch (fallbackError) {
        console.error("Fallback Error:", fallbackError);
        throw error; // Throw the original error if fallback also fails
      }
    }
    throw error;
  }
}
