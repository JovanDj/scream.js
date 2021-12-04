export interface QueryBuilder {
  select(fields?: string[]): this;
  from(table: string): this;
  dropTable(table: string): this;
  getRawSql(): string;
  createTable(name: string): this;
}
