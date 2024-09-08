import type { ConnectionOptions } from "./connection-options.js";
import type { Connection } from "./connection.js";
export interface Database {
	connect(options: ConnectionOptions): Promise<Connection>;
}
