"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Menu,
  PencilLine,
  Send,
  Wifi,
} from "lucide-react";
import { countWords } from "@/lib/scoring/normalize";
import { inferWordLimit } from "@/lib/scoring/word-limit";
import { cn } from "@/lib/utils";

type Option = { key: string; label: string };
type Item = {
  id: string;
  externalId: string;
  number: number;
  prompt: string;
  options: Option[];
  keyword?: string | null;
  baseWord?: string | null;
  maximumPoints: number;
  displayOrder: number;
  answer: string;
};
type SetData = {
  id: string;
  externalId: string;
  section: string;
  part: number;
  type: string;
  level: string;
  title: string;
  instructions: string;
  fullText: string;
  sourcePages: string;
  transcriptionStatus: string;
  notes: string;
  itemCount: number;
  testGroup: string;
  items: Item[];
};
type AttemptData = {
  attempt: {
    id: string;
    status: string;
    startedAt: string | Date;
    timeSpentSeconds: number;
    currentItemExternalId?: string | null;
  };
  sets: SetData[];
};
type FlatItem = Item & { setId: string; part: number };

export function ExamRunner({ data }: { data: AttemptData }) {
  const router = useRouter();
  const allItems = useMemo<FlatItem[]>(
    () => data.sets.flatMap((set) => set.items.map((item) => ({ ...item, setId: set.externalId, part: set.part }))),
    [data.sets],
  );
  const initialIndex = Math.max(0, allItems.findIndex((item) => item.externalId === data.attempt.currentItemExternalId));
  const [index, setIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(allItems.map((item) => [item.id, item.answer])));
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState("Saved");
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(Date.now() - data.attempt.timeSpentSeconds * 1000);
  const [elapsed, setElapsed] = useState(data.attempt.timeSpentSeconds);
  const debounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const current = allItems[index];
  const set = data.sets.find((candidate) => candidate.externalId === current.setId)!;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const persist = () => {
      void save(current.id, answers[current.id] ?? "", current.externalId, true);
    };
    window.addEventListener("pagehide", persist);
    return () => window.removeEventListener("pagehide", persist);
  });

  async function save(itemId: string, answer: string, currentExternalId: string, keepalive = false) {
    setSaved("Saving…");
    try {
      const response = await fetch(`/api/attempts/${data.attempt.id}/answers`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId, answer, elapsedSeconds: elapsed, currentItemExternalId: currentExternalId }),
        keepalive,
      });
      setSaved(response.ok ? "Saved" : "Save failed");
    } catch {
      setSaved("Save failed");
    }
  }

  function update(item: Item, value: string, immediate = false) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [item.id]: value }));
    if (debounce.current[item.id]) clearTimeout(debounce.current[item.id]);
    if (immediate) void save(item.id, value, item.externalId);
    else debounce.current[item.id] = setTimeout(() => void save(item.id, value, item.externalId), 550);
  }

  function go(next: number) {
    if (next < 0 || next >= allItems.length) return;
    void save(current.id, answers[current.id] ?? "", allItems[next].externalId);
    setIndex(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function activateItem(itemId: string) {
    const next = allItems.findIndex((item) => item.id === itemId);
    if (next >= 0) go(next);
  }

  async function submit() {
    const unanswered = allItems.filter((item) => !(answers[item.id] ?? "").trim()).length;
    const message = unanswered
      ? `You still have ${unanswered} unanswered question${unanswered === 1 ? "" : "s"}. Submit anyway?`
      : "Submit this attempt? You will not be able to change your answers afterwards.";
    if (!window.confirm(message)) return;
    setSubmitting(true);
    const response = await fetch(`/api/attempts/${data.attempt.id}/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elapsedSeconds: elapsed }),
    });
    if (response.ok) router.replace(`/attempt/${data.attempt.id}/results`);
    else {
      setSubmitting(false);
      alert("The attempt could not be submitted. Please try again.");
    }
  }

  const answeredCount = allItems.filter((item) => (answers[item.id] ?? "").trim()).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f8] text-[#11191d]">
      <ExamHeader elapsed={elapsed} saved={saved} />
      <div className="border-b border-slate-300 bg-white px-4 py-3">
        <div className="mx-auto max-w-[1740px]">
          <b>
            Questions {set.items[0]?.number}–{set.items.at(-1)?.number}
          </b>
          <p className="mt-1 text-sm">{set.instructions || instructionForPart(set.part)}</p>
        </div>
      </div>
      <main className="mx-auto flex w-full max-w-[1780px] flex-1 flex-col px-3 pb-28 pt-5 lg:px-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#007f86]">
              {set.section === "UOE" ? "Use of English" : "Reading"} · Part {set.part}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{set.title}</h1>
          </div>
          <button
            aria-pressed={marked.has(current.id)}
            onClick={() =>
              setMarked((currentMarked) => {
                const next = new Set(currentMarked);
                if (next.has(current.id)) next.delete(current.id);
                else next.add(current.id);
                return next;
              })
            }
            className="rounded-md p-2 hover:bg-slate-200"
            aria-label="Mark question"
          >
            {marked.has(current.id) ? <BookmarkCheck className="text-[#007f86]" /> : <Bookmark />}
          </button>
        </div>
        <TranscriptionNotice set={set} />
        <ExerciseBody
          set={set}
          item={current}
          answers={answers}
          update={update}
          activateItem={activateItem}
        />
      </main>
      <BottomNavigation
        sets={data.sets}
        allItems={allItems}
        index={index}
        answers={answers}
        marked={marked}
        answeredCount={answeredCount}
        onGo={go}
        onSubmit={submit}
        submitting={submitting}
      />
    </div>
  );
}

function ExerciseBody({
  set,
  item,
  answers,
  update,
  activateItem,
}: {
  set: SetData;
  item: FlatItem;
  answers: Record<string, string>;
  update: (item: Item, value: string, immediate?: boolean) => void;
  activateItem: (itemId: string) => void;
}) {
  if (set.part === 1 || set.part === 2)
    return <InlineExercise set={set} answers={answers} update={update} currentId={item.id} />;
  if (set.part === 3)
    return <WordFormationExercise set={set} answers={answers} update={update} currentId={item.id} />;
  if (set.part === 4)
    return (
      <KwtExercise
        item={item}
        instructions={set.instructions}
        answer={answers[item.id] ?? ""}
        update={(value) => update(item, value)}
      />
    );
  if (set.part === 5)
    return <Part5Exercise set={set} item={item} answer={answers[item.id] ?? ""} update={(value) => update(item, value, true)} />;
  if (set.part === 6)
    return <Part6Exercise set={set} item={item} answer={answers[item.id] ?? ""} update={(value) => update(item, value, true)} />;
  if (set.part === 7)
    return (
      <Part7Exercise
        set={set}
        item={item}
        answers={answers}
        update={(value) => update(item, value, true)}
        activateItem={activateItem}
      />
    );
  return <Part8Exercise set={set} item={item} answer={answers[item.id] ?? ""} update={(value) => update(item, value, true)} />;
}

function ExamHeader({ elapsed, saved }: { elapsed: number; saved: string }) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return (
    <header className="border-b border-slate-300 bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1780px] items-center px-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-sm bg-[#007f86] font-black text-white">C1</div>
          <div>
            <b className="block text-lg leading-5">C1 Practice Lab</b>
            <span className="text-xs text-slate-500">Candidate practice mode</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
            <Check size={15} /> {saved}
          </span>
          <span className="rounded border border-slate-300 bg-slate-50 px-3 py-1.5 font-mono text-sm" aria-label="Elapsed time">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
          <Wifi size={22} />
          <Bell size={22} />
          <Menu size={24} />
          <PencilLine size={21} />
        </div>
      </div>
    </header>
  );
}

function instructionForPart(part: number) {
  return (
    {
      1: "For each question, choose the correct answer for each gap.",
      2: "For each question, write the correct answer. Write one word for each gap.",
      3: "Use the word in CAPITALS to form a word that fits in the gap.",
      4: "Complete the second sentence using between three and six words, including the word given.",
      5: "Read the text and choose the correct answer for each question.",
      6: "Read the four texts and choose the reviewer that matches each statement.",
      7: "Choose the paragraph which fits each gap. There is one extra paragraph.",
      8: "Choose the section or consultant that matches each statement.",
    } as Record<number, string>
  )[part];
}

function TranscriptionNotice({ set }: { set: SetData }) {
  if (!set.transcriptionStatus.includes("ocr") || set.transcriptionStatus.includes("verified")) return null;
  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      This passage came from a scanned page and is awaiting final proofreading. Use the admin editor to correct any remaining transcription issue.
    </div>
  );
}

function cleanSourceNoise(text: string) {
  return text
    .replace(/\[\[SCAN:[^\]]+\]\]/g, "")
    .replace(/^--- SOURCE PDF PAGE.*$/gim, "")
    .replace(/^©.*$/gim, "")
    .replace(/^Cambridge University Press.*$/gim, "")
    .replace(/^978-.*$/gim, "")
    .replace(/^(Excerpt|More Information|Reading and Use of English|Test \d+)$/gim, "")
    .replace(/^\d{1,3}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function preparePassage(set: SetData) {
  let text = cleanSourceNoise(set.fullText);
  const titleAt = text.indexOf(set.title);
  if (titleAt >= 0) text = text.slice(titleAt + set.title.length).trim();
  if (set.part === 1) {
    const first = set.items[0]?.number;
    const optionIndex = text.search(new RegExp(`\\n${first}\\s+A\\s+`, "i"));
    if (optionIndex > 0) text = text.slice(0, optionIndex);
  }
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function buildInlineChunks({
  text,
  set,
  answers,
  currentId,
  update,
}: {
  text: string;
  set: SetData;
  answers: Record<string, string>;
  currentId: string;
  update: (item: Item, value: string, immediate?: boolean) => void;
}) {
  const itemByNumber = new Map(set.items.map((item) => [item.number, item]));
  const matchedItemIds = new Set<string>();
  const chunks: ReactNode[] = [];
  let last = 0;
  // Some scanned sources retain only the numbered marker, e.g. “(9)”,
  // while others use dots, underscores or an ellipsis.  The item-number map
  // prevents ordinary parenthetical numbers from becoming answer fields.
  const gapPattern = /\((\d{1,3})\)(?:\s*(?:\.{2,}|_{2,}|…+))?/g;
  let match: RegExpExecArray | null;
  while ((match = gapPattern.exec(text))) {
    chunks.push(text.slice(last, match.index));
    const item = itemByNumber.get(Number(match[1]));
    if (item) {
      matchedItemIds.add(item.id);
      chunks.push(
        <InlineControl
          key={item.id}
          part={set.part}
          item={item}
          value={answers[item.id] ?? ""}
          active={item.id === currentId}
          onChange={(value) => update(item, value, set.part === 1)}
        />,
      );
    } else chunks.push(match[0]);
    last = gapPattern.lastIndex;
  }
  chunks.push(text.slice(last));
  return { chunks, matchedItemIds };
}

function InlineExercise({
  set,
  answers,
  update,
  currentId,
}: {
  set: SetData;
  answers: Record<string, string>;
  update: (item: Item, value: string, immediate?: boolean) => void;
  currentId: string;
}) {
  const { chunks, matchedItemIds } = buildInlineChunks({ text: preparePassage(set), set, answers, currentId, update });
  const missingItems = set.items.filter((candidate) => !matchedItemIds.has(candidate.id));
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-5 py-7 shadow-sm sm:px-8">
      <div className="max-w-[1200px] whitespace-pre-wrap text-[16px] leading-10 sm:text-[17px]">{chunks}</div>
      {missingItems.length > 0 && (
        <div className="mt-7 border-t border-slate-200 pt-5">
          <p className="mb-3 text-sm font-semibold text-slate-600">
            Answer fields not positioned in the source text
          </p>
          <div className="flex flex-wrap gap-3">
            {missingItems.map((candidate) => (
              <label key={candidate.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <b className="text-sm">{candidate.number}</b>
                <InlineControl
                  part={set.part}
                  item={candidate}
                  value={answers[candidate.id] ?? ""}
                  active={candidate.id === currentId}
                  onChange={(value) => update(candidate, value, set.part === 1)}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function stripBaseWords(text: string, set: SetData) {
  const words = set.items.map((item) => item.baseWord).filter((word): word is string => Boolean(word));
  return text
    .split("\n")
    .map((line) => {
      let result = line;
      for (const word of words) result = result.replace(new RegExp(`\\s+${escapeRegex(word)}\\s*$`), "");
      return result;
    })
    .join("\n");
}

function WordFormationExercise({
  set,
  answers,
  update,
  currentId,
}: {
  set: SetData;
  answers: Record<string, string>;
  update: (item: Item, value: string, immediate?: boolean) => void;
  currentId: string;
}) {
  const passage = stripBaseWords(preparePassage(set), set);
  const { chunks } = buildInlineChunks({ text: passage, set, answers, currentId, update });
  return (
    <section className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:grid-cols-[minmax(0,1fr)_250px]">
      <article className="px-5 py-7 sm:px-8 lg:px-10">
        <div className="max-w-[1050px] whitespace-pre-wrap text-[16px] leading-10 sm:text-[17px]">{chunks}</div>
      </article>
      <aside className="border-t border-slate-200 bg-slate-50 p-5 xl:border-l xl:border-t-0">
        <h2 className="font-bold">Words given</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:sticky xl:top-4 xl:grid-cols-1">
          {set.items.map((candidate) => (
            <div
              key={candidate.id}
              className={cn(
                "flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm",
                candidate.id === currentId ? "border-[#007f86] ring-2 ring-teal-100" : "border-slate-200",
              )}
            >
              <b>{candidate.number}</b>
              <span className="font-semibold tracking-wide text-slate-600">{candidate.baseWord ?? "—"}</span>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function InlineControl({
  part,
  item,
  value,
  active,
  onChange,
}: {
  part: number;
  item: Item;
  value: string;
  active: boolean;
  onChange: (value: string) => void;
}) {
  if (part === 1)
    return (
      <span className="relative mx-1 inline-flex align-middle">
        <select
          aria-label={`Question ${item.number}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-9 min-w-40 rounded border bg-white px-2 text-center font-semibold leading-normal",
            active ? "border-[#007f86] ring-2 ring-teal-100" : "border-slate-400",
          )}
        >
          <option value="">{item.options.length ? item.number : `${item.number} · options unavailable`}</option>
          {item.options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.key} · {option.label}
            </option>
          ))}
        </select>
      </span>
    );
  return (
    <span className="mx-1 inline-flex align-middle">
      <input
        aria-label={`Question ${item.number}`}
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder={String(item.number)}
        className={cn(
          "h-9 w-40 rounded border bg-white px-2 text-center font-semibold uppercase leading-normal",
          active ? "border-[#007f86] ring-2 ring-teal-100" : "border-slate-400",
        )}
      />
    </span>
  );
}

function KwtExercise({ item, instructions, answer, update }: { item: Item; instructions: string; answer: string; update: (value: string) => void }) {
  let prompt: { original?: string; second?: string } = {};
  try {
    prompt = JSON.parse(item.prompt) as { original?: string; second?: string };
  } catch {
    prompt = { original: item.prompt, second: "" };
  }
  const wordCount = countWords(answer);
  const limit = inferWordLimit(instructions);
  const valid = wordCount === 0 || !limit || (wordCount >= limit.min && wordCount <= limit.max);
  const keywordUsed = !answer || !item.keyword || answer.toUpperCase().split(/\s+/).includes(item.keyword.toUpperCase());
  return (
    <section className="min-h-[530px] rounded-md bg-white p-6 lg:p-9">
      <p className="max-w-4xl text-lg leading-8">{prompt.original}</p>
      <div className="my-7 text-lg font-black uppercase">{item.keyword}</div>
      <div className="flex max-w-5xl flex-wrap items-center gap-3 text-lg leading-9">
        <span>{prompt.second?.split(/\.{3,}/)[0]}</span>
        <input
          autoFocus
          value={answer}
          onChange={(event) => update(event.target.value)}
          aria-label={`Answer for question ${item.number}`}
          className="min-w-64 flex-1 border-b-2 border-[#007f86] bg-teal-50/40 px-3 py-2 font-semibold uppercase"
        />
        <span>{prompt.second?.split(/\.{3,}/).slice(1).join(" ")}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <span className={cn("rounded-full px-3 py-1", valid ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700")}>
          {wordCount} words{limit ? ` · required ${limit.min}–${limit.max}` : ""}
        </span>
        <span className={cn("rounded-full px-3 py-1", keywordUsed ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700")}>
          {keywordUsed ? "Keyword included" : "Use the keyword unchanged"}
        </span>
      </div>
    </section>
  );
}

function Part5Exercise({ set, item, answer, update }: { set: SetData; item: Item; answer: string; update: (value: string) => void }) {
  return (
    <ReadingShell
      left={<PassageArticle title={set.title} text={set.fullText} />}
      right={<QuestionPanel item={item} answer={answer} options={item.options} update={update} />}
    />
  );
}

function Part6Exercise({ set, item, answer, update }: { set: SetData; item: Item; answer: string; update: (value: string) => void }) {
  const scanPaths = extractScanPaths(set.fullText);
  const sections = parseLabeledSections(set.fullText, "D");
  return (
    <ReadingShell
      left={scanPaths.length ? <ScannedPassage title={set.title} paths={scanPaths} /> : <SectionCards title={set.title} sections={sections} />}
      right={<QuestionPanel item={item} answer={answer} options={item.options} update={update} />}
    />
  );
}

function Part7Exercise({
  set,
  item,
  answers,
  update,
  activateItem,
}: {
  set: SetData;
  item: Item;
  answers: Record<string, string>;
  update: (value: string) => void;
  activateItem: (itemId: string) => void;
}) {
  const itemByNumber = new Map(set.items.map((candidate) => [candidate.number, candidate]));
  const usedElsewhere = new Set(
    set.items.filter((candidate) => candidate.id !== item.id).map((candidate) => answers[candidate.id]).filter(Boolean),
  );
  const options = item.options;
  const optionByKey = new Map(options.map((option) => [option.key, option]));
  const chunks: ReactNode[] = [];
  const parts = set.fullText.split(/\[\[(\d{2,3})\]\]/g);
  for (let index = 0; index < parts.length; index += 1) {
    if (index % 2 === 0) chunks.push(<span key={`text-${index}`}>{parts[index]}</span>);
    else {
      const gapNumber = Number(parts[index]);
      const gapItem = itemByNumber.get(gapNumber);
      if (!gapItem) continue;
      const selected = answers[gapItem.id];
      const selectedOption = optionByKey.get(selected);
      chunks.push(
        <button
          key={gapItem.id}
          type="button"
          onClick={() => activateItem(gapItem.id)}
          className={cn(
            "my-5 block w-full rounded-lg border-2 border-dashed p-4 text-left transition",
            gapItem.id === item.id ? "border-[#007f86] bg-teal-50" : "border-slate-300 bg-slate-50 hover:border-slate-400",
          )}
          aria-label={`Go to gap ${gapNumber}`}
        >
          <span className="mb-2 inline-grid h-7 min-w-8 place-items-center rounded border border-[#007f86] bg-white px-1 text-sm font-bold text-[#006f76]">
            {gapNumber}
          </span>
          {selectedOption ? (
            <span className="block text-sm leading-6">
              <b className="mr-2 text-[#006f76]">{selectedOption.key}</b>
              {selectedOption.label}
            </span>
          ) : (
            <span className="block text-sm font-semibold text-slate-500">Select a paragraph</span>
          )}
        </button>,
      );
    }
  }

  const scanPaths = extractScanPaths(set.fullText);

  return (
    <ReadingShell
      left={
        scanPaths.length ? (
          <ScannedPassage title={set.title} paths={scanPaths} />
        ) : (
          <article>
            <h2 className="mb-2 text-2xl font-bold">{set.title}</h2>
            <div className="whitespace-pre-wrap text-[15px] leading-7">{chunks}</div>
          </article>
        )
      }
      right={
        <div>
          <QuestionHeading item={item} />
          <p className="mt-2 text-sm text-slate-600">Each paragraph can be used once. One paragraph is extra.</p>
          <fieldset className="mt-5 space-y-3">
            <legend className="sr-only">Choose a paragraph</legend>
            {options.map((option) => {
              const unavailable = usedElsewhere.has(option.key);
              const checked = answers[item.id] === option.key;
              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex gap-3 rounded-lg border p-4 text-sm leading-6",
                    unavailable
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "cursor-pointer border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50",
                    checked && "border-[#007f86] bg-teal-50 text-slate-900 ring-1 ring-[#007f86]",
                  )}
                >
                  <input
                    type="radio"
                    name={item.id}
                    value={option.key}
                    checked={checked}
                    disabled={unavailable}
                    onChange={() => update(option.key)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#007f86]"
                  />
                  <span>
                    <b className="mr-2 text-base">{option.key}</b>
                    {option.label}
                    {unavailable && <small className="ml-2 font-semibold">Already used</small>}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>
      }
    />
  );
}

function Part8Exercise({ set, item, answer, update }: { set: SetData; item: Item; answer: string; update: (value: string) => void }) {
  const maxLetter = (item.options.at(-1)?.key ?? "D") as "D" | "E" | "G";
  const scanPaths = extractScanPaths(set.fullText);
  const sections = parseLabeledSections(set.fullText, maxLetter);
  const options = item.options;
  return (
    <ReadingShell
      left={scanPaths.length ? <ScannedPassage title={set.title} paths={scanPaths} /> : <SectionCards title={set.title} sections={sections} />}
      right={<QuestionPanel item={item} answer={answer} options={options} update={update} />}
    />
  );
}

function ReadingShell({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <section className="grid min-h-[610px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.04fr_1fr]">
      <div className="exam-scroll max-h-[72vh] overflow-y-auto border-b border-slate-300 p-5 sm:p-7 lg:border-b-0 lg:border-r">{left}</div>
      <aside className="exam-scroll max-h-[72vh] overflow-y-auto p-5 sm:p-7">{right}</aside>
    </section>
  );
}

function extractScanPaths(text: string) {
  return [...text.matchAll(/\[\[SCAN:([^\]]+)\]\]/g)].map((match) => match[1].trim()).filter(Boolean);
}

function ScannedPassage({ title, paths }: { title: string; paths: string[] }) {
  const [zoom, setZoom] = useState(100);
  return (
    <article>
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 pb-3 backdrop-blur">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2" aria-label="Page zoom controls">
          <button type="button" onClick={() => setZoom((value) => Math.max(75, value - 25))} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100" aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setZoom(100)} className="min-w-20 rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100">{zoom}%</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(200, value + 25))} className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100" aria-label="Zoom in">+</button>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-600">Verified source pages. Use the zoom controls to enlarge the text.</p>
      <div className="overflow-x-auto rounded-lg bg-slate-100 p-2 sm:p-3">
        <div className="space-y-4" style={{ width: `${zoom}%` }}>
          {paths.map((path, index) => (
            <figure key={path} className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
              <Image src={path} alt={`${title}, source page ${index + 1}`} width={1600} height={2200} unoptimized priority={index === 0} className="block h-auto w-full max-w-none" />
              <figcaption className="border-t border-slate-200 px-3 py-2 text-center text-xs text-slate-500">Source page {index + 1} of {paths.length}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </article>
  );
}

function PassageArticle({ title, text }: { title: string; text: string }) {
  const scanPaths = extractScanPaths(text);
  if (scanPaths.length) return <ScannedPassage title={title} paths={scanPaths} />;
  return (
    <article>
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="whitespace-pre-wrap text-[15px] leading-7">{cleanSourceNoise(text)}</div>
    </article>
  );
}

function parseLabeledSections(text: string, maxLetter: "D" | "E" | "G") {
  const allowed = maxLetter === "D" ? "A-D" : maxLetter === "E" ? "A-E" : "A-G";
  const pattern = new RegExp(`(?:^|\\n)([${allowed}])\\s*\\n`, "g");
  const matches = [...text.matchAll(pattern)];
  if (!matches.length) return [{ key: "", text: cleanSourceNoise(text) }];
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return { key: match[1], text: cleanSourceNoise(text.slice(start, end)) };
  });
}

function SectionCards({ title, sections }: { title: string; sections: Array<{ key: string; text: string }> }) {
  return (
    <article>
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="space-y-5">
        {sections.map((section, index) => (
          <section key={section.key || index} className="rounded-lg border border-slate-200 bg-white p-4">
            {section.key && (
              <div className="mb-2 grid h-8 w-8 place-items-center rounded bg-[#007f86] font-black text-white">{section.key}</div>
            )}
            <p className="whitespace-pre-wrap text-[15px] leading-7">{section.text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}

function QuestionHeading({ item }: { item: Item }) {
  return (
    <h3 className="flex items-start gap-3 text-lg font-bold leading-7">
      <span className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded border-2 border-[#008b95] px-1 text-sm">{item.number}</span>
      <span>{cleanQuestion(item.prompt, item.number)}</span>
    </h3>
  );
}

function QuestionPanel({ item, answer, options, update }: { item: Item; answer: string; options: Option[]; update: (value: string) => void }) {
  return (
    <div>
      <QuestionHeading item={item} />
      {options.length ? (
        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Select an answer</legend>
          {options.map((option) => (
            <label
              key={option.key}
              className={cn(
                "flex cursor-pointer gap-3 rounded-lg border border-slate-300 bg-white p-4 leading-6 hover:bg-slate-50",
                answer === option.key && "border-[#007f86] bg-teal-50 ring-1 ring-[#007f86]",
              )}
            >
              <input
                type="radio"
                name={item.id}
                value={option.key}
                checked={answer === option.key}
                onChange={() => update(option.key)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#007f86]"
              />
              <span>
                <b className="mr-2">{option.key}</b>
                {option.label}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          The question options could not be extracted from the source. This exercise needs proofreading in the admin panel.
        </div>
      )}
    </div>
  );
}

function cleanQuestion(prompt: string, number: number) {
  const value = prompt.trim().replace(new RegExp(`^${number}[.)]?\\s*`), "");
  return value || `Question ${number}`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function BottomNavigation({
  sets,
  allItems,
  index,
  answers,
  marked,
  answeredCount,
  onGo,
  onSubmit,
  submitting,
}: {
  sets: SetData[];
  allItems: FlatItem[];
  index: number;
  answers: Record<string, string>;
  marked: Set<string>;
  answeredCount: number;
  onGo: (index: number) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white shadow-[0_-3px_12px_rgba(0,0,0,.08)]">
      <div className="mx-auto flex h-[76px] max-w-[1780px] items-stretch overflow-x-auto">
        <button
          onClick={() => onGo(index - 1)}
          disabled={index === 0}
          className="grid min-w-16 place-items-center bg-slate-100 disabled:opacity-40"
          aria-label="Previous question"
        >
          <ChevronLeft />
        </button>
        <div className="flex min-w-max flex-1">
          {sets.map((set) => {
            const items = allItems.filter((item) => item.setId === set.externalId);
            const done = items.filter((item) => (answers[item.id] ?? "").trim()).length;
            return (
              <div
                key={set.externalId}
                className={cn(
                  "flex items-center gap-1 border-l border-slate-200 px-3",
                  items.some((item) => allItems[index]?.id === item.id) ? "bg-white" : "bg-[#f2f4f5]",
                )}
              >
                <span className="mr-2 whitespace-nowrap text-sm font-bold">Part {set.part}</span>
                {items.map((item) => {
                  const itemIndex = allItems.findIndex((candidate) => candidate.id === item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => onGo(itemIndex)}
                      aria-label={`Question ${item.number}`}
                      className={cn(
                        "relative grid h-8 min-w-7 place-items-center rounded px-1 text-sm",
                        itemIndex === index
                          ? "border-2 border-[#007f86] bg-white font-bold"
                          : answers[item.id]?.trim()
                            ? "bg-teal-100 text-teal-900"
                            : "hover:bg-slate-200",
                      )}
                    >
                      {item.number}
                      {marked.has(item.id) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />}
                    </button>
                  );
                })}
                <span className="ml-2 whitespace-nowrap text-xs text-slate-500">
                  {done} of {items.length}
                </span>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onGo(index + 1)}
          disabled={index === allItems.length - 1}
          className="grid min-w-16 place-items-center bg-[#007f86] text-white disabled:bg-slate-300"
          aria-label="Next question"
        >
          <ChevronRight />
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex min-w-28 items-center justify-center gap-2 border-l bg-white px-4 font-bold text-[#006f76] hover:bg-teal-50"
        >
          <Send size={18} />
          {submitting ? "Submitting" : `Submit (${answeredCount}/${allItems.length})`}
        </button>
      </div>
    </footer>
  );
}
