import type { Connection } from "./connection.js";

export abstract class Model {
	protected readonly connection: Connection;

	constructor(connection: Connection) {
		this.connection = connection;
	}
}
