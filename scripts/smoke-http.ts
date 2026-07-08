import { db } from "../src/lib/db";

const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3100";
const email = `smoke-${Date.now()}@example.local`;
const password = "Smoke-Test-123!";
let cookie = "";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`${base}${path}`, { ...init, headers, redirect: "manual" });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return response;
}

try {
  const register = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Smoke Test", email, password }) });
  if (!register.ok) throw new Error(`Registration failed: ${register.status} ${await register.text()}`);

  const dashboard = await request("/dashboard");
  assert(dashboard.ok, `Dashboard unavailable: ${dashboard.status}`);
  const dashboardHtml = await dashboard.text();
  assert(dashboardHtml.includes("Welcome") && dashboardHtml.includes("Smoke"), "Authenticated dashboard did not render");

  const start = await request("/api/attempts", { method: "POST", body: JSON.stringify({ setId: "SAMPLE1_P1" }) });
  if (!start.ok) throw new Error(`Attempt start failed: ${start.status} ${await start.text()}`);
  const { attemptId } = await start.json() as { attemptId: string };
  assert(attemptId, "Attempt id missing");

  const contentResponse = await request(`/api/attempts/${attemptId}`);
  assert(contentResponse.ok, "Attempt content failed");
  const rawContent = await contentResponse.text();
  assert(!rawContent.includes("correctAnswer"), "Pre-submission response exposed correctAnswer");
  assert(!rawContent.includes("acceptedAnswers"), "Pre-submission response exposed acceptedAnswers");
  const content = JSON.parse(rawContent) as { sets: Array<{ items: Array<{ id: string; externalId: string }> }> };
  const first = content.sets[0]?.items[0];
  assert(first, "Attempt has no items");

  const save = await request(`/api/attempts/${attemptId}/answers`, { method: "PUT", body: JSON.stringify({ itemId: first.id, answer: "B", elapsedSeconds: 7, currentItemExternalId: first.externalId }) });
  if (!save.ok) throw new Error(`Autosave failed: ${save.status} ${await save.text()}`);

  const resumed = await request(`/api/attempts/${attemptId}`);
  const resumedData = await resumed.json() as { sets: Array<{ items: Array<{ id: string; answer: string }> }> };
  assert(resumedData.sets[0].items.find((item) => item.id === first.id)?.answer === "B", "Saved answer was not recovered");

  const submit = await request(`/api/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ elapsedSeconds: 12 }) });
  if (!submit.ok) throw new Error(`Submission failed: ${submit.status} ${await submit.text()}`);

  const review = await request(`/api/attempts/${attemptId}/review`);
  assert(review.ok, `Review failed: ${review.status}`);
  const reviewText = await review.text();
  assert(reviewText.includes("correctAnswer"), "Review did not expose solutions after submission");

  const secondSubmit = await request(`/api/attempts/${attemptId}/submit`, { method: "POST", body: JSON.stringify({ elapsedSeconds: 99 }) });
  assert(secondSubmit.ok, "Idempotent second submission failed");
  console.log("HTTP smoke test passed: auth, protected content, autosave, resume, submit, review and idempotency.");
} finally {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
}
