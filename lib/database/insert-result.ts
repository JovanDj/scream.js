export class InsertResult {
	readonly #lastId: number | undefined;

	constructor(lastId?: number) {
		this.#lastId = lastId;
	}

	/**
	 * Id of the last row that was created
	 */
	lastId() {
		return this.#lastId;
	}
}
