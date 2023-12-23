import type { Request } from "./request.js";
import type { Response } from "./response.js";

export class HttpContext<Body = object> implements Request<Body>, Response {
  constructor(
    private readonly _request: Request<Body>,
    private readonly _response: Response
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
      throw new Error("No id param present.");
    }

    return +this._request.params["id"];
  }

  end(chunk?: string) {
    return this._response.end(chunk);
  }

  location(url: string) {
    return this._response.location(url);
  }

  json(data: Parameters<typeof this._response.json>[0]) {
    this._response.json(data);
  }

  status(code: Parameters<typeof this._response.status>[0]) {
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
    this.status(404);
    this.end();
  }

  onClose(cb: () => void) {
    this._request.onClose(cb);
  }
}
