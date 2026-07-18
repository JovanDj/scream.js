import type { ExecutionResult } from "./execution-result.js";
import type { SqlQuery } from "./query-builder/sql-query.js";

export interface Connection {
	close(): Promise<void>;

	run(sqlQuery: SqlQuery): Promise<ExecutionResult>;

	all<T>(sqlQuery: SqlQuery): Promise<T[]>;
	get<T>(sqlQuery: SqlQuery): Promise<T | undefined>;

	transaction<T>(callback: (trx: Connection) => Promise<T>): Promise<T>;
}
