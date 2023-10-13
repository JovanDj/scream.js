import { Router } from "../router/router.interface.js";

export interface Application {
  createRouter(path: string, cb: (router: Router) => void): unknown;
  listen(port?: number, cb?: () => void): void;
  close(): void;
}
