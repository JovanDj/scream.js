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
    this._req.on("close", cb);
  }
}
