import express from "express";
import type { Request } from "../request.js";

export class ExpressRequest implements Request {
  constructor(private readonly _req: express.Request<object, object, object>) {}

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

  acceptsLanguages(languages: string[]) {
    return this._req.acceptsLanguages(languages) || "en-US";
  }

  onClose(cb: () => void) {
    this._req.on("close", cb);
  }

  onError(cb: () => void) {
    this._req.on("error", cb);
  }

  hasHeader(header: string) {
    return !!this._req.header(header);
  }
}
