const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function parseNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NUMBER_WORDS[value.toLowerCase()];
}

export function inferWordLimit(instructions: string): { min: number; max: number } | null {
  const match = instructions.match(/between\s+(\w+)\s+and\s+(\w+)\s+words?/i);
  if (!match) return null;
  const min = parseNumber(match[1]);
  const max = parseNumber(match[2]);
  return min && max && min <= max ? { min, max } : null;
}
