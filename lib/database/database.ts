import { InsertResult } from "./insert-result.js";

export interface Database {
  connect(): Promise<Database>;
  execute(queryString: string, params: string[]): Promise<void>;
  close(): Promise<void>;

  /**
   * Execute single query
   * @param queryString
   * @param params
   */
  run(sqlString: string, params?: string[]): Promise<InsertResult>;
  all<T>(sqlString: string, params?: string[]): Promise<T[]>;
  get<T>(sqlString: string, params?: string[]): Promise<T | undefined>;
}
