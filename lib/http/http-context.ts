import type { Request } from "./request.js";
import type { Response } from "./response.js";

export class HttpContext<Body = object> {
  constructor(
    private readonly _request: Request<Body>,
    private readonly _response: Response
  ) {}

  get body(): Body {
    return this._request.body;
  }

  get id() {
    if (!this._request.params["id"]) {
      throw new Error("No id param present.");
    }

    return +this._request.params["id"];
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
    this._response.end();
  }
}
