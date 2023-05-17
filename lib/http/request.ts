import type { IncomingMessage } from "node:http";

export class Request {
  constructor(private readonly _req: IncomingMessage) {}

  get method() {
    return this._req.method ?? "GET";
  }

  get headers() {
    return this._req.headers;
  }

  get url() {
    return this._req.url;
  }
}
