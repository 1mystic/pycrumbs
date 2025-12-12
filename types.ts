export interface Module {
  title: string;
  topics: string[];
}

export enum VisualizationType {
  NONE = 'none',
  MEMORY_BOX = 'memory_box', // Representing variables in memory
  FLOWCHART = 'flowchart',   // Simple text/box based flow
  LIST_ARRAY = 'list_array', // Visualizing list indices
  CONSOLE = 'console',       // Simple output simulation
  PLAYGROUND = 'playground'  // Interactive code editor and runner
}

export interface InteractiveData {
  type: VisualizationType;
  data: any; // Flexible payload based on type
  label?: string;
}

export interface Section {
  heading: string;
  content: string; // Can contain markdown
  codeBlock?: {
    language: string;
    code: string;
    output?: string;
  };
}

export interface TutorialContent {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  introduction: string;
  sections: Section[];
  interactiveElement?: InteractiveData;
  realWorldExample: string;
  summary: string;
}