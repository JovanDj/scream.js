export interface QueryBuilder {
  select(fields?: string[]): QueryBuilder;
  from(table: string): QueryBuilder;
  where(condition: string): QueryBuilder;
  orderBy(fields: string[], order: "ASC" | "DESC"): QueryBuilder;
  build(): string;
}
