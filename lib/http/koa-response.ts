import { type Response as Res } from "koa";
import type { Response } from "./response";

export class KoaResponse implements Response {
  constructor(private readonly res: Res) {}

  json(data: unknown) {
    this.res.body = data;
  }

  end(chunk?: string) {
    this.res.res.end(chunk);
  }

  status(code: number) {
    console.log({ code });
    this.res.status = code;
  }

  render(template: any, locals: { string: any }) {
    this.end();
  }
}
