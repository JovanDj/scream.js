import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("localhost:3000/todos");

  await expect(page).toHaveTitle(/Todo/);
});

test("has a heading", async ({ page }) => {
  await page.goto("localhost:3000/todos");

  await expect(page.getByText("Todos")).toBeVisible();
});

test("opens a create todo page", async ({ page }) => {
  await page.goto("localhost:3000/todos");
  await page.getByRole("link", { name: "Create todo" }).click();
  await expect(page).toHaveURL(/\/todos\/create/);
});
