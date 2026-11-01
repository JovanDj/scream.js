import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ListAllProjectsService } from "./list-all-projects.service.js";

describe("ListAllProjectsService", { concurrency: true }, () => {
	it("returns every active and archived parent sorted by name for dropdowns", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert([
			{ id: 11, name: "Zulu", status_id: 1 },
			{ id: 22, name: "Alpha", status_id: 2 },
			...Array.from({ length: 12 }, (_, index) => ({
				id: 30 + index,
				name: `Project ${String(index).padStart(2, "0")}`,
				status_id: 1,
			})),
		]);
		t.assert.deepStrictEqual(await new ListAllProjectsService(db).execute(), [
			{ id: 22, name: "Alpha" },
			...Array.from({ length: 12 }, (_, index) => ({
				id: 30 + index,
				name: `Project ${String(index).padStart(2, "0")}`,
			})),
			{ id: 11, name: "Zulu" },
		]);
	});

	it("returns an empty list when there are no projects", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		t.assert.deepStrictEqual(
			await new ListAllProjectsService(db).execute(),
			[],
		);
	});

	it("rejects malformed parent rows instead of returning raw dropdown values", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({
			id: 11,
			name: Buffer.from("Corrupt"),
			status_id: 1,
		});
		await t.assert.rejects(new ListAllProjectsService(db).execute(), {
			name: "ZodError",
		});
	});
});
