import type { SqliteDatabase } from "./db.js";

export abstract class Model {
	protected readonly db: SqliteDatabase;
	readonly #table: string;

	constructor(db: SqliteDatabase, table: string) {
		this.db = db;
		this.#table = this.#identifier(table);
	}

	protected all<Row>(): readonly Row[] {
		return this.db.prepare<[], Row>(`SELECT * FROM ${this.#table}`).all();
	}

	protected findById<Row>(id: number): Row | undefined {
		return this.db
			.prepare<[number], Row>(`SELECT * FROM ${this.#table} WHERE id = ?`)
			.get(id);
	}

	protected insert(values: Readonly<Record<string, unknown>>) {
		const entries = Object.entries(values);
		if (entries.length === 0) {
			throw new Error("Cannot insert an empty record");
		}

		const columns = entries.map(([name]) => this.#identifier(name)).join(", ");
		const placeholders = entries.map(() => "?").join(", ");

		return this.db
			.prepare(
				`INSERT INTO ${this.#table} (${columns}) VALUES (${placeholders})`,
			)
			.run(...entries.map(([, value]) => value));
	}

	protected updateById(
		id: number,
		values: Readonly<Record<string, unknown>>,
	): boolean {
		const entries = Object.entries(values);
		if (entries.length === 0) {
			throw new Error("Cannot update with an empty record");
		}

		const assignments = entries
			.map(([name]) => `${this.#identifier(name)} = ?`)
			.join(", ");

		return (
			this.db
				.prepare(`UPDATE ${this.#table} SET ${assignments} WHERE id = ?`)
				.run(...entries.map(([, value]) => value), id).changes > 0
		);
	}

	protected deleteById(id: number): boolean {
		return (
			this.db
				.prepare<[number]>(`DELETE FROM ${this.#table} WHERE id = ?`)
				.run(id).changes > 0
		);
	}

	#identifier(value: string): string {
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
			throw new Error(`Invalid SQL identifier: ${value}`);
		}

		return `"${value}"`;
	}
}
