import Link from "next/link";
import { BarChart3, CheckCircle2, Clock3, Flame, Target, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDuration, testGroupLabel } from "@/lib/utils";

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function calculateStreak(dates: Date[]) {
  const days = new Set(dates.map(dayKey));
  if (!days.size) return 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export default async function ProgressPage() {
  const user = await requireUser();
  const attempts = await db.attempt.findMany({
    where: { userId: user.id, status: "SUBMITTED" },
    include: {
      exerciseSet: { select: { title: true, externalId: true, part: true, testGroup: true } },
      answers: { include: { exerciseItem: { include: { exerciseSet: { select: { part: true, section: true } } } } } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const totals = attempts.reduce(
    (acc, attempt) => ({
      score: acc.score + attempt.rawScore,
      max: acc.max + attempt.maximumScore,
      seconds: acc.seconds + attempt.timeSpentSeconds,
    }),
    { score: 0, max: 0, seconds: 0 },
  );

  const byPart = new Map<number, { score: number; max: number; attempts: Set<string> }>();
  const errors = new Map<string, number>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const part = answer.exerciseItem.exerciseSet.part;
      const value = byPart.get(part) ?? { score: 0, max: 0, attempts: new Set<string>() };
      value.score += answer.awardedPoints;
      value.max += answer.exerciseItem.maximumPoints;
      value.attempts.add(attempt.id);
      byPart.set(part, value);
      if (answer.answer.trim() && answer.awardedPoints < answer.exerciseItem.maximumPoints) {
        const category = answer.exerciseItem.errorCategory || `Part ${part}`;
        errors.set(category, (errors.get(category) ?? 0) + 1);
      }
    }
  }

  const recent = attempts.slice(0, 10);
  const average = totals.max ? (totals.score / totals.max) * 100 : 0;
  const best = attempts.length ? Math.max(...attempts.map((attempt) => attempt.percentage)) : 0;
  const streak = calculateStreak(attempts.flatMap((attempt) => (attempt.submittedAt ? [attempt.submittedAt] : [])));
  const frequentErrors = [...errors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 lg:px-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#007f86]">PROGRESS</p>
          <h1 className="mt-1 text-3xl font-bold">Your performance</h1>
          <p className="mt-2 text-slate-600">Scores are based on the verified keys imported with each exercise.</p>
        </div>
        <Link href="/library" className="rounded-md bg-[#007f86] px-4 py-2.5 font-bold text-white">Practise now</Link>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<Target />} label="Weighted average" value={`${Math.round(average)}%`} />
        <Metric icon={<BarChart3 />} label="Best attempt" value={`${Math.round(best)}%`} />
        <Metric icon={<CheckCircle2 />} label="Completed" value={String(attempts.length)} />
        <Metric icon={<Clock3 />} label="Study time" value={formatDuration(totals.seconds)} />
        <Metric icon={<Flame />} label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Accuracy by part</h2>
          <p className="mt-1 text-sm text-slate-500">Weighted by each item&apos;s imported maximum score.</p>
          <div className="mt-5 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((part) => {
              const row = byPart.get(part);
              const pct = row?.max ? (row.score / row.max) * 100 : 0;
              return (
                <div key={part}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span><b>Part {part}</b> · {part <= 4 ? "Use of English" : "Reading"}</span>
                    <span className="text-slate-600">{row ? `${row.score}/${row.max} · ${Math.round(pct)}%` : "No data"}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" aria-label={`Part ${part} ${Math.round(pct)} percent`}>
                    <div className="h-full rounded-full bg-[#007f86]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2"><TriangleAlert size={21} className="text-amber-600" /><h2 className="text-xl font-bold">Frequent error areas</h2></div>
          <p className="mt-1 text-sm text-slate-500">Only answered items that lost points are counted.</p>
          <div className="mt-5 space-y-3">
            {frequentErrors.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Complete and submit exercises to build an error profile.</p> : frequentErrors.map(([category, count], index) => (
              <div key={category} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 text-sm font-bold text-amber-800">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{category.replaceAll("_", " ")}</span>
                <span className="text-sm text-slate-500">{count} error{count === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold">Attempt history</h2></div>
        {recent.length === 0 ? <p className="p-6 text-slate-600">No submitted attempts yet.</p> : recent.map((attempt) => (
          <Link key={attempt.id} href={`/attempt/${attempt.id}/results`} className="grid gap-2 border-b border-slate-100 p-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
            <span><b className="block">{attempt.exerciseSet?.title ?? testGroupLabel(attempt.testGroup ?? "Practice")}</b><small className="text-slate-500">{attempt.submittedAt?.toLocaleDateString("en-GB")} · {formatDuration(attempt.timeSpentSeconds)}</small></span>
            <span className="text-sm font-semibold">{attempt.rawScore}/{attempt.maximumScore} points</span>
            <span className="grid h-11 w-16 place-items-center rounded-lg bg-teal-50 font-black text-[#007f86]">{Math.round(attempt.percentage)}%</span>
          </Link>
        ))}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#007f86]">{icon}<small className="font-semibold text-slate-600">{label}</small></div><div className="mt-3 text-2xl font-black">{value}</div></div>;
}
