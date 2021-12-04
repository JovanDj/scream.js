import { IncomingMessage } from "http";

export class Request {
  constructor(private readonly req: IncomingMessage) {}

  get headers() {
    return this.req.headers;
  }

  get url() {
    return this.req.url || "";
  }

  get origin() {
    return `${this.protocol}://${this.host}`;
  }
}
