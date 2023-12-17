import { ConnectionOptions } from "./connection-options.js";
import { Connection } from "./connection.js";
import { Database } from "./database.js";
import { QueryBuilder } from "./query-builder/query-builder.js";

export interface DatabaseAccess extends Database, Connection, QueryBuilder {}

export class DatabaseFacade implements DatabaseAccess {
  constructor(
    private readonly _database: Database,
    private readonly _connection: Connection,
    private readonly _queryBuilder: QueryBuilder
  ) {}

  async connect(options: ConnectionOptions) {
    return this._database.connect(options);
  }

  async close() {
    return this._connection.close();
  }

  async run(sqlString: string, params?: string[]) {
    return this._connection.run(sqlString, params);
  }

  async exec(sqlString: string) {
    return this._connection.exec(sqlString);
  }

  async all<T>(sqlString: string, params?: string[]) {
    return this._connection.all<T>(sqlString, params);
  }

  async get<T>(sqlString: string, params?: string[] | undefined) {
    return this._connection.get<T>(sqlString, params);
  }

  async truncateTable(table: string) {
    return this._connection.truncateTable(table);
  }

  select(fields?: string[]) {
    return this._queryBuilder.select(fields);
  }

  from(table: string) {
    return this._queryBuilder.from(table);
  }

  where(condition: string) {
    return this._queryBuilder.where(condition);
  }

  build() {
    return this._queryBuilder.build();
  }
}
