import type { Request } from "./request.js";
import type { Response } from "./response.js";

export class HTTPContext {
  constructor(
    private readonly _request: Request,
    private readonly _response: Response,
  ) {}

  get request() {
    return this._request;
  }

  get response() {
    return this._response;
  }

  json(data: Parameters<typeof this.response.json>[0]) {
    this.response.json(data);
  }

  status(code: Parameters<typeof this.response.status>[0]) {
    this.response.status(code);
  }

  render(
    template: Parameters<typeof this.response.render>[0],
    locals: Parameters<typeof this.response.render>[1],
  ) {
    this.response.render(template, locals);
  }
}
