import { expect, type Page, test } from "@playwright/test";

async function createTodo(page: Page, title: string) {
	await page.goto("/todos/create");
	await page.locator("#title").fill(title);
	await page.getByRole("button", { name: /submit/i }).click();
	return page.url().split("/").pop();
}

test("has title", async ({ page }) => {
	await page.goto("/todos");

	await expect(page).toHaveTitle(/Todo/);
});

test("has a heading", async ({ page }) => {
	await page.goto("/todos");

	await expect(page.getByText("Todos")).toBeVisible();
});

test("opens a create todo page", async ({ page }) => {
	await page.goto("/todos");
	await page.getByRole("link", { name: "Create todo" }).click();
	await expect(page).toHaveURL(/\/todos\/create/);
});

test("deletes a todo and redirects to index", async ({ page }) => {
	const title = `ToDelete ${Date.now()}`;
	const id = await createTodo(page, title);

	await page.goto(`/todos/${id}`);
	await page.getByRole("button", { name: /delete/i }).click();

	await expect(page).toHaveURL("/todos");
	await expect(page.getByText(title)).not.toBeVisible();
});
