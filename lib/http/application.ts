import type { Server } from "node:http";

import type { Middleware } from "./middleware.js";
import type { Router } from "./router.js";

export interface Application extends Router {
	listen(port: number, cb?: () => void): Server;
	use(middleware: Middleware): this;
}
