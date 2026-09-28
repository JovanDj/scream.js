import type { Database } from "@scream.js/database/db.js";
import { IndexAction, type IndexInput } from "../index.action.js";
import type { TagIndexData, TagIndexInput } from "./tag.schema.js";
import { tagIndexDataSchema, tagIndexInputSchema } from "./tag.schema.js";

export class TagIndexAction extends IndexAction<TagIndexInput, TagIndexData> {
	protected inputSchema() {
		return tagIndexInputSchema;
	}

	protected async load(input: IndexInput<TagIndexInput>, db: Database) {
		return this.#query(input, db).limit(input.limit).offset(input.offset);
	}

	protected dataSchema() {
		return tagIndexDataSchema;
	}

	protected pageUrl(input: TagIndexInput, page: number) {
		return this.#createUrl(input, { page });
	}

	protected present(tags: TagIndexData, input: TagIndexInput) {
		return {
			errors: { name: "" },
			pageTitle: "Tags",
			sorts: {
				created: this.#sortUrl(input, "created", "desc"),
				name: this.#sortUrl(input, "name", "asc"),
			},
			tags,
		};
	}

	protected template() {
		return "tag-index";
	}

	#sortColumn(sort: TagIndexInput["sort"]) {
		switch (sort) {
			case "created":
				return "tags.id";
			case "name":
				return "tags.name";
		}
	}

	#sortUrl(
		input: TagIndexInput,
		sort: TagIndexInput["sort"],
		defaultDirection: TagIndexInput["direction"],
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
		input: TagIndexInput,
		changes: {
			direction?: TagIndexInput["direction"];
			page?: number;
			sort?: TagIndexInput["sort"];
		},
	) {
		const direction = changes.direction ?? input.direction;
		const page = changes.page ?? input.page;
		const sort = changes.sort ?? input.sort;
		const params = new URLSearchParams();
		if (sort !== "name") {
			params.set("sort", sort);
		}
		if (direction !== "asc") {
			params.set("direction", direction);
		}
		if (page > 1) {
			params.set("page", String(page));
		}

		const query = params.toString();
		return query.length > 0 ? `/tags?${query}` : "/tags";
	}

	#query(input: TagIndexInput, db: Database) {
		const query = db("tags").select(
			"tags.id",
			"tags.name",
			"tags.created_at",
			"tags.updated_at",
		);

		query.orderBy(this.#sortColumn(input.sort), input.direction);
		if (input.sort !== "created") {
			query.orderBy("tags.id", "desc");
		}

		return query;
	}
}
