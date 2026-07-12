import type { Database } from "@scream.js/database/db.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { schema } from "@scream.js/validator/schema.js";
import { ProjectsTable } from "../../tables/projects.table.js";

export class ProjectController {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async index(ctx: HttpContext) {
		const projects = (await ProjectsTable.create(this.#db).list()).map(
			(project) => ({
				...project,
				showUrl: `/projects/${project.id}`,
			}),
		);

		return ctx.render("project-index", {
			hasProjects: projects.length > 0 ? true : undefined,
			homeUrl: "/",
			projects,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	async show(ctx: HttpContext) {
		const id = this.#parseId(ctx);

		if (id === undefined) {
			return ctx.notFound();
		}

		const project = await ProjectsTable.create(this.#db).find(id);
		if (!project) {
			return ctx.notFound();
		}

		return ctx.render("project-show", {
			homeUrl: "/",
			project,
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	async store(ctx: HttpContext) {
		const parsed = schema
			.strictObject({
				name: schema
					.string()
					.default("")
					.transform((value) => value.trim())
					.refine((value) => value.length > 0, { message: "Required" }),
			})
			.safeParse(ctx.body());
		if (!parsed.success) {
			const nameIssue = parsed.error.issues.find(
				(issue) => issue.path.join(".") === "name",
			);

			return this.#renderCreate(ctx, "", nameIssue?.message);
		}

		try {
			const id = await this.#db.transaction((tx) =>
				ProjectsTable.create(tx).insert(parsed.data.name),
			);
			return ctx.redirect(`/projects/${id}`);
		} catch {
			return this.#renderCreate(
				ctx,
				parsed.data.name,
				"Project name must be unique",
			);
		}
	}

	async archive(ctx: HttpContext) {
		return this.#setStatus(ctx, "archived");
	}

	async unarchive(ctx: HttpContext) {
		return this.#setStatus(ctx, "active");
	}

	#renderCreate(ctx: HttpContext, name: string, error?: string) {
		return ctx.render("project-create", {
			errors: error === undefined ? {} : { name: error },
			fields: { name },
			homeUrl: "/",
			projectsUrl: "/projects",
			tagsUrl: "/tags",
			todosUrl: "/todos",
		});
	}

	async #setStatus(ctx: HttpContext, status: "active" | "archived") {
		const id = this.#parseId(ctx);
		if (id === undefined) {
			return ctx.notFound();
		}

		const result = await this.#db.transaction((tx) =>
			ProjectsTable.create(tx).setStatus(id, status),
		);
		if (!result) {
			return ctx.notFound();
		}

		return ctx.redirect(`/projects/${result.id}`);
	}

	#parseId(ctx: HttpContext) {
		const parsed = schema.coerce
			.number()
			.int()
			.positive()
			.safeParse(ctx.param("id"));
		return parsed.success ? parsed.data : undefined;
	}
}
