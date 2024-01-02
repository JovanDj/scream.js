import express from "express";
import { Response } from "../response.js";

export class ExpressResponse implements Response {
  constructor(private readonly _res: express.Response) {}

  json(data: object) {
    this._res.json(data);
  }

  end(chunk?: unknown) {
    this._res.end(chunk);
  }

  status(code: number) {
    this._res.status(code);
  }

  render(template: string, locals = {}) {
    this._res.render(template, locals);
  }

  location(url: string) {
    this._res.location(url);
  }

  redirect(url: string) {
    this._res.redirect(url);
  }

  back() {
    this._res.redirect("back");
  }
}
