import express from "express";
import { Request } from "../request.js";

export class ExpressRequest implements Request {
  constructor(
    private readonly _req: express.Request<
      Record<string, never>,
      Record<string, never>,
      object
    >
  ) {}

  get body() {
    return { ...this._req.body };
  }

  get params() {
    return { ...this._req.params };
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
