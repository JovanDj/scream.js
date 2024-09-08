import { expect, test } from "@playwright/test";

test("has title heading", async ({ page }) => {
	await page.goto("http://127.0.0.1:3000/todos/create");
	await expect(page.getByText("New Todo")).toBeVisible();
});

test("creates a todo", async ({ page }) => {
	await page.goto("http://127.0.0.1:3000/todos/create");
});
