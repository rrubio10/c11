export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[‘’‛`´]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("en-GB");
}

export function countWords(input: string): number {
  const normalized = input.trim().replace(/\s+/g, " ");
  return normalized ? normalized.split(" ").length : 0;
}

export function containsKeywordUnchanged(answer: string, keyword?: string | null): boolean {
  if (!keyword) return true;
  const words = normalizeAnswer(answer).split(" ");
  return words.includes(normalizeAnswer(keyword));
}
