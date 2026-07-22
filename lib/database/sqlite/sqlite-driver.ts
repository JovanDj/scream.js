import type { QueryExecutor } from "../connection.js";

export interface SqliteDriver extends QueryExecutor {
	close(): Promise<void>;
}
