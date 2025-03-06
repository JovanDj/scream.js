export abstract class Entity {
	readonly #id: number;

	constructor(id: number) {
		if (!id) {
			throw new Error("Entity must have an ID");
		}

		this.#id = id;
	}

	get id() {
		return this.#id;
	}
}
