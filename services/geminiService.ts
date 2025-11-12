import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WhiteboardContent, LiveSegmentData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const whiteboardSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A concise and engaging title for the topic.',
    },
    introduction: {
      type: Type.STRING,
      description: 'A brief, one-paragraph introduction to the topic.',
    },
    sections: {
      type: Type.ARRAY,
      description: 'An array of sections that break down the topic.',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: 'A clear and descriptive heading for this section.',
          },
          explanation: {
            type: Type.STRING,
            description: 'A detailed but easy-to-understand explanation of this part of the topic. Use markdown for formatting like **bold** and *italics*. Keep paragraphs short and use newlines.',
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'A creative, detailed, and contextually-aware prompt for an image generation model. The prompt should specify artistic style (e.g., "chalkboard sketch," "infographic," "vector illustration"), composition, and mood to create a beautiful and relevant visual aid.',
          },
        },
        required: ['heading', 'explanation', 'imagePrompt'],
      },
    },
  },
  required: ['title', 'introduction', 'sections'],
};

export const generateExplanation = async (topic: string): Promise<WhiteboardContent> => {
  const model = 'gemini-2.5-pro';

  const prompt = `You are an expert educator and creative director. Your task is to break down a complex topic into an easy-to-understand visual explanation for a digital whiteboard.

Topic: "${topic}"

Please generate the content for the whiteboard in a structured JSON format. For each section, provide a clear heading, a detailed explanation (using simple markdown), and a highly descriptive "imagePrompt". The image prompt should act as a creative brief for an AI artist, specifying style, composition, and mood to ensure the visuals are stunning and educational. Provide at least 3 sections.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: whiteboardSchema,
    },
  });

  const jsonText = response.text.trim();
  try {
    const parsed = JSON.parse(jsonText);
    parsed.sections.forEach((section: any) => {
        section.imageUrl = undefined;
    });
    return parsed as WhiteboardContent;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText, e);
    throw new Error("The model returned an invalid format. Please try again.");
  }
};

const liveSegmentSchema = {
    type: Type.OBJECT,
    properties: {
        keyIdea: {
            type: Type.STRING,
            description: "A concise, catchy heading for the main concept discussed in the latest transcript segment."
        },
        detailedExplanation: {
            type: Type.STRING,
            description: "A well-structured explanation of the concept. Use markdown (**bold**, *italics*, newlines) for clarity. This will be the main text on the whiteboard."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A creative and contextually-aware prompt for an AI image generator. The prompt should reflect the overall topic's style (e.g., technical diagrams for science, infographics for business, conceptual art for philosophy) and vividly illustrate the core concept."
        }
    },
    required: ["keyIdea", "detailedExplanation", "imagePrompt"]
};

export const extractKeyIdeaFromTranscript = async (transcript: string, sessionContext: string): Promise<LiveSegmentData> => {
    const model = 'gemini-2.5-pro';
    
    const prompt = `You are an AI learning assistant with expertise in real-time summarization and visual concept generation. Your goal is to transform a live spoken lecture into a beautiful, illustrated digital whiteboard.

You will be given the overall context of the session so far, and the most recent transcript segment.

**Session Context (what has been discussed already):**
${sessionContext || "The session is just beginning."}

**Most Recent Transcript Segment (focus on this):**
"${transcript}"

**Your Task:**
1.  **Analyze:** Deeply understand the new transcript segment in light of the overall session context.
2.  **Identify Core Concept:** Pinpoint the single most important idea, definition, or example in the *new* segment.
3.  **Generate Content:** Based on this core concept, create a JSON output with the following fields:
    *   **keyIdea:** A short, clear heading for the concept (3-7 words).
    *   **detailedExplanation:** A structured explanation of the concept. Use markdown (**bold**, *italics*, newlines) for clarity.
    *   **imagePrompt:** A highly descriptive and creative prompt for an AI image generator that reflects the topic's style.

Do not repeat information already covered in the session context. Focus on making the whiteboard a clear, logical, and visually engaging learning tool.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: liveSegmentSchema
        }
    });

    const jsonText = response.text.trim();
    try {
        return JSON.parse(jsonText) as LiveSegmentData;
    } catch (e) {
        console.error("Failed to parse live segment JSON:", jsonText, e);
        throw new Error("The model returned an invalid format for the live segment.");
    }
};


export const generateImage = async (prompt: string): Promise<string> => {
  const model = 'gemini-2.5-flash-image';

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
  }

  throw new Error('Image generation failed. No image data received.');
};
