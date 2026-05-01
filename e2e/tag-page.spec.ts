import { expect, test } from "@playwright/test";

test("opens the tags page from the home page", async ({ page }) => {
	await page.goto("/");

	await page.getByRole("link", { name: "Manage Tags" }).click();

	await expect(page).toHaveURL("/tags");
	await expect(page.getByRole("heading", { name: "Tags" })).toBeVisible();
});
