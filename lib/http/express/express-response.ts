import express from "express";
import { Response } from "../response.js";

export class ExpressResponse implements Response {
  constructor(private readonly _res: express.Response) {}

  json(data: object) {
    this._res.json(data);
  }

  end(chunk: Parameters<typeof this._res.end>[0]) {
    this._res.end(chunk);
  }

  status(code: number) {
    this._res.status(code);
  }

  render(template: string, locals = {}) {
    this._res.render(template, locals);
  }

  location(url: string): void {
    this._res.location(url);
  }

  redirect(url: string): void {
    this._res.redirect(url);
  }
}
