import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
import { load } from "cheerio";
import { ProjectModule } from "../project/index.js";
import { ProjectNoteModule } from "./index.js";

describe("project note controller", { concurrency: true }, () => {
	const projects = [
		{ id: 101, name: "Alpha Project", status_id: 1 },
		{ id: 202, name: "Archived Project", status_id: 2 },
	];
	const originalNote = {
		body: "Original body",
		created_at: "2026-01-01T00:00:00.000Z",
		id: 501,
		project_id: 101,
		title: "Original note",
		updated_at: "2026-01-01T00:00:00.000Z",
	};
	const headers = { "Content-Type": "application/x-www-form-urlencoded" };
	const setupServer = async (t: TestContext, parents = projects) => {
		const { cleanup, db } = await databaseTestFixture.setup({
			prepare: async (database) => {
				if (parents.length > 0) {
					await database("projects").insert(
						parents.map((project) => ({
							...project,
							created_at: "2026-01-01T00:00:00.000Z",
							updated_at: "2026-01-01T00:00:00.000Z",
						})),
					);
				}
			},
		});
		t.after(() => cleanup());
		const app = ExpressApp.create();
		ProjectModule.create(db).mount(app);
		ProjectNoteModule.create(db).mount(app);
		const server = HttpServer.start({ app, port: 0 });
		t.after(() => server.shutdown());
		return { db, url: `http://localhost:${server.port}` };
	};

	it("GET /project-notes lists notes and offers creation", async (t: TestContext) => {
		const { url } = await setupServer(t);

		const response = await fetch(`${url}/project-notes`, { signal: t.signal });
		const document = load(await response.text());

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.deepStrictEqual<number>(
			document('a[href="/project-notes/create"]').length,
			1,
		);
	});

	it("offers all projects, a selected preset, and navigation from project details", async (t: TestContext) => {
		const { url } = await setupServer(t);

		const response = await fetch(`${url}/project-notes/create`, {
			signal: t.signal,
		});
		const document = load(await response.text());
		const presetResponse = await fetch(
			`${url}/project-notes/create?projectId=202`,
			{ signal: t.signal },
		);
		const preset = load(await presetResponse.text());
		const projectResponse = await fetch(`${url}/projects/101`, {
			signal: t.signal,
		});
		const project = load(await projectResponse.text());
		const cancelLinks = {
			default: document("a")
				.filter((_, link) => document(link).text().trim() === "Cancel")
				.attr("href"),
			preset: preset("a")
				.filter((_, link) => preset(link).text().trim() === "Cancel")
				.attr("href"),
		};

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.deepStrictEqual<typeof cancelLinks>(cancelLinks, {
			default: "/project-notes",
			preset: "/projects/202",
		});
		t.assert.deepStrictEqual<{ name: string; value: string | undefined }[]>(
			document("#projectId option")
				.filter((_, option) => document(option).attr("value") !== "")
				.map((_, option) => ({
					name: document(option).text().trim(),
					value: document(option).attr("value"),
				}))
				.get(),
			[
				{ name: "Alpha Project", value: "101" },
				{ name: "Archived Project", value: "202" },
			],
		);
		t.assert.deepStrictEqual<number>(presetResponse.status, 200);
		t.assert.deepStrictEqual<string | undefined>(
			preset("#projectId option[selected]").attr("value"),
			"202",
		);
		t.assert.deepStrictEqual<number>(projectResponse.status, 200);
		t.assert.deepStrictEqual<string>(
			project('nav a[href="/project-notes"]').text().trim(),
			"Notes",
		);
		t.assert.deepStrictEqual<number>(
			project('a[href="/project-notes?projectId=101"]').length,
			1,
		);
		t.assert.deepStrictEqual<number>(
			project('a[href="/project-notes/create?projectId=101"]').length,
			1,
		);
	});

	it("creates, lists, shows, edits, and deletes a note through the rendered forms", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		const createResponse = await fetch(`${url}/project-notes/create`, {
			signal: t.signal,
		});
		const create = load(await createResponse.text());
		const createForm = create("form").filter(
			(_, form) => create(form).find("#title").length > 0,
		);

		const created = await fetch(new URL(createForm.attr("action") ?? "", url), {
			body: new URLSearchParams([
				[
					createForm.find("#body").attr("name") ?? "",
					"First line\nSecond line",
				],
				[createForm.find("#projectId").attr("name") ?? "", "101"],
				[createForm.find("#title").attr("name") ?? "", "  Planning note  "],
			]),
			headers,
			method: createForm.attr("method")?.toUpperCase() ?? "GET",
			redirect: "manual",
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(created.status, 302);
		const saved = await db("project_notes").first(
			"id",
			"project_id",
			"title",
			"body",
		);
		const location = `/project-notes/${saved.id}`;
		t.assert.deepStrictEqual<string | null>(
			created.headers.get("Location"),
			location,
		);
		t.assert.deepStrictEqual<{
			project_id: number;
			title: string;
			body: string;
		}>(
			{ body: saved.body, project_id: saved.project_id, title: saved.title },
			{
				body: "First line\nSecond line",
				project_id: 101,
				title: "Planning note",
			},
		);

		const indexResponse = await fetch(`${url}/project-notes`, {
			signal: t.signal,
		});
		const index = load(await indexResponse.text());
		const showResponse = await fetch(`${url}${location}`, { signal: t.signal });
		const show = load(await showResponse.text());
		const editResponse = await fetch(`${url}${location}/edit`, {
			signal: t.signal,
		});
		const edit = load(await editResponse.text());
		const editNavigation = {
			cancel: edit("a")
				.filter((_, link) => edit(link).text().trim() === "Cancel")
				.attr("href"),
			project: edit("p")
				.filter((_, paragraph) =>
					edit(paragraph).text().trim().startsWith("Project:"),
				)
				.text()
				.trim(),
		};

		t.assert.deepStrictEqual<number>(indexResponse.status, 200);
		t.assert.deepStrictEqual<typeof editNavigation>(editNavigation, {
			cancel: location,
			project: "Project: Alpha Project",
		});
		t.assert.deepStrictEqual<string>(
			index(`tbody a[href="${location}"]`).text().trim(),
			"Planning note",
		);
		t.assert.match(index("tbody").text(), /Alpha Project/);
		t.assert.deepStrictEqual<number>(showResponse.status, 200);
		t.assert.match(show("body").text(), /Planning note/);
		t.assert.match(show("body").text(), /Alpha Project/);
		t.assert.match(show("body").text(), /First line\s+Second line/);
		t.assert.deepStrictEqual<number>(
			show(`a[href="${location}/edit"]`).length,
			1,
		);
		t.assert.deepStrictEqual<number>(editResponse.status, 200);
		t.assert.deepStrictEqual<string | undefined>(
			edit("#title").attr("value"),
			"Planning note",
		);
		t.assert.deepStrictEqual<string>(
			edit("#body").text(),
			"First line\nSecond line",
		);
		t.assert.deepStrictEqual<number>(
			edit('select[name="projectId"]').length,
			0,
		);
		const editForm = edit("form").filter(
			(_, form) => edit(form).find('[name="title"]').length > 0,
		);
		const updated = await fetch(new URL(editForm.attr("action") ?? "", url), {
			body: new URLSearchParams({
				_method: editForm.find('[name="_method"]').attr("value") ?? "",
				body: "Updated\nbody",
				title: "  Revised plan  ",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		const afterUpdateResponse = await fetch(`${url}${location}`, {
			signal: t.signal,
		});
		const afterUpdate = load(await afterUpdateResponse.text());
		const updatedRows = await db("project_notes").select(
			"project_id",
			"title",
			"body",
		);

		t.assert.deepStrictEqual<number>(updated.status, 302);
		t.assert.deepStrictEqual<string | null>(
			updated.headers.get("Location"),
			location,
		);
		t.assert.deepStrictEqual<number>(afterUpdateResponse.status, 200);
		t.assert.match(afterUpdate("body").text(), /Revised plan/);
		t.assert.deepStrictEqual<
			{ project_id: number; title: string; body: string }[]
		>(updatedRows, [
			{ body: "Updated\nbody", project_id: 101, title: "Revised plan" },
		]);
		const deleteForm = afterUpdate("form").filter(
			(_, form) => afterUpdate(form).find("button").text().trim() === "Delete",
		);
		t.assert.deepStrictEqual<number>(deleteForm.length, 1);
		t.assert.deepStrictEqual<string | undefined>(
			deleteForm.attr("method")?.toUpperCase(),
			"POST",
		);
		t.assert.deepStrictEqual<string | undefined>(
			deleteForm.attr("action"),
			location,
		);
		const deleted = await fetch(new URL(deleteForm.attr("action") ?? "", url), {
			body: new URLSearchParams({
				_method: deleteForm.find('[name="_method"]').attr("value") ?? "",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		const missing = await fetch(`${url}${location}`, { signal: t.signal });
		const emptyResponse = await fetch(`${url}/project-notes`, {
			signal: t.signal,
		});
		const empty = load(await emptyResponse.text());

		t.assert.deepStrictEqual<number>(deleted.status, 302);
		t.assert.deepStrictEqual<string | null>(
			deleted.headers.get("Location"),
			"/project-notes",
		);
		t.assert.deepStrictEqual<number>(missing.status, 404);
		t.assert.deepStrictEqual<number>(emptyResponse.status, 200);
		t.assert.deepStrictEqual<number>(empty(`a[href="${location}"]`).length, 0);
		t.assert.deepStrictEqual<{ id: number }[]>(
			await db("project_notes").select("id"),
			[],
		);
	});

	it("filters before newest-id pagination and preserves only projectId and page in links", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		await db("project_notes").insert(
			Array.from({ length: 22 }, (_, index) => ({
				body: "Paged body",
				id: 301 + index,
				project_id: index % 2 === 0 ? 101 : 202,
				title: `Note ${301 + index}`,
			})),
		);

		const firstResponse = await fetch(`${url}/project-notes?projectId=101`, {
			signal: t.signal,
		});
		const first = load(await firstResponse.text());
		const next = first("a").filter(
			(_, link) => first(link).text().trim() === "Next",
		);
		const nextUrl = new URL(next.attr("href") ?? "", url);
		const secondResponse = await fetch(
			`${url}/project-notes?projectId=101&page=2`,
			{ signal: t.signal },
		);
		const second = load(await secondResponse.text());
		const previous = second("a").filter(
			(_, link) => second(link).text().trim() === "Previous",
		);
		const previousUrl = new URL(previous.attr("href") ?? "", url);
		const allResponse = await fetch(`${url}/project-notes`, {
			signal: t.signal,
		});
		const all = load(await allResponse.text());

		t.assert.deepStrictEqual<number>(firstResponse.status, 200);
		t.assert.deepStrictEqual<number>(first("tbody tr").length, 10);
		t.assert.deepStrictEqual<string[]>(
			first("tbody a")
				.filter((_, link) =>
					/^\/project-notes\/\d+$/.test(first(link).attr("href") ?? ""),
				)
				.map((_, link) => first(link).attr("href"))
				.get(),
			[
				"/project-notes/321",
				"/project-notes/319",
				"/project-notes/317",
				"/project-notes/315",
				"/project-notes/313",
				"/project-notes/311",
				"/project-notes/309",
				"/project-notes/307",
				"/project-notes/305",
				"/project-notes/303",
			],
		);
		t.assert.doesNotMatch(first("tbody").text(), /Archived Project/);
		t.assert.deepStrictEqual<number>(next.length, 1);
		t.assert.deepStrictEqual<string>(nextUrl.pathname, "/project-notes");
		t.assert.deepStrictEqual<[string, string][]>(
			Array.from(nextUrl.searchParams).sort(),
			[
				["page", "2"],
				["projectId", "101"],
			],
		);
		t.assert.deepStrictEqual<number>(
			first("a").filter((_, link) => first(link).text().trim() === "Previous")
				.length,
			0,
		);
		t.assert.deepStrictEqual<number>(secondResponse.status, 200);
		t.assert.deepStrictEqual<number>(second("tbody tr").length, 1);
		t.assert.deepStrictEqual<string[]>(
			second("tbody a")
				.filter((_, link) =>
					/^\/project-notes\/\d+$/.test(second(link).attr("href") ?? ""),
				)
				.map((_, link) => second(link).attr("href"))
				.get(),
			["/project-notes/301"],
		);
		t.assert.deepStrictEqual<number>(previous.length, 1);
		t.assert.deepStrictEqual<string>(previousUrl.pathname, "/project-notes");
		t.assert.deepStrictEqual<[string, string][]>(
			Array.from(previousUrl.searchParams).sort(),
			[["projectId", "101"]],
		);
		t.assert.deepStrictEqual<number>(
			second("a").filter((_, link) => second(link).text().trim() === "Next")
				.length,
			0,
		);
		t.assert.deepStrictEqual<number>(allResponse.status, 200);
		t.assert.deepStrictEqual<string[]>(
			all("tbody a")
				.filter((_, link) =>
					/^\/project-notes\/\d+$/.test(all(link).attr("href") ?? ""),
				)
				.map((_, link) => all(link).attr("href"))
				.get(),
			[
				"/project-notes/322",
				"/project-notes/321",
				"/project-notes/320",
				"/project-notes/319",
				"/project-notes/318",
				"/project-notes/317",
				"/project-notes/316",
				"/project-notes/315",
				"/project-notes/314",
				"/project-notes/313",
			],
		);
	});

	const invalidFields = [
		{
			body: "  Valid body\n ",
			error: /required|non.?empty|at least|blank/i,
			field: "title",
			name: "empty title",
			title: "",
		},
		{
			body: "  Valid body\n ",
			error: /required|non.?empty|at least|blank/i,
			field: "title",
			name: "whitespace title",
			title: " \t ",
		},
		{
			body: "  Valid body\n ",
			error: /255|long|maximum|at most/i,
			field: "title",
			name: "title longer than 255 characters",
			title: "x".repeat(256),
		},
		{
			body: "",
			error: /required|non.?empty|at least|blank/i,
			field: "body",
			name: "empty body",
			title: "  Keep raw title  ",
		},
		{
			body: " \t\n ",
			error: /required|non.?empty|at least|blank/i,
			field: "body",
			name: "whitespace body",
			title: "  Keep raw title  ",
		},
	];
	for (const scenario of invalidFields) {
		it(`POST rejects ${scenario.name}, retains raw fields and project selection, and does not insert`, async (t: TestContext) => {
			const { db, url } = await setupServer(t);
			await db("project_notes").insert(originalNote);
			const before = await db("project_notes").orderBy("id").select("*");

			const response = await fetch(`${url}/project-notes`, {
				body: new URLSearchParams({
					body: scenario.body,
					projectId: "202",
					title: scenario.title,
				}),
				headers,
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const document = load(await response.text());
			const after = await db("project_notes").orderBy("id").select("*");

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.deepStrictEqual<string | null>(
				response.headers.get("Location"),
				null,
			);
			t.assert.match(
				document(`#${scenario.field}-error`).text(),
				scenario.error,
			);
			t.assert.deepStrictEqual<string | undefined>(
				document("#title").attr("value"),
				scenario.title,
			);
			t.assert.deepStrictEqual<string>(document("#body").text(), scenario.body);
			t.assert.deepStrictEqual<string | undefined>(
				document("#projectId option[selected]").attr("value"),
				"202",
			);
			t.assert.deepStrictEqual<typeof before>(after, before);
		});

		it(`PATCH rejects ${scenario.name}, retains raw fields, and does not update`, async (t: TestContext) => {
			const { db, url } = await setupServer(t);
			await db("project_notes").insert(originalNote);
			const before = await db("project_notes").orderBy("id").select("*");

			const response = await fetch(`${url}/project-notes/501`, {
				body: new URLSearchParams({
					body: scenario.body,
					title: scenario.title,
				}),
				headers,
				method: "PATCH",
				redirect: "manual",
				signal: t.signal,
			});
			const document = load(await response.text());
			const after = await db("project_notes").orderBy("id").select("*");

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.deepStrictEqual<string | null>(
				response.headers.get("Location"),
				null,
			);
			t.assert.match(
				document(`#${scenario.field}-error`).text(),
				scenario.error,
			);
			t.assert.deepStrictEqual<string | undefined>(
				document("#title").attr("value"),
				scenario.title,
			);
			t.assert.deepStrictEqual<string>(document("#body").text(), scenario.body);
			t.assert.deepStrictEqual<number>(
				document('select[name="projectId"]').length,
				0,
			);
			t.assert.deepStrictEqual<typeof before>(after, before);
		});
	}

	it("accepts a 255-character trimmed title and preserves multiline body whitespace as escaped plaintext", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		const title = `${"x".repeat(222)}<img src=x onerror=alert(1)>12345`;
		const body =
			"  <script>alert('note')</script>\n\n  <b>plain & text</b>  \n ";

		const response = await fetch(`${url}/project-notes`, {
			body: new URLSearchParams({
				body,
				projectId: "101",
				title: `  ${title}  `,
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(response.status, 302);
		const saved = await db("project_notes").first("id", "title", "body");
		const showResponse = await fetch(`${url}/project-notes/${saved.id}`, {
			signal: t.signal,
		});
		const show = load(await showResponse.text());
		const editResponse = await fetch(`${url}/project-notes/${saved.id}/edit`, {
			signal: t.signal,
		});
		const edit = load(await editResponse.text());
		const indexResponse = await fetch(`${url}/project-notes`, {
			signal: t.signal,
		});
		const index = load(await indexResponse.text());

		t.assert.deepStrictEqual<{ title: string; body: string }>(
			{ body: saved.body, title: saved.title },
			{ body, title },
		);
		t.assert.deepStrictEqual<number>(showResponse.status, 200);
		t.assert.ok(show("body").text().includes(title));
		t.assert.ok(show("body").text().includes(body));
		t.assert.deepStrictEqual<number>(show("img[onerror], b").length, 0);
		t.assert.deepStrictEqual<number>(
			show("script").filter((_, script) =>
				show(script).text().includes("alert('note')"),
			).length,
			0,
		);
		t.assert.deepStrictEqual<number>(editResponse.status, 200);
		t.assert.deepStrictEqual<string | undefined>(
			edit("#title").attr("value"),
			title,
		);
		t.assert.deepStrictEqual<string>(edit("#body").text(), body);
		t.assert.deepStrictEqual<number>(indexResponse.status, 200);
		t.assert.deepStrictEqual<string>(
			index(`tbody a[href="/project-notes/${saved.id}"]`).text(),
			title,
		);
		t.assert.deepStrictEqual<number>(index("img[onerror]").length, 0);
		const updated = await fetch(`${url}/project-notes/${saved.id}`, {
			body: new URLSearchParams({
				body: edit("#body").text(),
				title: edit("#title").attr("value") ?? "",
			}),
			headers,
			method: "PATCH",
			redirect: "manual",
			signal: t.signal,
		});

		t.assert.deepStrictEqual<number>(updated.status, 302);
		t.assert.deepStrictEqual<string | null>(
			updated.headers.get("Location"),
			`/project-notes/${saved.id}`,
		);
		t.assert.deepStrictEqual<{ title: string; body: string }[]>(
			await db("project_notes").select("title", "body"),
			[{ body, title }],
		);
	});

	for (const projectId of ["", "0", "-1", "1.5", "not-a-number"]) {
		it(`POST rejects invalid projectId ${JSON.stringify(projectId)} with a project field error and no insert`, async (t: TestContext) => {
			const { db, url } = await setupServer(t);
			await db("project_notes").insert(originalNote);
			const before = await db("project_notes").select("*");

			const response = await fetch(`${url}/project-notes`, {
				body: new URLSearchParams({
					body: "  Raw body\n ",
					projectId,
					title: "  Raw title  ",
				}),
				headers,
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const document = load(await response.text());

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(
				document("#projectId-error").text(),
				/required|project|positive|integer|number|invalid/i,
			);
			t.assert.deepStrictEqual<string | undefined>(
				document("#title").attr("value"),
				"  Raw title  ",
			);
			t.assert.deepStrictEqual<string>(
				document("#body").text(),
				"  Raw body\n ",
			);
			t.assert.deepStrictEqual<typeof before>(
				await db("project_notes").select("*"),
				before,
			);
		});
	}

	it("POST rejects an omitted project with a field error and no insert", async (t: TestContext) => {
		const { db, url } = await setupServer(t);

		const response = await fetch(`${url}/project-notes`, {
			body: new URLSearchParams({ body: "Body", title: "No parent" }),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		const document = load(await response.text());

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.match(
			document("#projectId-error").text(),
			/required|project|invalid/i,
		);
		t.assert.deepStrictEqual<{ id: number }[]>(
			await db("project_notes").select("id"),
			[],
		);
	});

	for (const query of [
		"projectId=",
		"projectId=0",
		"projectId=-1",
		"projectId=1.5",
		"projectId=nope",
		"projectId=101&projectId=202",
		"page=0",
		"page=-1",
		"page=1.5",
		"page=nope",
		"page=1&page=2",
	]) {
		it(`GET index rejects invalid query ${query}`, async (t: TestContext) => {
			const { url } = await setupServer(t);

			const response = await fetch(`${url}/project-notes?${query}`, {
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(response.status, 404);
		});
	}

	for (const preset of [
		"",
		"0",
		"-1",
		"1.5",
		"nope",
		"999999",
		"101&projectId=202",
	]) {
		it(`GET create rejects malformed or nonexistent project preset ${JSON.stringify(preset)}`, async (t: TestContext) => {
			const { url } = await setupServer(t);

			const response = await fetch(
				`${url}/project-notes/create?projectId=${preset}`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual<number>(response.status, 404);
		});
	}

	it("GET index with a valid nonexistent project filter is empty, not not-found", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		await db("project_notes").insert(originalNote);

		const response = await fetch(`${url}/project-notes?projectId=999999`, {
			signal: t.signal,
		});
		const document = load(await response.text());

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.deepStrictEqual<number>(
			document('tbody a[href="/project-notes/501"]').length,
			0,
		);
		t.assert.doesNotMatch(document("tbody").text(), /Original note/);
	});

	for (const id of ["999999", "nope", "0", "-1", "1.5"]) {
		for (const operation of ["show", "edit", "update", "delete"]) {
			it(`${operation} returns 404 for missing or invalid note ${id} without changing notes`, async (t: TestContext) => {
				const { db, url } = await setupServer(t);
				await db("project_notes").insert(originalNote);
				const before = await db("project_notes").select("*");
				const path = `/project-notes/${id}${operation === "edit" ? "/edit" : ""}`;

				const response = await fetch(`${url}${path}`, {
					...(operation === "update"
						? {
								body: new URLSearchParams({
									body: "Changed",
									title: "Changed",
								}),
								headers,
								method: "PATCH",
							}
						: {}),
					...(operation === "delete" ? { method: "DELETE" } : {}),
					redirect: "manual",
					signal: t.signal,
				});

				t.assert.deepStrictEqual<number>(response.status, 404);
				t.assert.deepStrictEqual<typeof before>(
					await db("project_notes").select("*"),
					before,
				);
			});
		}
	}

	it("POST with a missing parent returns 404 and does not insert", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		await db("project_notes").insert(originalNote);
		const before = await db("project_notes").select("*");

		const response = await fetch(`${url}/project-notes`, {
			body: new URLSearchParams({
				body: "Body",
				projectId: "999999",
				title: "Missing parent",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});

		t.assert.deepStrictEqual<number>(response.status, 404);
		t.assert.deepStrictEqual<string | null>(
			response.headers.get("Location"),
			null,
		);
		t.assert.deepStrictEqual<typeof before>(
			await db("project_notes").select("*"),
			before,
		);
	});

	it("a database insert failure returns 500 and rolls back the note", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		await db("project_notes").insert(originalNote);
		const before = await db("project_notes").select("*");
		await db.raw(
			"CREATE TRIGGER reject_note AFTER INSERT ON project_notes BEGIN SELECT RAISE(FAIL, 'note fixture failure'); END;",
		);

		const response = await fetch(`${url}/project-notes`, {
			body: new URLSearchParams({
				body: "Body",
				projectId: "101",
				title: "Rejected note",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});

		t.assert.deepStrictEqual<number>(response.status, 500);
		t.assert.deepStrictEqual<string | null>(
			response.headers.get("Location"),
			null,
		);
		t.assert.deepStrictEqual<typeof before>(
			await db("project_notes").select("*"),
			before,
		);
	});

	it("editing title and body ignores a different submitted project and leaves both parents unchanged", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		await db("project_notes").insert(originalNote);
		const parentsBefore = await db("projects").orderBy("id").select("*");

		const response = await fetch(`${url}/project-notes/501`, {
			body: new URLSearchParams({
				body: "  Exact edited body\n ",
				projectId: "202",
				title: "  Allowed edit  ",
			}),
			headers,
			method: "PATCH",
			redirect: "manual",
			signal: t.signal,
		});
		const showResponse = await fetch(`${url}/project-notes/501`, {
			signal: t.signal,
		});
		const document = load(await showResponse.text());

		t.assert.deepStrictEqual<number>(response.status, 302);
		t.assert.deepStrictEqual<string | null>(
			response.headers.get("Location"),
			"/project-notes/501",
		);
		t.assert.deepStrictEqual<
			{ id: number; project_id: number; title: string; body: string }[]
		>(await db("project_notes").select("id", "project_id", "title", "body"), [
			{
				body: "  Exact edited body\n ",
				id: 501,
				project_id: 101,
				title: "Allowed edit",
			},
		]);
		t.assert.deepStrictEqual<number>(showResponse.status, 200);
		t.assert.match(document("body").text(), /Alpha Project/);
		t.assert.doesNotMatch(document("body").text(), /Archived Project/);
		t.assert.deepStrictEqual<typeof parentsBefore>(
			await db("projects").orderBy("id").select("*"),
			parentsBefore,
		);
	});

	it("notes under archived projects remain creatable, visible, editable, and deletable", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		const parentsBefore = await db("projects").orderBy("id").select("*");

		const created = await fetch(`${url}/project-notes`, {
			body: new URLSearchParams({
				body: "Archive body",
				projectId: "202",
				title: "Archive note",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		t.assert.deepStrictEqual<number>(created.status, 302);
		const saved = await db("project_notes").first("id");
		const location = `/project-notes/${saved.id}`;
		const showResponse = await fetch(`${url}${location}`, { signal: t.signal });
		const show = load(await showResponse.text());
		const editResponse = await fetch(`${url}${location}/edit`, {
			signal: t.signal,
		});
		const edit = load(await editResponse.text());
		const updated = await fetch(`${url}${location}`, {
			body: new URLSearchParams({
				_method: "PATCH",
				body: "Edited archive body",
				title: "Edited archive note",
			}),
			headers,
			method: "POST",
			redirect: "manual",
			signal: t.signal,
		});
		const rows = await db("project_notes").select(
			"project_id",
			"title",
			"body",
		);
		const deleted = await fetch(`${url}${location}`, {
			method: "DELETE",
			redirect: "manual",
			signal: t.signal,
		});
		const missing = await fetch(`${url}${location}`, { signal: t.signal });

		t.assert.deepStrictEqual<string | null>(
			created.headers.get("Location"),
			location,
		);
		t.assert.deepStrictEqual<number>(showResponse.status, 200);
		t.assert.match(show("body").text(), /Archive note/);
		t.assert.match(show("body").text(), /Archived Project/);
		t.assert.deepStrictEqual<number>(editResponse.status, 200);
		t.assert.deepStrictEqual<string | undefined>(
			edit("#title").attr("value"),
			"Archive note",
		);
		t.assert.deepStrictEqual<number>(updated.status, 302);
		t.assert.deepStrictEqual<string | null>(
			updated.headers.get("Location"),
			location,
		);
		t.assert.deepStrictEqual<
			{ project_id: number; title: string; body: string }[]
		>(rows, [
			{
				body: "Edited archive body",
				project_id: 202,
				title: "Edited archive note",
			},
		]);
		t.assert.deepStrictEqual<number>(deleted.status, 302);
		t.assert.deepStrictEqual<string | null>(
			deleted.headers.get("Location"),
			"/project-notes",
		);
		t.assert.deepStrictEqual<number>(missing.status, 404);
		t.assert.deepStrictEqual<{ id: number }[]>(
			await db("project_notes").select("id"),
			[],
		);
		t.assert.deepStrictEqual<typeof parentsBefore>(
			await db("projects").orderBy("id").select("*"),
			parentsBefore,
		);
	});

	for (const field of ["title", "body", "projectId"]) {
		it(`POST safely rejects repeated ${field} keys with that field's error and no insert`, async (t: TestContext) => {
			const { db, url } = await setupServer(t);
			await db("project_notes").insert(originalNote);
			const before = await db("project_notes").select("*");
			const fields: [string, string][] = [
				["projectId", "101"],
				["title", "Safe title"],
				["body", "Safe body"],
				[
					field,
					field === "projectId" ? "202" : "<script>alert('duplicate')</script>",
				],
			];

			const response = await fetch(`${url}/project-notes`, {
				body: new URLSearchParams(fields),
				headers,
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const document = load(await response.text());

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(
				document(`#${field}-error`).text(),
				/invalid|string|number|project|single|expected/i,
			);
			t.assert.deepStrictEqual<number>(
				document("script").filter((_, script) =>
					document(script).text().includes("alert('duplicate')"),
				).length,
				0,
			);
			t.assert.deepStrictEqual<typeof before>(
				await db("project_notes").select("*"),
				before,
			);
		});
	}
	for (const field of ["title", "body"]) {
		it(`PATCH safely rejects repeated ${field} keys with that field's error and no update`, async (t: TestContext) => {
			const { db, url } = await setupServer(t);
			await db("project_notes").insert(originalNote);
			const before = await db("project_notes").select("*");
			const fields: [string, string][] = [
				["title", "Safe title"],
				["body", "Safe body"],
				[field, "<script>alert('duplicate')</script>"],
			];

			const response = await fetch(`${url}/project-notes/501`, {
				body: new URLSearchParams(fields),
				headers,
				method: "PATCH",
				redirect: "manual",
				signal: t.signal,
			});
			const document = load(await response.text());

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(
				document(`#${field}-error`).text(),
				/invalid|string|single|expected/i,
			);
			t.assert.deepStrictEqual<number>(
				document("script").filter((_, script) =>
					document(script).text().includes("alert('duplicate')"),
				).length,
				0,
			);
			t.assert.deepStrictEqual<typeof before>(
				await db("project_notes").select("*"),
				before,
			);
		});
	}

	for (const field of ["title", "body"]) {
		for (const method of ["POST", "PATCH"]) {
			it(`${method} rejects an omitted ${field} with a field error and unchanged persistence`, async (t: TestContext) => {
				const { db, url } = await setupServer(t);
				await db("project_notes").insert(originalNote);
				const before = await db("project_notes").select("*");
				const fields: [string, string][] = [
					["projectId", "101"],
					["title", "  Raw title  "],
					["body", "  Raw body\n "],
				];

				const response = await fetch(
					`${url}/project-notes${method === "PATCH" ? "/501" : ""}`,
					{
						body: new URLSearchParams(
							fields.filter(([name]) => name !== field),
						),
						headers,
						method,
						redirect: "manual",
						signal: t.signal,
					},
				);
				const document = load(await response.text());

				t.assert.deepStrictEqual<number>(response.status, 200);
				t.assert.deepStrictEqual<string | null>(
					response.headers.get("Location"),
					null,
				);
				t.assert.match(
					document(`#${field}-error`).text(),
					/required|invalid|string|expected/i,
				);
				t.assert.deepStrictEqual<string | undefined>(
					document("#title").attr("value"),
					field === "title" ? "" : "  Raw title  ",
				);
				t.assert.deepStrictEqual<string>(
					document("#body").text(),
					field === "body" ? "" : "  Raw body\n ",
				);
				t.assert.deepStrictEqual<typeof before>(
					await db("project_notes").select("*"),
					before,
				);
			});
		}
	}

	it("preserves leading blank lines in edit and invalid-form values", async (t: TestContext) => {
		const { db, url } = await setupServer(t);
		const body = "\n\nFirst line\nLast line\n";
		await db("project_notes").insert({ ...originalNote, body });

		const response = await fetch(`${url}/project-notes/501/edit`, {
			signal: t.signal,
		});
		const document = load(await response.text());
		const invalid = await fetch(`${url}/project-notes/501`, {
			body: new URLSearchParams({ body, title: "" }),
			headers,
			method: "PATCH",
			signal: t.signal,
		});
		const form = load(await invalid.text());

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.deepStrictEqual<string>(document("#body").text(), body);
		t.assert.deepStrictEqual<number>(invalid.status, 200);
		t.assert.deepStrictEqual<string>(form("#body").text(), body);

		const edited = await fetch(`${url}/project-notes/501`, {
			body: new URLSearchParams({
				body: document("#body").text(),
				title: document("#title").attr("value") ?? "",
			}),
			headers,
			method: "PATCH",
			redirect: "manual",
			signal: t.signal,
		});
		const saved = await db("project_notes").select(
			"id",
			"project_id",
			"title",
			"body",
		);

		t.assert.deepStrictEqual<number>(edited.status, 302);
		t.assert.deepStrictEqual<
			{ body: string; id: number; project_id: number; title: string }[]
		>(saved, [{ body, id: 501, project_id: 101, title: "Original note" }]);
	});

	it("an empty project collection disables note submission and links to projects", async (t: TestContext) => {
		const { db, url } = await setupServer(t, []);

		const response = await fetch(`${url}/project-notes/create`, {
			signal: t.signal,
		});
		const document = load(await response.text());

		t.assert.deepStrictEqual<number>(response.status, 200);
		t.assert.deepStrictEqual<number>(
			document('form[action="/project-notes"] button[type="submit"]').length,
			1,
		);
		t.assert.deepStrictEqual<number>(
			document('form[action="/project-notes"] button[type="submit"][disabled]')
				.length,
			1,
		);
		t.assert.deepStrictEqual<number>(
			document("#projectId option").filter((_, option) =>
				/^\d+$/.test(document(option).attr("value") ?? ""),
			).length,
			0,
		);
		t.assert.ok(document('a[href="/projects"]').length > 0);
		t.assert.deepStrictEqual<{ id: number }[]>(
			await db("projects").select("id"),
			[],
		);
	});
});
