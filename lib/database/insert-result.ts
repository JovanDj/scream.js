export class InsertResult {
	readonly #lastId: number | undefined;

	constructor(lastId?: number) {
		this.#lastId = lastId;
	}

	/**
	 * Id of the last row that was created
	 */
	get lastId() {
		return this.#lastId;
	}
}
