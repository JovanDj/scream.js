import { expect, test } from "@playwright/test";

test("has title heading", async ({ page }) => {
	await page.goto("/todos/create");
	await expect(page.getByText("New Todo")).toBeVisible();
});

test("creates a todo", async ({ page }) => {
	await page.goto("/todos/create");
});
