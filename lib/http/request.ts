import type { IncomingMessage } from "http";

export class Request {
  constructor(private readonly req: IncomingMessage) {}

  get method() {
    return this.req.method ?? "GET";
  }

  get headers() {
    return this.req.headers;
  }

  get url() {
    return this.req.url;
  }
}
