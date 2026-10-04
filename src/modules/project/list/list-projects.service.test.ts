import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ZodError } from "zod/v4";
import type { ProjectIndexInput } from "../project.schema.js";
import { ListProjectsService } from "./list-projects.service.js";

describe("ListProjectsService", { concurrency: true }, () => {
	it("filters, sorts, and paginates validated projects with a lookahead row", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const active = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const archived = await db("project_statuses")
			.where({ code: "archived" })
			.first("id");
		const now = new Date().toISOString();
		const inserted = await db("projects")
			.insert([
				{
					created_at: now,
					name: "Matched B",
					status_id: active.id,
					updated_at: now,
				},
				{
					created_at: now,
					name: "Matched A",
					status_id: active.id,
					updated_at: now,
				},
				{
					created_at: now,
					name: "Matched C",
					status_id: active.id,
					updated_at: now,
				},
				{
					created_at: now,
					name: "Matched archived",
					status_id: archived.id,
					updated_at: now,
				},
				{
					created_at: now,
					name: "Other",
					status_id: active.id,
					updated_at: now,
				},
			])
			.returning(["id", "name"]);
		const service = new ListProjectsService(db);
		const input: ProjectIndexInput & { limit: number; offset: number } = {
			direction: "asc",
			limit: 2,
			offset: 0,
			page: 1,
			search: "Matched",
			sort: "name",
			status: "active",
		};

		const first = await service.execute(input);
		const second = await service.execute({ ...input, offset: 2, page: 2 });

		t.assert.deepStrictEqual(first, [
			{
				id: inserted.find((row) => row.name === "Matched A")?.id,
				name: "Matched A",
				statusCode: "active",
			},
			{
				id: inserted.find((row) => row.name === "Matched B")?.id,
				name: "Matched B",
				statusCode: "active",
			},
		]);
		t.assert.deepStrictEqual(second, [
			{
				id: inserted.find((row) => row.name === "Matched C")?.id,
				name: "Matched C",
				statusCode: "active",
			},
		]);
	});

	it("rejects an invalid lookahead row", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const status = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const now = new Date().toISOString();
		await db("projects").insert([
			{
				created_at: now,
				name: "First",
				status_id: status.id,
				updated_at: now,
			},
			{
				created_at: now,
				name: "Second",
				status_id: status.id,
				updated_at: now,
			},
		]);
		await db("projects")
			.where({ name: "Second" })
			.update({ name: Buffer.from("invalid") });

		const service = new ListProjectsService(db);
		const input: ProjectIndexInput & { limit: number; offset: number } = {
			direction: "asc",
			limit: 1,
			offset: 0,
			page: 1,
			search: "",
			sort: "created",
			status: "all",
		};
		const first = await service.execute(input);
		const act = () => service.execute({ ...input, limit: 2 });

		t.assert.deepStrictEqual(first[0]?.name, "First");
		await t.assert.rejects(act, ZodError);
	});
});
