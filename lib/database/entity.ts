export abstract class Entity {
	readonly _id: number;

	constructor(id: number) {
		if (!id) {
			throw new Error("Entity must have an ID");
		}

		this._id = id;
	}

	get id() {
		return this._id;
	}
}
