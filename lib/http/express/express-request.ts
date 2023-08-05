import { Request as Req } from "express";
import { Request } from "../request.js";

export class ExpressRequest implements Request {
  constructor(private readonly req: Req) {}

  method() {
    return this.req.method;
  }

  headers() {
    return this.req.headers;
  }

  url() {
    return this.req.url;
  }
}
