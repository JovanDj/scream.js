import { Context } from "koa";
import { Response } from "../response.js";

export class KoaResponse implements Response {
  constructor(private readonly _ctx: Context["response"]) {}

  get ctx() {
    return this._ctx;
  }

  json(data: unknown) {
    this.ctx.type = "application/json";
    this.ctx.body = data;
  }

  end(chunk?: string) {
    this.ctx.res.end(chunk);
  }

  status(code: number) {
    this.ctx.status = code;
  }

  render() {
    this.end();
  }
}
