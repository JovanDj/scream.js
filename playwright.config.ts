import { defineConfig, devices } from "playwright/test";

export default defineConfig({
	forbidOnly: !!process.env["CI"],
	fullyParallel: true,
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
	reporter: "list",
	retries: process.env["CI"] ? 2 : 0,
	testDir: "./e2e",
	use: {
		trace: "on-first-retry",
	},
	webServer: {
		command: "npm run dev",
		port: 3000,
		reuseExistingServer: !process.env["CI"],
	},
	workers: process.env["CI"] ? 1 : "50%",
});
