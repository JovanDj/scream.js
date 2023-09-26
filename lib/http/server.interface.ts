import type { HTTPContext } from "./http-context.js";

export interface Application {
  listen(port?: number, cb?: () => void): void;
  get(path: string, handler: (context: HTTPContext) => unknown): void;
  post(path: string, handler: (context: HTTPContext) => unknown): void;
  patch(path: string, handler: (context: HTTPContext) => unknown): void;
  put(path: string, handler: (context: HTTPContext) => unknown): void;
  delete(path: string, handler: (context: HTTPContext) => unknown): void;
  close(): void;
}
