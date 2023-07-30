export interface Database {
  connect(): Promise<void>;
  execute(queryString: string, params: string[]): Promise<void>;
  close(): Promise<void>;

  /**
   * Execute single query
   * @param queryString
   * @param params
   */
  run(sqlString: string, params?: string[]): Promise<Database>;
}
