import { type Response as Res } from "koa";
import type { Response } from "./response.js";

export class KoaResponse implements Response {
  constructor(private readonly res: Res) {}

  json(data: unknown) {
    this.res.body = data;
  }

  end(chunk?: string) {
    this.res.res.end(chunk);
  }

  status(code: number) {
    this.res.status = code;
  }

  render() {
    this.end();
  }
}
