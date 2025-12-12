import { TutorialContent } from "../types";
import { getTopicData } from "../data/curriculum";

// This service is now a static content provider.
// It keeps the async signature to be compatible with the existing component logic
// but resolves instantly.

export const fetchTutorialContent = async (topic: string): Promise<TutorialContent> => {
  return new Promise((resolve) => {
    // Simulate a micro-delay for UI smoothness, or resolve immediately
    // In a real static site, this is instant.
    const data = getTopicData(topic);
    setTimeout(() => {
      resolve(data);
    }, 50); 
  });
};