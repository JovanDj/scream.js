import { ConnectionOptions } from "./connection-options.js";
import { Connection } from "./connection.js";
export interface Database {
  connect(options: ConnectionOptions): Promise<Connection>;
}
