export interface Database {
  connect(): Promise<void>;
  execute(queryString: string, params: string[]): Promise<void>;
  close(): Promise<void>;
}
