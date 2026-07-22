import { connectionContract } from "../connection.contract.js";
import { ConnectionScheduler } from "../connection-scheduler.js";
import { BetterSqliteDriver } from "./better-sqlite-driver.js";
import { SqliteConnection } from "./sqlite-connection.js";
import { Sqlite3Driver } from "./sqlite3-driver.js";

connectionContract(
	"BetterSqliteDriver",
	async () =>
		new SqliteConnection(
			await BetterSqliteDriver.connect({ database: ":memory:" }),
			new ConnectionScheduler(),
		),
);

connectionContract(
	"Sqlite3Driver",
	async () =>
		new SqliteConnection(
			await Sqlite3Driver.connect({ database: ":memory:" }),
			new ConnectionScheduler(),
		),
);
