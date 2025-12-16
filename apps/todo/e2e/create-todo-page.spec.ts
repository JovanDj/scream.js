import { expect, test } from "@playwright/test";

test("has title heading", async ({ page }) => {
	await page.goto("/todos/create");
	await expect(page.getByTestId("create-heading")).toBeVisible();
});

test("shows validation error when submitting empty form", async ({ page }) => {
	await page.goto("/todos/create");

	const feedback = page.getByTestId("title-error");
	await expect(feedback).toHaveCount(0);

	await page.getByTestId("submit-button").click();

	await expect(page.getByTestId("title-error")).toBeVisible();
	await expect(page.getByTestId("title-input")).toHaveClass(/is-invalid/);

	await expect(page).toHaveURL(/\/todos\/create$/);
});

test("label click focuses the title input", async ({ page }) => {
	await page.goto("/todos/create");

	await page.getByTestId("title-label").click();
	await expect(page.getByTestId("title-input")).toBeFocused();
});

test("pressing Enter submits the form when empty and shows error", async ({
	page,
}) => {
	await page.goto("/todos/create");

	await page.getByTestId("title-input").focus();
	await page.keyboard.press("Enter");

	await expect(page.getByTestId("title-error")).toBeVisible();
	await expect(page).toHaveURL(/\/todos\/create$/);
});

test("creates a todo with valid title and redirects", async ({ page }) => {
	await page.goto("/todos/create");

	const title = `Buy milk`;
	await page.getByTestId("title-input").fill(title);
	await page.getByTestId("submit-button").click();

	await expect(page).not.toHaveURL(/\/todos\/create$/);

	await expect(page.getByTestId("todo-title-show")).toHaveText(title);
	await page.goto("/todos");
	const row = page.getByTestId("todo-row").filter({ hasText: title }).first();
	await expect(row.getByTestId("todo-status")).toHaveCount(0);
});

test("creating via Enter key works with a filled title", async ({ page }) => {
	await page.goto("/todos/create");

	const title = `Write tests`;
	await page.getByTestId("title-input").fill(title);
	await page.keyboard.press("Enter");

	await expect(page).not.toHaveURL(/\/todos\/create$/);
	await expect(page.getByTestId("todo-title-show")).toHaveText(title);
});
