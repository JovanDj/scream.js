import KoaRouter from "@koa/router";
import { Context } from "koa";
import { Request } from "../request.js";

export class KoaRequest implements Request {
  constructor(
    private readonly req: Context["request"],
    private readonly router: KoaRouter,
  ) {}

  get params() {
    return { ...this.router.params };
  }

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
