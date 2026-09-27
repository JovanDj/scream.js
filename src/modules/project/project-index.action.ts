import type { Database } from "@scream.js/database/db.js";
import { IndexAction, type IndexInput } from "../index.action.js";
import type { ProjectIndexData, ProjectIndexInput } from "./project.schema.js";
import {
	projectIndexDataSchema,
	projectIndexInputSchema,
} from "./project.schema.js";

export class ProjectIndexAction extends IndexAction<
	ProjectIndexInput,
	ProjectIndexData
> {
	protected inputSchema() {
		return projectIndexInputSchema;
	}

	protected async load(input: IndexInput<ProjectIndexInput>, db: Database) {
		const query = db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.select(
				"projects.id",
				"projects.name",
				db.ref("project_statuses.code").as("status_code"),
			);

		if (input.search.length > 0) {
			query.andWhereLike("projects.name", `%${input.search}%`);
		}
		if (input.status !== "all") {
			query.where({ "project_statuses.code": input.status });
		}

		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("projects.id", "desc");
		}

		return query.limit(input.limit).offset(input.offset);
	}

	protected dataSchema() {
		return projectIndexDataSchema;
	}

	protected pageUrl(input: ProjectIndexInput, page: number) {
		return this.#createUrl(input, { page });
	}

	protected present(projects: ProjectIndexData, input: ProjectIndexInput) {
		return {
			direction: input.direction,
			filters: {
				active: this.#createUrl(input, { page: 1, status: "active" }),
				all: this.#createUrl(input, { page: 1, status: "all" }),
				archived: this.#createUrl(input, { page: 1, status: "archived" }),
			},
			pageTitle: "Projects",
			projects,
			search: input.search,
			sort: input.sort,
			sorts: {
				created: this.#sortUrl(input, "created", "desc"),
				name: this.#sortUrl(input, "name", "asc"),
				status: this.#sortUrl(input, "status", "asc"),
			},
			status: input.status,
		};
	}

	protected template() {
		return "project-index";
	}

	#sortColumn(sort: ProjectIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "projects.id";
			case "name":
				return "projects.name";
			case "status":
				return "project_statuses.code";
		}
	}

	#sortUrl(
		input: ProjectIndexInput,
		sort: ProjectIndexInput["sort"],
		defaultDirection: ProjectIndexInput["direction"],
	) {
		return this.#createUrl(input, {
			direction:
				input.sort === sort && input.direction === defaultDirection
					? defaultDirection === "asc"
						? "desc"
						: "asc"
					: defaultDirection,
			page: 1,
			sort,
		});
	}

	#createUrl(
		input: ProjectIndexInput,
		changes: {
			direction?: ProjectIndexInput["direction"];
			page?: number;
			sort?: ProjectIndexInput["sort"];
			status?: ProjectIndexInput["status"];
		},
	) {
		const direction = changes.direction ?? input.direction;
		const page = changes.page ?? input.page;
		const sort = changes.sort ?? input.sort;
		const status = changes.status ?? input.status;
		const params = new URLSearchParams();
		if (status !== "all") {
			params.set("status", status);
		}
		if (input.search.length > 0) {
			params.set("search", input.search);
		}
		if (sort !== "created") {
			params.set("sort", sort);
		}
		if (direction !== "desc") {
			params.set("direction", direction);
		}
		if (page > 1) {
			params.set("page", String(page));
		}

		const query = params.toString();
		return query.length > 0 ? `/projects?${query}` : "/projects";
	}
}
