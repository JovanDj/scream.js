import type { Entity } from "@scream.js/database/entity.js";
import type { Serializable } from "@scream.js/http/serializable.js";

export class Todo implements Entity, Serializable<Todo> {
	readonly #id: number;
	readonly #title: string;

	constructor(id: number, title = "") {
		this.#id = id;
		this.#title = title;
	}

	get id() {
		return this.#id;
	}

	get title() {
		return this.#title;
	}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
		};
	}
}
