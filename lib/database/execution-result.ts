export class ExecutionResult {
	readonly #affectedRows: number;
	readonly #insertedId: number | undefined;

	constructor(insertedId: number | undefined, affectedRows: number) {
		this.#affectedRows = affectedRows;
		this.#insertedId = insertedId;
	}

	insertedId() {
		return this.#insertedId;
	}

	affectedRows() {
		return this.#affectedRows;
	}
}
