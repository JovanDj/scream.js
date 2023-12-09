export interface QueryBuilder {
  select(fields?: string[]): this;
  from(table: string): this;
  where(condition: string): this;

  build(): string;
}
