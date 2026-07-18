import { connectionContract } from "../connection.contract.js";
import { BetterSqliteConnection } from "./better-sqlite-connection.js";
import { Sqlite3Connection } from "./sqlite3-connection.js";

connectionContract("BetterSqliteConnection", () =>
	BetterSqliteConnection.connect({ database: ":memory:" }),
);

connectionContract("Sqlite3Connection", () =>
	Sqlite3Connection.connect({ database: ":memory:" }),
);
