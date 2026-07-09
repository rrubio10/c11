export type DisplayOption = { key: string; label: string };

export function formatChoiceAnswer(answer: string, options: DisplayOption[]) {
  const normalized = answer.trim().toUpperCase();
  const option = options.find((candidate) => candidate.key.toUpperCase() === normalized);
  if (!option || option.label === option.key) return answer || "Not answered";
  return `${option.key} — ${option.label}`;
}

export function formatReviewPrompt(prompt: string, keyword?: string | null) {
  try {
    const parsed = JSON.parse(prompt) as { original?: string; second?: string };
    return [parsed.original, keyword, parsed.second].filter(Boolean).join("\n");
  } catch {
    return prompt;
  }
}
