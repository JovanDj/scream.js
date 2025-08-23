import { defineConfig, devices } from "playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env["CI"],
	retries: process.env["CI"] ? 2 : 0,
	workers: process.env["CI"] ? 1 : "50%",
	reporter: "list",
	use: {
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
		{
			name: "edge",
			use: { ...devices["Desktop Edge"] },
		},
	],
	webServer: {
		port: 3000,
		command: "npm run dev",
		reuseExistingServer: !process.env["CI"],
	},
});
