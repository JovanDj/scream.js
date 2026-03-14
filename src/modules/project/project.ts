export type ProjectStatusCode = "active" | "archived";

export type ProjectSnapshot = {
	createdAt: string;
	id: number;
	name: string;
	statusCode: ProjectStatusCode;
	updatedAt: string;
};

export type ProjectWriteInput = {
	name: string;
};

export class Project {
	readonly #createdAt: string;
	readonly #id: number;
	readonly #name: string;
	readonly #statusCode: ProjectStatusCode;
	readonly #updatedAt: string;

	constructor(snapshot: Readonly<ProjectSnapshot>) {
		this.#createdAt = snapshot.createdAt;
		this.#id = snapshot.id;
		this.#name = snapshot.name;
		this.#statusCode = snapshot.statusCode;
		this.#updatedAt = snapshot.updatedAt;
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

	get statusCode() {
		return this.#statusCode;
	}

	get updatedAt() {
		return this.#updatedAt;
	}

	apply(input: Readonly<ProjectWriteInput>) {
		return new Project({
			createdAt: this.#createdAt,
			id: this.#id,
			name: input.name,
			statusCode: this.#statusCode,
			updatedAt: new Date().toISOString(),
		});
	}

	archive() {
		return this.#withStatus("archived");
	}

	unarchive() {
		return this.#withStatus("active");
	}

	#withStatus(statusCode: ProjectStatusCode) {
		return new Project({
			createdAt: this.#createdAt,
			id: this.#id,
			name: this.#name,
			statusCode,
			updatedAt: new Date().toISOString(),
		});
	}
}
