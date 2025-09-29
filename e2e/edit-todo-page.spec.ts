import { expect, type Page, test } from "@playwright/test";

async function createTodo(page: Page, title: string) {
	await page.goto("/todos/create");
	await page.locator("#title").fill(title);
	await page.getByRole("button", { name: /submit/i }).click();
	const url = page.url();
	return url.split("/").pop();
}

test("has title heading", async ({ page }) => {
	const id = await createTodo(page, `Temp ${Date.now()}`);
	await page.goto(`/todos/${id}/edit`);
	await expect(
		page.getByRole("heading", { name: new RegExp(`Edit Todo #${id}`) }),
	).toBeVisible();
});

test("pre-fills the form with existing data", async ({ page }) => {
	const title = `Prefilled ${Date.now()}`;
	const id = await createTodo(page, title);

	await page.goto(`/todos/${id}/edit`);
	await expect(page.locator("#title")).toHaveValue(title);
});

test("shows validation error when clearing the title and submitting", async ({
	page,
}) => {
	const id = await createTodo(page, `Validate ${Date.now()}`);

	await page.goto(`/todos/${id}/edit`);
	await page.locator("#title").fill("");
	await page.getByRole("button", { name: /update/i }).click();

	await expect(page.locator(".invalid-feedback")).toBeVisible();
	await expect(page.locator("#title")).toHaveClass(/is-invalid/);
	await expect(page).toHaveURL(new RegExp(`/todos/${id}/edit$`));
});

test("label click focuses the title input", async ({ page }) => {
	const id = await createTodo(page, `Focus ${Date.now()}`);
	await page.goto(`/todos/${id}/edit`);

	await page.locator('label[for="title"]').click();
	await expect(page.locator("#title")).toBeFocused();
});

test("pressing Enter submits the form with valid title and updates todo", async ({
	page,
}) => {
	const id = await createTodo(page, `Old Title ${Date.now()}`);
	await page.goto(`/todos/${id}/edit`);

	const newTitle = `Updated via Enter ${Date.now()}`;
	await page.locator("#title").fill(newTitle);
	await page.keyboard.press("Enter");

	await expect(page).not.toHaveURL(new RegExp(`/todos/${id}/edit$`));
	await expect(page.getByText(newTitle, { exact: true })).toBeVisible();
});

test("updates a todo with valid title and redirects", async ({ page }) => {
	const id = await createTodo(page, `Old Title ${Date.now()}`);
	await page.goto(`/todos/${id}/edit`);

	const newTitle = `Updated ${Date.now()}`;
	await page.locator("#title").fill(newTitle);
	await page.getByRole("button", { name: /update/i }).click();

	await expect(page).not.toHaveURL(new RegExp(`/todos/${id}/edit$`));
	await expect(page.getByText(newTitle, { exact: true })).toBeVisible();
});
