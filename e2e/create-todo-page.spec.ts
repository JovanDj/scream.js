import { expect, test } from "@playwright/test";

test("has title heading", async ({ page }) => {
	await page.goto("/todos/create");
	await expect(page.getByRole("heading", { name: "New Todo" })).toBeVisible();
});

test("shows validation error when submitting empty form", async ({ page }) => {
	await page.goto("/todos/create");

	const feedback = page.locator(".invalid-feedback");
	await expect(feedback).toHaveCount(0);

	await page.getByRole("button", { name: /submit/i }).click();

	await expect(page.locator(".invalid-feedback")).toBeVisible();
	await expect(page.locator("#title")).toHaveClass(/is-invalid/);

	await expect(page).toHaveURL(/\/todos\/create$/);
});

test("label click focuses the title input", async ({ page }) => {
	await page.goto("/todos/create");

	await page.locator('label[for="title"]').click();
	await expect(page.locator("#title")).toBeFocused();
});

test("pressing Enter submits the form when empty and shows error", async ({
	page,
}) => {
	await page.goto("/todos/create");

	await page.locator("#title").focus();
	await page.keyboard.press("Enter");

	await expect(page.locator(".invalid-feedback")).toBeVisible();
	await expect(page).toHaveURL(/\/todos\/create$/);
});

test("creates a todo with valid title and redirects", async ({ page }) => {
	await page.goto("/todos/create");

	const title = `Buy milk`;
	await page.locator("#title").fill(title);
	await page.getByRole("button", { name: /submit/i }).click();

	await expect(page).not.toHaveURL(/\/todos\/create$/);

	await expect(page.getByTestId("todo-title-show")).toHaveText(title);
	await page.goto("/todos");
	const row = page.getByTestId("todo-row").filter({ hasText: title }).first();
	await expect(row.getByTestId("todo-status")).toHaveCount(0);
});

test("creating via Enter key works with a filled title", async ({ page }) => {
	await page.goto("/todos/create");

	const title = `Write tests`;
	await page.locator("#title").fill(title);
	await page.keyboard.press("Enter");

	await expect(page).not.toHaveURL(/\/todos\/create$/);
	await expect(page.getByTestId("todo-title-show")).toHaveText(title);
});
