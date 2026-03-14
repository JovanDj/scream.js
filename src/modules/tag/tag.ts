export type TagSnapshot = {
	createdAt: string;
	id: number;
	name: string;
};

export type TagWriteInput = {
	name: string;
};

export class Tag {
	readonly #createdAt: string;
	readonly #id: number;
	readonly #name: string;

	constructor(snapshot: Readonly<TagSnapshot>) {
		this.#createdAt = snapshot.createdAt;
		this.#id = snapshot.id;
		this.#name = snapshot.name;
	}

	get createdAt() {
		return this.#createdAt;
	}

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}
}
