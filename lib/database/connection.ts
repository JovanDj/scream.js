import { InsertResult } from "./insert-result.js";

export interface Connection {
  close(): Promise<void>;

  /**
   * Execute single query
   */
  run(sqlString: string, params?: string[]): Promise<InsertResult>;
  exec(sqlString: string): Promise<void>;

  all<T>(sqlString: string, params?: string[]): Promise<T[]>;
  get<T>(sqlString: string, params?: string[]): Promise<T | undefined>;

  truncateTable(table: string): Promise<void>;
}
