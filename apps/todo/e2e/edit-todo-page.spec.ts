import { expect, type Page, test } from "@playwright/test";

async function createTodo(page: Page, title: string) {
	await page.goto("/todos/create");
	await page.getByTestId("title-input").fill(title);
	await page.getByTestId("submit-button").click();
	await page.waitForURL(/\/todos\/\d+$/);
	const id = new URL(page.url()).pathname.split("/").pop();
	if (!id) {
		throw new Error("Could not determine todo id from url");
	}
	return id;
}

test("has title heading", async ({ page }) => {
	const id = await createTodo(page, `Temp`);
	await page.goto(`/todos/${id}/edit`);
	await expect(page.getByTestId("edit-heading")).toHaveText(
		new RegExp(`Edit Todo #${id}`),
	);
});

test("pre-fills the form with existing data", async ({ page }) => {
	const title = `Prefilled`;
	const id = await createTodo(page, title);

	await page.goto(`/todos/${id}/edit`);
	await expect(page.getByTestId("title-input")).toHaveValue(title);
});

test("shows validation error when clearing the title and submitting", async ({
	page,
}) => {
	const id = await createTodo(page, `Validate`);

	await page.goto(`/todos/${id}/edit`);
	await page.getByTestId("title-input").fill("");
	await page.getByTestId("update-button").click();

	await expect(page.getByTestId("title-error")).toBeVisible();
	await expect(page.getByTestId("title-input")).toHaveClass(/is-invalid/);
	await expect(page).toHaveURL(new RegExp(`/todos/${id}/edit$`));
});

test("label click focuses the title input", async ({ page }) => {
	const id = await createTodo(page, `Focus`);
	await page.goto(`/todos/${id}/edit`);

	await page.getByTestId("title-label").click();
	await expect(page.getByTestId("title-input")).toBeFocused();
});

test("pressing Enter submits the form with valid title and updates todo", async ({
	page,
}) => {
	const id = await createTodo(page, `Old Title`);
	await page.goto(`/todos/${id}/edit`);

	const newTitle = `Updated via Enter`;
	await page.getByTestId("title-input").fill(newTitle);
	await page.keyboard.press("Enter");

	await expect(page).not.toHaveURL(new RegExp(`/todos/${id}/edit$`));
	await expect(page.getByTestId("todo-title-show")).toHaveText(newTitle);
});

test("deletes a todo from the edit page and redirects", async ({ page }) => {
	const id = await createTodo(page, `To Delete From Edit`);
	await page.goto(`/todos/${id}/edit`);

	await page.getByTestId("delete-button").click();

	await expect(page).toHaveURL("/todos");
	await expect(page.locator(`a[href="/todos/${id}"]`)).toHaveCount(0);
});

test("opens edit form from the todo details page", async ({ page }) => {
	const id = await createTodo(page, `Navigate to Edit`);

	await page.goto(`/todos/${id}`);
	await page.getByTestId("edit-link").click();

	await expect(page).toHaveURL(new RegExp(`/todos/${id}/edit$`));
	await expect(page.getByTestId("edit-heading")).toHaveText(
		new RegExp(`Edit Todo #${id}`),
	);
});

test("marks a todo as completed from the edit page", async ({ page }) => {
	const id = await createTodo(page, `Complete Me`);
	await page.goto(`/todos/${id}/edit`);

	await page.getByTestId("completed-checkbox").check();
	await page.getByTestId("update-button").click();

	await expect(page).toHaveURL(new RegExp(`/todos/${id}$`));
	await expect(page.getByTestId("todo-status")).toContainText(/completed/i);

	await page.goto("/todos");
	const completedRow = page
		.getByTestId("todo-row")
		.filter({ hasText: "Complete Me" })
		.first();
	await expect(completedRow).toContainText(/completed/i);
});

test("unchecking completed saves the todo as not completed", async ({
	page,
}) => {
	const id = await createTodo(page, `Toggle Me`);
	await page.goto(`/todos/${id}/edit`);

	await page.getByTestId("completed-checkbox").check();
	await page.getByTestId("update-button").click();
	await expect(page.getByTestId("todo-status")).toContainText(/completed/i);

	await page.goto(`/todos/${id}/edit`);
	await page.getByTestId("completed-checkbox").uncheck();
	await page.getByTestId("update-button").click();

	await expect(page).toHaveURL(new RegExp(`/todos/${id}$`));
	await expect(page.getByTestId("todo-status")).toHaveCount(0);

	await page.goto("/todos");
	const row = page
		.getByTestId("todo-row")
		.filter({ hasText: "Toggle Me" })
		.first();
	await expect(row.getByTestId("todo-status")).toHaveCount(0);
});

test("updates a todo with valid title and redirects", async ({ page }) => {
	const id = await createTodo(page, `Old Title`);
	await page.goto(`/todos/${id}/edit`);

	const newTitle = `Updated`;
	await page.getByTestId("title-input").fill(newTitle);
	await page.getByTestId("update-button").click();

	await expect(page).not.toHaveURL(new RegExp(`/todos/${id}/edit$`));
	await expect(page.getByTestId("todo-title-show")).toHaveText(newTitle);
});
