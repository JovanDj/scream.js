import type { Server } from "node:http";

import type { Router } from "./router.js";

export interface Application extends Router {
	listen(port: number, cb?: () => void): Server;
}
