import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function testGroupLabel(group: string) {
  const labels: Record<string, string> = {
    ADV5_T1: "Advanced 5 · Test 1",
    ADV5_T2: "Advanced 5 · Test 2",
    ADV5_T3: "Advanced 5 · Test 3",
    ADV5_T4: "Advanced 5 · Test 4",
    SAMPLE1: "Sample Test 1",
    SAMPLE2: "Sample Test 2",
    STANDALONE: "Independent practice",
    MEGA_KWT: "Mega Key Word Transformations",
  };
  return labels[group] ?? group.replaceAll("_", " ");
}
