import { IndexController } from "@scream.js/http/controllers/index.controller.js";
import type { TagIndexData, TagIndexInput } from "../tag.schema.js";
import { tagIndexInputSchema } from "../tag.schema.js";

export class TagIndexController extends IndexController<
	TagIndexInput,
	TagIndexData
> {
	protected inputSchema() {
		return tagIndexInputSchema;
	}

	protected pageUrl(input: TagIndexInput, page: number) {
		return this.#createUrl(input, { page });
	}

	protected present(tags: TagIndexData, input: TagIndexInput) {
		return {
			errors: {},
			hasTags: tags.length > 0 ? true : undefined,
			homeUrl: "/",
			notesUrl: "/project-notes",
			sorts: {
				created: this.#sortUrl(input, "created", "desc"),
				name: this.#sortUrl(input, "name", "asc"),
			},
			tags: tags.map((tag) => ({
				...tag,
				destroyUrl: `/tags/${tag.id}`,
				showUrl: `/tags/${tag.id}`,
			})),
			tagsUrl: "/tags",
			todosUrl: "/todos",
		};
	}

	protected template() {
		return "tag/index";
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
}
