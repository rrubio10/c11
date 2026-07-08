import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { testGroupLabel } from "@/lib/utils";
import { StartButton } from "@/components/ui/start-button";

const independentGroups = new Set(["STANDALONE", "MEGA_KWT"]);
type Query = Record<string, string | undefined>;

function queryHref(current: Query, patch: Query) {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
  const query = params.toString();
  return `/library${query ? `?${query}` : ""}`;
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const user = await requireUser();
  const q = await searchParams;
  const part = q.part ? Number(q.part) : undefined;
  const section = q.section;
  const mode = q.mode ?? "all";
  const status = q.status ?? "all";
  const allSets = await db.exerciseSet.findMany({
    where: { active: true, ...(part ? { part } : {}), ...(section ? { section } : {}) },
    include: {
      items: { where: { active: true }, select: { maximumPoints: true } },
      attempts: { where: { userId: user.id }, orderBy: { startedAt: "desc" } },
    },
    orderBy: [{ testGroup: "asc" }, { part: "asc" }],
  });

  const setStatus = (attempts: typeof allSets[number]["attempts"]) => attempts.some((a) => a.status === "IN_PROGRESS") ? "in_progress" : attempts.some((a) => a.status === "SUBMITTED") ? "completed" : "not_started";
  const sets = allSets.filter((set) => {
    if (mode === "independent" && !independentGroups.has(set.testGroup)) return false;
    if (mode === "part" && independentGroups.has(set.testGroup)) return false;
    if (status !== "all" && setStatus(set.attempts) !== status) return false;
    return mode !== "full";
  });

  const grouped = [...new Set(allSets.map((set) => set.testGroup))]
    .filter((group) => !independentGroups.has(group))
    .map((group) => {
      const groupSets = allSets.filter((set) => set.testGroup === group);
      const attempts = groupSets.flatMap((set) => set.attempts);
      return { group, sets: groupSets, status: setStatus(attempts) };
    })
    .filter((group) => status === "all" || group.status === status);

  return <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-7">
    <h1 className="text-3xl font-bold">Exercise library</h1>
    <p className="mt-2 text-slate-600">Choose a full paper, a single part or a focused transformation collection.</p>

    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Exercise filters">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Content</span>
        <Filter href={queryHref(q, { mode: undefined })} active={mode === "all"}>All</Filter>
        <Filter href={queryHref(q, { mode: "full" })} active={mode === "full"}>Full tests</Filter>
        <Filter href={queryHref(q, { mode: "part" })} active={mode === "part"}>Exam parts</Filter>
        <Filter href={queryHref(q, { mode: "independent" })} active={mode === "independent"}>Independent practice</Filter>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Section</span>
        <Filter href={queryHref(q, { section: undefined, part: undefined })} active={!part && !section}>Any</Filter>
        <Filter href={queryHref(q, { section: "UOE", part: undefined })} active={section === "UOE"}>Use of English</Filter>
        <Filter href={queryHref(q, { section: "READING", part: undefined })} active={section === "READING"}>Reading</Filter>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => <Filter key={p} href={queryHref(q, { part: String(p), section: undefined })} active={part === p}>Part {p}</Filter>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Progress</span>
        <Filter href={queryHref(q, { status: undefined })} active={status === "all"}>Any</Filter>
        <Filter href={queryHref(q, { status: "not_started" })} active={status === "not_started"}>Not started</Filter>
        <Filter href={queryHref(q, { status: "in_progress" })} active={status === "in_progress"}>In progress</Filter>
        <Filter href={queryHref(q, { status: "completed" })} active={status === "completed"}>Completed</Filter>
      </div>
    </section>

    {mode === "full" ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{grouped.map(({ group, sets: groupSets, status: groupStatus }) => {
      const items = groupSets.reduce((sum, set) => sum + set.itemCount, 0);
      const maximum = groupSets.reduce((sum, set) => sum + set.items.reduce((n, item) => n + item.maximumPoints, 0), 0);
      return <article key={group} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#007f86]">Full Reading & Use of English</p><h2 className="mt-1 text-lg font-bold">{testGroupLabel(group)}</h2></div><Status value={groupStatus} /></div>
        <p className="mt-4 text-sm text-slate-600">{groupSets.length} parts · {items} questions · {maximum} points</p>
        <StartButton testGroup={group} label={groupStatus === "in_progress" ? "Continue full test" : "Start full test"} className="mt-5 w-full" />
      </article>;
    })}</div> : <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sets.map((set) => {
      const last = set.attempts[0];
      const max = set.items.reduce((n, item) => n + item.maximumPoints, 0);
      const currentStatus = setStatus(set.attempts);
      return <Link href={`/sets/${set.externalId}`} key={set.id} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#007f86]">{set.section === "UOE" ? "Use of English" : "Reading"} · Part {set.part}</p><h2 className="mt-1 text-lg font-bold group-hover:text-[#006f76]">{set.title}</h2><p className="mt-1 text-sm text-slate-500">{testGroupLabel(set.testGroup)}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">C1</span></div>
        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-600"><span>{set.itemCount} questions · {max} points</span><Status value={currentStatus} score={last?.status === "SUBMITTED" ? last.percentage : undefined} /></div>
        {set.transcriptionStatus !== "verified" && <p className="mt-3 rounded bg-amber-50 px-2.5 py-2 text-xs text-amber-800">Text transcribed from scan and quality-checked.</p>}
      </Link>;
    })}</div>}

    {(mode === "full" ? grouped.length === 0 : sets.length === 0) && <p className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">No exercises match these filters.</p>}
  </main>;
}

function Filter({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${active ? "border-[#007f86] bg-[#007f86] text-white" : "border-slate-300 bg-white hover:bg-slate-50"}`} href={href}>{children}</Link>;
}

function Status({ value, score }: { value: string; score?: number }) {
  const label = score !== undefined ? `${Math.round(score)}%` : value === "in_progress" ? "In progress" : value === "completed" ? "Completed" : "Not started";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${value === "in_progress" ? "bg-amber-50 text-amber-800" : value === "completed" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{label}</span>;
}
