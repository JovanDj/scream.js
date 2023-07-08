import type { Response as Res } from "express";
import type { Response } from "./response";

export class ExpressResponse implements Response {
  constructor(private readonly res: Res) {
    console.log("express response");
  }

  json(data: unknown) {
    this.res.json(data);
  }

  end(chunk?: string) {
    this.res.end(chunk);
  }

  status(code: number) {
    console.log({ code });
    this.res.status(code);
  }

  render(template: any, locals: { string: any }) {
    this.res.render(template, locals);
  }
}
