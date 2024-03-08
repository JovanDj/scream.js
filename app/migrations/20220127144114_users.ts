import { Knex } from "knex";

// SchemaInterface.ts
interface Column {
  primary(): Column;
  unique(): Column;
  references(table: string): Column;
  notNullable(): Column;
  defaultTo(value: number | string): Column;
}

interface Table {
  increments(columnName: string): Column;
  string(columnName: string, length?: number): Column;
  integer(columnName: string): Column;
  timestamps(): void;
}

interface Schema {
  createTable(
    tableName: string,
    callback: (table: Table) => void
  ): Promise<void>;
  dropTable(tableName: string): Promise<void>;
}

interface Migration {
  up(schema: Schema): Promise<void>;
  down(schema: Schema): Promise<void>;
}

export class ColumnBuilder implements Column {
  constructor(private readonly _columnBuilder: Knex.ColumnBuilder) {}

  primary(): this {
    this._columnBuilder.primary();
    return this;
  }

  unique(): this {
    this._columnBuilder.unique();
    return this;
  }

  references(table: string): this {
    this._columnBuilder.references(table);
    return this;
  }

  notNullable(): this {
    this._columnBuilder.notNullable();
    return this;
  }

  defaultTo(value: number | string): this {
    this._columnBuilder.defaultTo(value);
    return this;
  }
}

export class TableBuilder implements Table {
  constructor(private readonly _knexTableBuilder: Knex.TableBuilder) {}

  increments(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this._knexTableBuilder.increments(columnName));
  }

  string(columnName: string, length?: number): ColumnBuilder {
    return new ColumnBuilder(this._knexTableBuilder.string(columnName, length));
  }

  integer(columnName: string): ColumnBuilder {
    return new ColumnBuilder(this._knexTableBuilder.integer(columnName));
  }

  timestamps(): void {
    this._knexTableBuilder.timestamps();
  }
}

export class KnexSchema implements Schema {
  constructor(private readonly _knexInstance: Knex) {}

  async createTable(tableName: string, callback: (table: Table) => void) {
    return this._knexInstance.schema.createTable(
      tableName,
      (knexTableBuilder) => {
        const table = new TableBuilder(knexTableBuilder);
        callback(table);
      }
    );
  }

  async dropTable(tableName: string) {
    return this._knexInstance.schema.dropTable(tableName);
  }
}

export class CreateUserTableMigration implements Migration {
  private readonly _table = "users";

  async up(schema: Schema) {
    return schema.createTable(this._table, (table) => {
      table.increments("user_id").primary();
      table.string("email").unique().notNullable();
      table.timestamps();
    });
  }

  async down(schema: Schema) {
    return schema.dropTable(this._table);
  }
}
