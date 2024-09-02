import express, { NextFunction } from "express";
import { HttpContext } from "../http-context.js";

export class ExpressHttpContext<Body = object> implements HttpContext<Body> {
  constructor(
    private readonly _request: express.Request<object, object, Body>,
    private readonly _response: express.Response,
    private readonly _next: NextFunction,
  ) {}

  get body() {
    return { ...this._request.body };
  }

  get params() {
    return { ...this._request.params };
  }

  get method() {
    return this._request.method;
  }

  get headers() {
    return this._request.headers;
  }

  get url() {
    return this._request.url;
  }

  json(data: object) {
    this._response.json(data);
  }

  end(chunk?: unknown) {
    this._response.end(chunk);
  }

  status(code: number) {
    this._response.status(code);
    return this;
  }

  render(template: string, locals = {}) {
    return new Promise<void>((resolve, reject) => {
      try {
        resolve(this._response.render(template, locals));
      } catch (error) {
        if (error instanceof Error) {
          reject(error);
        }
      }
    });
  }

  location(url: string) {
    this._response.location(url);
  }

  redirect(url: string) {
    this._response.redirect(url);
  }

  back() {
    this._response.redirect("back");
  }

  text(message: string) {
    this._response.setHeader("Content-Type", "text/plain");
    this.end(message);
  }

  acceptsLanguages(languages: string[]) {
    return this._request.acceptsLanguages(languages) || "en-US";
  }

  onClose(cb: () => void) {
    this._request.on("close", cb);
  }

  onError(cb: () => void) {
    this._request.on("error", cb);
  }

  hasHeader(header: string) {
    return !!this._request.header(header);
  }

  notFound() {
    this.status(404).end();
  }

  handleError(error: unknown) {
    this._next(error);
  }
}
