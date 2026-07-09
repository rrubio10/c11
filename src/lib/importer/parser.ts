import { createHash } from "node:crypto";
import type { ParseReport, ParsedItem, ParsedSet } from "./types";
import { applyContentOverride } from "./content-overrides";

function fields(block: string) {
  const out: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z_][\w]*)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

export function deriveTestGroup(setId: string) {
  if (/^ADV5_T\d+_P\d+$/.test(setId)) return setId.replace(/_P\d+$/, "");
  if (/^SAMPLE\d+_P\d+$/.test(setId)) return setId.replace(/_P\d+$/, "");
  if (setId.startsWith("MEGA_KWT")) return "MEGA_KWT";
  if (setId.startsWith("STANDALONE")) return "STANDALONE";
  return setId.replace(/_P\d+$/, "");
}

function splitInstructions(fullText: string, title: string) {
  const index = fullText.indexOf(title);
  if (index <= 0) return fullText.split(/\n\n/).slice(0, 2).join("\n\n").trim();
  return fullText.slice(0, index).trim();
}


function parseExplicitOptions(value?: string) {
  if (!value?.trim()) return [] as Array<{ key: string; label: string }>;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const candidate = entry as { key?: unknown; label?: unknown };
          if (typeof candidate.key !== "string" || typeof candidate.label !== "string") return null;
          return { key: candidate.key.trim().toUpperCase(), label: candidate.label.trim() };
        })
        .filter((entry): entry is { key: string; label: string } => Boolean(entry));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed as Record<string, unknown>)
        .filter(([, label]) => typeof label === "string")
        .map(([key, label]) => ({ key: key.trim().toUpperCase(), label: String(label).trim() }));
    }
  } catch {
    return [];
  }
  return [];
}

function findOptions(fullText: string, number: number) {
  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const start = lines.findIndex((line) => new RegExp(`^${number}\\s+A\\s+`, "i").test(line));
  if (start < 0) return [];
  let joined = lines[start];
  for (let i = start + 1; i < Math.min(lines.length, start + 3); i += 1) {
    if (/^\d+\s+A\s+/i.test(lines[i])) break;
    joined += ` ${lines[i]}`;
    if (/\bD\s+\S+/.test(joined)) break;
  }
  const match = joined.match(/^\d+\s+A\s+(.+?)\s+B\s+(.+?)\s+C\s+(.+?)\s+D\s+(.+)$/i);
  if (!match) return [];
  return ["A", "B", "C", "D"].map((key, i) => ({ key, label: match[i + 1].trim() }));
}

function findQuestionSegment(fullText: string, number: number, nextNumber?: number) {
  const patterns = [new RegExp(`(?:^|\\n)${number}[.)]?\\s+`, "m"), new RegExp(`\\(${number}\\)`, "m")];
  let start = -1;
  for (const p of patterns) {
    const m = p.exec(fullText);
    if (m && (start < 0 || m.index < start)) start = m.index;
  }
  if (start < 0) return `Question ${number}`;
  let end = fullText.length;
  if (nextNumber) {
    const nextPatterns = [new RegExp(`(?:^|\\n)${nextNumber}[.)]?\\s+`, "m"), new RegExp(`\\(${nextNumber}\\)`, "m")];
    for (const p of nextPatterns) {
      const m = p.exec(fullText.slice(start + 1));
      if (m) end = Math.min(end, start + 1 + m.index);
    }
  }
  return fullText.slice(start, end).trim().slice(0, 1600);
}


function findOptionsInSegment(segment: string) {
  const lines = segment.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^([A-G])\s+(.+)$/);
    if (!m) continue;
    let label = m[2].trim();
    while (i + 1 < lines.length && !/^[A-G]\s+/.test(lines[i + 1]) && !/^\d+[.)]?\s+/.test(lines[i + 1])) {
      label += ` ${lines[++i].trim()}`;
    }
    out.push({ key: m[1], label });
  }
  return out;
}

function findGlobalOptionParagraphs(fullText: string, maxLetter = "G") {
  const tail = fullText.slice(Math.max(0, fullText.search(/(?:^|\n)A\s+/m)));
  const lines = tail.split(/\r?\n/);
  const out: Array<{ key: string; label: string }> = [];
  let current: { key: string; label: string } | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([A-G])\s+(.+)$/);
    if (m && m[1] <= maxLetter) {
      if (current) out.push(current);
      current = { key: m[1], label: m[2] };
    } else if (current && !/^\d+\s+/.test(line)) {
      current.label += ` ${line}`;
    }
  }
  if (current) out.push(current);
  return out.filter((o, i, arr) => arr.findIndex((x) => x.key === o.key) === i);
}


function findTrailingNumberQuestion(fullText: string, number: number) {
  const lines = fullText.split(/\r?\n/);
  const numberPattern = new RegExp(`(?:^|\\s)${number}\\s*$`);
  const index = lines.findIndex((line) => numberPattern.test(line.trim()));
  if (index < 0) return "";
  let start = index;
  let end = index;
  while (start > 0 && lines[start - 1].trim()) start -= 1;
  while (end + 1 < lines.length && lines[end + 1].trim() && !/^([A-G])$/.test(lines[end + 1].trim())) end += 1;
  return lines
    .slice(start, end + 1)
    .join(" ")
    .replace(new RegExp(`\\s*${number}\\s*`), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function choiceOptionsForMatching(fullText: string, part: number) {
  if (part === 7) return ["A", "B", "C", "D", "E", "F", "G"].map((key) => ({ key, label: `Paragraph ${key}` }));
  const range = fullText.match(/(?:reviews|reviewers|architects|consultants|sections|texts)\s*\(A\s*[–-]\s*([A-G])\)/i);
  const last = range?.[1] ?? "D";
  const letters = "ABCDEFG".slice(0, "ABCDEFG".indexOf(last) + 1).split("");
  const lower = fullText.toLowerCase();
  const noun = lower.includes("consultant")
    ? "Consultant"
    : lower.includes("review")
      ? "Reviewer"
      : lower.includes("architect")
        ? "Architect"
        : "Section";
  return letters.map((key) => ({ key, label: `${noun} ${key}` }));
}

function parseKwt(segment: string) {
  const lines = segment.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const keywordIndex = lines.findIndex((l, i) => i > 0 && /^[A-Z][A-Z'-]{1,20}$/.test(l));
  const keyword = keywordIndex >= 0 ? lines[keywordIndex] : undefined;
  const before = keywordIndex >= 0 ? lines.slice(0, keywordIndex).join(" ") : lines[0] ?? "";
  const after = keywordIndex >= 0 ? lines.slice(keywordIndex + 1).join(" ") : lines.slice(1).join(" ");
  return { keyword, prompt: JSON.stringify({ original: before.replace(/^\d+[.)]?\s*/, ""), second: after }) };
}

function findBaseWord(segment: string) {
  const candidates = [...segment.matchAll(/\b[A-Z]{3,}(?:-[A-Z]+)?\b/g)].map((m) => m[0]);
  return candidates.at(-1);
}

export function parseMaster(content: string): ParseReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const setBlocks = [...content.matchAll(/\[SET\]\r?\n([\s\S]*?)\r?\n\[\/SET\]/g)].map((m) => m[1]);
  const itemBlocks = [...content.matchAll(/\[ITEM\]\r?\n([\s\S]*?)\r?\n\[\/ITEM\]/g)].map((m) => m[1]);
  const itemIds = new Set<string>();
  const parsedRawItems = itemBlocks.map((block) => {
    const f = fields(block);
    if (!f.id || !f.set_id) errors.push(`ITEM missing id or set_id: ${block.slice(0, 80)}`);
    if (itemIds.has(f.id)) errors.push(`Duplicate item id: ${f.id}`);
    itemIds.add(f.id);
    return f;
  });
  const setIds = new Set<string>();
  const sets: ParsedSet[] = [];

  for (const block of setBlocks) {
    const metaPart = block.split(/\r?\ntext_begin\r?\n/)[0];
    const f = fields(metaPart);
    const textMatch = block.match(/text_begin\r?\n([\s\S]*?)\r?\ntext_end/);
    const fullText = textMatch?.[1] ?? "";
    if (!f.set_id) { errors.push("SET missing set_id"); continue; }
    if (setIds.has(f.set_id)) errors.push(`Duplicate set id: ${f.set_id}`);
    setIds.add(f.set_id);
    const rawItems = parsedRawItems.filter((item) => item.set_id === f.set_id).sort((a, b) => Number(a.number) - Number(b.number));
    const items: ParsedItem[] = rawItems.map((raw, index) => {
      const number = Number(raw.number);
      const nextNumber = rawItems[index + 1] ? Number(rawItems[index + 1].number) : undefined;
      const part = Number(f.part);
      const trailingQuestion = [6, 8].includes(part) ? findTrailingNumberQuestion(fullText, number) : "";
      const segment = trailingQuestion || findQuestionSegment(fullText, number, nextNumber);
      const accepted = (raw.accepted_answers || raw.correct_answer || "").split(/\s*\|\s*/).filter(Boolean);
      let prompt = raw.prompt?.trim() || segment;
      let keyword: string | undefined = raw.keyword?.trim() || undefined;
      let baseWord: string | undefined = raw.base_word?.trim() || undefined;
      let options = parseExplicitOptions(raw.options);
      if (options.length === 0) options = findOptions(fullText, number);
      if (options.length === 0) options = findOptionsInSegment(segment);
      if (part === 4 && (!raw.prompt?.trim() || !keyword)) {
        const kwt = parseKwt(segment);
        if (!raw.prompt?.trim()) prompt = kwt.prompt;
        if (!keyword) keyword = kwt.keyword;
      }
      if (part === 3 && !baseWord) baseWord = findBaseWord(segment);
      if (part === 7 && options.length === 0) options = findGlobalOptionParagraphs(fullText, "G");
      if ([6, 7, 8].includes(part) && options.length === 0) {
        options = choiceOptionsForMatching(fullText, part);
      }
      return {
        id: raw.id,
        setId: raw.set_id,
        number,
        correctAnswer: raw.correct_answer ?? "",
        acceptedAnswers: accepted,
        maxPoints: Number(raw.max_points ?? 1),
        errorCategory: raw.error_category ?? "",
        explanation: raw.explanation ?? "",
        prompt,
        options,
        keyword,
        baseWord,
      };
    });
    const itemCount = Number(f.item_count ?? 0);
    if (itemCount !== items.length) errors.push(`${f.set_id}: item_count=${itemCount}, imported=${items.length}`);
    sets.push(applyContentOverride({
      setId: f.set_id,
      section: f.section ?? "",
      part: Number(f.part ?? 0),
      type: f.type ?? "",
      level: f.level ?? "C1",
      title: f.title ?? f.set_id,
      sourcePages: f.source_pdf_pages ?? "",
      transcriptionStatus: f.transcription_status ?? "unknown",
      notes: f.notes ?? "",
      itemCount,
      instructions: splitInstructions(fullText, f.title ?? ""),
      fullText,
      testGroup: deriveTestGroup(f.set_id),
      items,
    }));
  }
  for (const item of parsedRawItems) if (!setIds.has(item.set_id)) errors.push(`Orphan item ${item.id}: set ${item.set_id} not found`);
  if (!sets.length) errors.push("No SET blocks found");
  return { sets, errors, warnings };
}

export function sourceHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}
