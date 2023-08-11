import express from "express";
import { Response } from "../response.js";

export class ExpressResponse implements Response {
  constructor(private readonly res: express.Response) {}

  json(data: unknown) {
    this.res.json(data);
  }

  end(chunk?: string) {
    this.res.end(chunk);
  }

  status(code: number) {
    this.res.status(code);
  }

  render(template: string, locals = {}) {
    this.res.render(template, locals);
  }
}
