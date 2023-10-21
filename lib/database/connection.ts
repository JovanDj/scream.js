import { InsertResult } from "./insert-result.js";

export interface Connection extends AsyncDisposable {
  /**
   *  Executes multiple queries
   */
  execute(queryString: string, params: string[]): Promise<void>;
  close(): Promise<void>;

  /**
   * Execute single query
   */
  run(sqlString: string, params?: string[]): Promise<InsertResult>;
  all<T>(sqlString: string, params?: string[]): Promise<T[]>;
  get<T>(sqlString: string, params?: string[]): Promise<T | undefined>;
}
