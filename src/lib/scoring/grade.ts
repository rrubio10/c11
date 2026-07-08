import { countWords, normalizeAnswer } from "./normalize";

export type Variant = { answer: string; points: number };
export type GradeInput = {
  answer: string;
  variants: Variant[];
  maximumPoints: number;
  part: number;
  keyword?: string | null;
  wordLimit?: { min: number; max: number } | null;
};

export type GradeResult = {
  normalizedAnswer: string;
  awardedPoints: number;
  isCorrect: boolean;
  status: "CORRECT" | "INCORRECT" | "PARTIAL";
  validation: { wordCount: number; wordLimitValid: boolean; keywordUsed: boolean };
};

export function gradeAnswer(input: GradeInput): GradeResult {
  const normalizedAnswer = normalizeAnswer(input.answer);
  const wordCount = countWords(input.answer);
  const wordLimitValid = !input.wordLimit || (wordCount >= input.wordLimit.min && wordCount <= input.wordLimit.max);
  const keywordUsed = !input.keyword || normalizeAnswer(input.answer).split(" ").includes(normalizeAnswer(input.keyword));
  const match = input.variants.find((v) => normalizeAnswer(v.answer) === normalizedAnswer);
  const awardedPoints = match && wordLimitValid && keywordUsed ? Math.min(match.points, input.maximumPoints) : 0;
  return {
    normalizedAnswer,
    awardedPoints,
    isCorrect: awardedPoints === input.maximumPoints && input.maximumPoints > 0,
    status: awardedPoints === input.maximumPoints && input.maximumPoints > 0 ? "CORRECT" : awardedPoints > 0 ? "PARTIAL" : "INCORRECT",
    validation: { wordCount, wordLimitValid, keywordUsed },
  };
}
