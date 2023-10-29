import { Context } from "koa";
import { Request } from "../request.js";

export class KoaRequest implements Request {
  constructor(private readonly _req: Context["request"]) {}

  get params() {
    return {};
  }

  method() {
    return this._req.method;
  }
  headers() {
    return this._req.headers;
  }
  url() {
    return this._req.url;
  }
}
