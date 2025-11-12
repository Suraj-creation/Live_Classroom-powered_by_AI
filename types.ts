// Defines the structure for a single section in the main "Explain Topic" mode.
export interface WhiteboardSection {
  heading: string;
  explanation: string;
  imagePrompt: string;
  imageUrl?: string;
}

// Defines the overall structure for a generated whiteboard explanation.
export interface WhiteboardContent {
  title: string;
  introduction: string;
  sections: WhiteboardSection[];
}

// Defines the structure for the data part of a single, dynamically generated
// content block in the "Live Classroom" mode.
export interface LiveSegmentData {
    keyIdea: string;
    detailedExplanation: string;
    imagePrompt: string;
}

// Defines the full structure for a live content block, including the generated image URL.
export interface LiveSegment extends LiveSegmentData {
    id: string;
    imageUrl?: string;
}
