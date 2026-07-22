import type { ExecutionResult } from "./execution-result.js";
import type { SqlQuery } from "./query-builder/sql-query.js";

export interface QueryExecutor {
	run(sqlQuery: SqlQuery): Promise<ExecutionResult>;

	all<T>(sqlQuery: SqlQuery): Promise<readonly T[]>;
	get<T>(sqlQuery: SqlQuery): Promise<T | undefined>;
}

export interface Transaction extends QueryExecutor {}

export interface Connection extends QueryExecutor {
	transaction<T>(
		operation: (transaction: Transaction) => Promise<T>,
	): Promise<T>;

	close(): Promise<void>;
}
