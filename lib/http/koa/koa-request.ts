import koa from "koa";
import { Request } from "../request.js";

export class KoaRequest implements Request {
  constructor(private readonly _req: koa.Request) {}

  get body() {
    return this._req;
  }

  get params() {
    return {};
  }

  get method() {
    return this._req.method;
  }
  get headers() {
    return this._req.headers;
  }
  get url() {
    return this._req.url;
  }

  onClose(cb: () => void): void {
    this._req.app.on("error", cb);
  }
}
