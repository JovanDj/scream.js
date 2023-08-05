import { Context } from "koa";
import { Request } from "../request.js";

export class KoaRequest implements Request {
  constructor(private readonly req: Context["request"]) {}

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
