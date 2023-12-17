import { Connection } from "@scream.js/database/connection.js";
import {
  DatabaseAccess,
  DatabaseFacade,
} from "@scream.js/database/database-facade.js";
import { Database } from "@scream.js/database/database.js";
import { SqlQueryVisitor } from "@scream.js/database/query-builder/query-builder-visitor.js";
import { QueryBuilder } from "@scream.js/database/query-builder/query-builder.js";
import { SqlQueryBuilder } from "@scream.js/database/query-builder/scream-query-builder.js";
import { SqliteDatabase } from "@scream.js/database/sqlite/sqlite-database.js";

const db: Database = new SqliteDatabase();

export const connection: Connection = await db.connect({
  database: ":memory:",
});

const queryBuider: QueryBuilder = new SqlQueryBuilder(new SqlQueryVisitor());

export const databaseFacade: DatabaseAccess = new DatabaseFacade(
  db,
  connection,
  queryBuider
);
