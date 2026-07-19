import type { Connection } from "./connection.js";
import { Model } from "./model.js";
import type { SqlPrimitive } from "./query-builder/sql-query.js";

export abstract class TableModel extends Model {
	readonly #table: string;

	constructor(connection: Connection, table: string) {
		super(connection);
		this.#table = this.#identifier(table);
	}

	protected all<Row>(
		connection: Connection = this.connection,
	): Promise<readonly Row[]> {
		return connection.all<Row>({
			params: [],
			sql: `SELECT * FROM ${this.#table}`,
		});
	}

	protected findById(id: number, connection: Connection = this.connection) {
		return connection.get<unknown>({
			params: [id],
			sql: `SELECT * FROM ${this.#table} WHERE id = ?`,
		});
	}

	protected insert(
		values: Readonly<Record<string, SqlPrimitive>>,
		connection: Connection = this.connection,
	) {
		const entries = Object.entries(values);
		if (entries.length === 0) {
			throw new Error("Cannot insert an empty record");
		}

		const columns = entries.map(([name]) => this.#identifier(name)).join(", ");
		const placeholders = entries.map(() => "?").join(", ");

		return connection.run({
			params: entries.map(([, value]) => value),
			sql: `INSERT INTO ${this.#table} (${columns}) VALUES (${placeholders})`,
		});
	}

	protected updateById(
		id: number,
		values: Readonly<Record<string, SqlPrimitive>>,
		connection: Connection = this.connection,
	) {
		const entries = Object.entries(values);
		if (entries.length === 0) {
			throw new Error("Cannot update with an empty record");
		}

		const assignments = entries
			.map(([name]) => `${this.#identifier(name)} = ?`)
			.join(", ");

		return connection.run({
			params: [...entries.map(([, value]) => value), id],
			sql: `UPDATE ${this.#table} SET ${assignments} WHERE id = ?`,
		});
	}

	protected deleteById(id: number, connection: Connection = this.connection) {
		return connection.run({
			params: [id],
			sql: `DELETE FROM ${this.#table} WHERE id = ?`,
		});
	}

	#identifier(value: string): string {
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
			throw new Error(`Invalid SQL identifier: ${value}`);
		}

		return `"${value}"`;
	}
}
