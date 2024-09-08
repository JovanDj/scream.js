import type { Middleware } from "./middleware.js";
import type { Router } from "./router.interface.js";

export interface Application extends Router {
	listen(port: number, cb?: () => void): this;
	use(middleware: Middleware): this;
}
