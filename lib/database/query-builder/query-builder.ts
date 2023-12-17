export interface QueryBuilder {
  select(fields?: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  where(condition: string): QueryBuilder;

  build(): string;
}
