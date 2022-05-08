export interface Database {
  connect(): Promise<void>;
  query(queryString: string, param?: string): Promise<void>;
  close(): Promise<void>;
  prepare(queryString: string);
}
