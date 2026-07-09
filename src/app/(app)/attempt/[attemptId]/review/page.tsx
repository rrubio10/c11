import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleX, MinusCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatChoiceAnswer, formatReviewPrompt, type DisplayOption } from "@/lib/exam-display";
import { safeJsonParse } from "@/lib/utils";

export default async function ReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser();
  const { attemptId } = await params;
  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, userId: user.id, status: "SUBMITTED" },
    include: {
      answers: {
        include: { exerciseItem: { include: { exerciseSet: true, answerVariants: true } } },
      },
    },
  });
  if (!attempt) redirect("/dashboard");
  const answers = [...attempt.answers].sort(
    (a, b) =>
      a.exerciseItem.exerciseSet.part - b.exerciseItem.exerciseSet.part ||
      a.exerciseItem.number - b.exerciseItem.number,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#007f86]">ANSWER REVIEW</p>
          <h1 className="mt-1 text-3xl font-bold">Review and learn</h1>
          <p className="mt-2 text-slate-600">Solutions are visible because this attempt has been submitted.</p>
        </div>
        <Link href={`/attempt/${attemptId}/results`} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 font-semibold">
          Back to results
        </Link>
      </div>
      <div className="mt-7 space-y-4">
        {answers.map((answer) => {
          const accepted = safeJsonParse<string[]>(answer.exerciseItem.acceptedJson, []);
          const options = safeJsonParse<DisplayOption[]>(answer.exerciseItem.optionsJson, []);
          const isChoicePart = [1, 5, 6, 7, 8].includes(answer.exerciseItem.exerciseSet.part);
          const displayedUserAnswer = isChoicePart
            ? formatChoiceAnswer(answer.answer, options)
            : answer.answer || "Not answered";
          const displayedCorrectAnswer = isChoicePart
            ? formatChoiceAnswer(answer.exerciseItem.correctAnswer, options)
            : answer.exerciseItem.correctAnswer;
          const prompt = formatReviewPrompt(answer.exerciseItem.prompt, answer.exerciseItem.keyword);
          const blank = !answer.answer.trim();
          const partial = !answer.isCorrect && answer.awardedPoints > 0;
          return (
            <article
              key={answer.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                answer.isCorrect
                  ? "border-emerald-200"
                  : partial
                    ? "border-amber-200"
                    : blank
                      ? "border-slate-200"
                      : "border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {answer.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" />
                ) : partial ? (
                  <MinusCircle className="mt-0.5 shrink-0 text-amber-600" />
                ) : blank ? (
                  <MinusCircle className="mt-0.5 shrink-0 text-slate-500" />
                ) : (
                  <CircleX className="mt-0.5 shrink-0 text-red-600" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <b>
                      {answer.exerciseItem.exerciseSet.section === "UOE" ? "Use of English" : "Reading"} Part{" "}
                      {answer.exerciseItem.exerciseSet.part} · Question {answer.exerciseItem.number}
                    </b>
                    <span className="text-sm font-bold">
                      {answer.awardedPoints}/{answer.exerciseItem.maximumPoints} points
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{prompt}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Answer label="Your answer" value={displayedUserAnswer} bad={!answer.isCorrect && !partial} partial={partial} />
                    <Answer label="Correct answer" value={displayedCorrectAnswer} />
                  </div>
                  {!isChoicePart && accepted.length > 1 && (
                    <p className="mt-3 text-sm">
                      <b>Accepted variants:</b> {accepted.join(" · ")}
                    </p>
                  )}
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                    {answer.exerciseItem.explanation || "Compared with the verified answer key after normalization."}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function Answer({ label, value, bad = false, partial = false }: { label: string; value: string; bad?: boolean; partial?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        bad ? "border-red-200 bg-red-50" : partial ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <small className="font-bold uppercase tracking-wide text-slate-500">{label}</small>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
