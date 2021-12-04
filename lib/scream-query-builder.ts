import { QueryBuilder } from "./query-builder";

export class ScreamQueryBuilder implements QueryBuilder {
  private statement = "";
  private previous = "";

  select(fields: string[]): this {
    this.statement = "";
    this.statement = `SELECT ${fields ? fields.join(" ") : "*"}`;

    this.previous = this.select.name.toLocaleLowerCase();

    return this;
  }

  from(table: string): this {
    this.statement = this.statement.concat(` FROM ${table}`);

    this.previous = this.from.name.toLocaleLowerCase();
    return this;
  }

  getRawSql(): string {
    return this.statement;
  }

  createTable(name: string): this {
    this.statement = "";

    this.statement = this.statement.concat(
      `CREATE TABLE ${name.toLowerCase()}`
    );

    return this;
  }

  dropTable(table: string): this {
    this.statement = "";
    this.statement = `DROP TABLE ${table.toLowerCase()}`;
    return this;
  }
}
