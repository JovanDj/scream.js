import type { Request } from "./request.js";
import type { Response } from "./response.js";

export class HTTPContext {
  constructor(
    private readonly _request: Request,
    private readonly _response: Response
  ) {}

  get request() {
    return this._request;
  }

  get response() {
    return this._response;
  }
}
