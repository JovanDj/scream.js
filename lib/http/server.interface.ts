import type { HTTPContext } from "./http-context.js";

export interface Server {
  listen(port: number, cb?: () => void): void;
  get(path: string, handler: (context: HTTPContext) => void): void;
}
