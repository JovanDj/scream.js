import { Entity } from "@scream.js/database/entity.js";
import type { Serializable } from "@scream.js/http/serializable.js";

export class Todo extends Entity implements Serializable<Todo> {
	readonly #title: string;
	readonly #userId: number;

	constructor(id: number, userId: number, title: string) {
		super(id);

		if (!title) {
			throw new Error("Todo must have a title");
		}

		if (!userId) {
			throw new Error("Todo must be associated with a user");
		}

		this.#userId = userId;
		this.#title = title;
	}

	get title() {
		return this.#title;
	}

	get userId() {
		return this.#userId;
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			userId: this.userId,
		};
	}
}
