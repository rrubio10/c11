export type ParsedItem = {
  id: string;
  setId: string;
  number: number;
  correctAnswer: string;
  acceptedAnswers: string[];
  maxPoints: number;
  errorCategory: string;
  explanation: string;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  keyword?: string;
  baseWord?: string;
};

export type ParsedSet = {
  setId: string;
  section: string;
  part: number;
  type: string;
  level: string;
  title: string;
  sourcePages: string;
  transcriptionStatus: string;
  notes: string;
  itemCount: number;
  instructions: string;
  fullText: string;
  testGroup: string;
  items: ParsedItem[];
};

export type ParseReport = { sets: ParsedSet[]; errors: string[]; warnings: string[] };
