import contentOverrides from "@/data/exercise-content-overrides.json";

export type RuntimeOption = { key: string; label: string };
export type RuntimeItemOverride = {
  prompt: string;
  options: RuntimeOption[];
  keyword: string | null;
  baseWord: string | null;
};
export type RuntimeSetOverride = {
  title: string;
  instructions: string;
  fullText: string;
  transcriptionStatus: string;
  notes: string;
  items: Record<string, RuntimeItemOverride>;
};

const overrides = contentOverrides as Record<string, RuntimeSetOverride>;

export function getExerciseContentOverride(externalId: string) {
  return overrides[externalId] ?? null;
}

export function hasExerciseContentOverride(externalId: string) {
  return Boolean(overrides[externalId]);
}
