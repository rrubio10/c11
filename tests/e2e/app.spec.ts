import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@example.local");
  await page.getByLabel("Password").fill("ChangeMe-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("authentication, start, autosave, resume, submit, results and review", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await page.goto("/sets/SAMPLE1_P1");
  await page.getByRole("button", { name: "Start or continue" }).click();
  await expect(page).toHaveURL(/\/attempt\//);
  const attemptId = page.url().split("/attempt/")[1].split("/")[0];

  const publicResponse = await page.request.get(`/api/attempts/${attemptId}`);
  const publicText = await publicResponse.text();
  expect(publicText).not.toContain("correctAnswer");
  expect(publicText).not.toContain("acceptedAnswers");

  const firstSelect = page.getByLabel("Question 1");
  await firstSelect.selectOption("B");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Question 1")).toHaveValue("B");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /Submit/ }).click();
  await expect(page).toHaveURL(new RegExp(`/attempt/${attemptId}/results`));
  await expect(page.getByText("Attempt submitted")).toBeVisible();
  await page.getByRole("link", { name: "Review answers" }).click();
  await expect(page.getByText("Correct answer", { exact: true }).first()).toBeVisible();
});

test("admin routes are protected and the importer page is available to admins", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  await page.goto("/admin/import");
  await expect(page.getByRole("heading", { name: "Import exercise data" })).toBeVisible();
  await expect(page.getByLabel("Master TXT file")).toBeVisible();
});

test("responsive library works on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/library?part=4");
  await expect(page.getByRole("heading", { name: "Exercise library" })).toBeVisible();
  await expect(page.getByText("Key Word Transformations — Mega Test (81 items)")).toBeVisible();
});
