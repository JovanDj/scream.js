import { NextFunction } from "express";
import { HttpContext } from "../http-context.js";
import { Request } from "../request.js";
import { Response } from "../response.js";

export class ExpressHttpContext<Body extends object>
  implements HttpContext<Body>
{
  constructor(
    private readonly _request: Request<Body>,
    private readonly _response: Response,
    private readonly _next: NextFunction
  ) {}

  get params() {
    return this._request.params;
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

  get body() {
    return this._request.body;
  }

  get id() {
    if (!this._request.params["id"]) {
      return undefined;
    }
    return +this._request.params["id"];
  }

  acceptsLanguages(languages: string[]) {
    return this._request.acceptsLanguages(languages);
  }

  end(chunk?: string) {
    this._response.end(chunk);
  }

  location(url: string) {
    return this._response.location(url);
  }

  json(data: Parameters<typeof this._response.json>[0]) {
    this._response.json(data);
  }

  status(code: number) {
    this._response.status(code);
    return this;
  }

  render(
    template: Parameters<typeof this._response.render>[0],
    locals: Parameters<typeof this._response.render>[1]
  ) {
    this._response.render(template, locals);
  }

  redirect(url: string) {
    this._response.redirect(url);
  }

  notFound() {
    this.status(404).end();
  }

  onClose(cb: () => void) {
    this._request.onClose(cb);
  }

  back() {
    this._response.back();
  }

  handleError(error: unknown) {
    this._next(error);
  }

  hasHeader(header: string) {
    return this._request.hasHeader(header);
  }

  text(message: string) {
    return this._response.text(message);
  }
}
