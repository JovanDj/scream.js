import { Migration } from "../lib/migration";
import { QueryBuilder } from "../lib/query-builder";

export class UsersMigration implements Migration {
  constructor(private queryBuilder: QueryBuilder) {}

  up(): string {
    return this.queryBuilder.createTable("users").getRawSql();
  }

  down(): string {
    return this.queryBuilder.dropTable("users").getRawSql();
  }
}
