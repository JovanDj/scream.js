import type { InsertResult } from "./insert-result.js";
import type { SqlQuery } from "./query-builder/sql-query.js";

export interface Connection {
	close(): Promise<void>;

	run(sqlQuery: SqlQuery): Promise<InsertResult>;
	exec(sqlString: string): Promise<void>;

	all<T>(sqlQuery: SqlQuery): Promise<T[]>;
	get<T>(sqlQuery: SqlQuery): Promise<T | undefined>;
}
