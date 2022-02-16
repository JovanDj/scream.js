import { IncomingMessage, ServerResponse } from "http";

export class HTTPContext {
  constructor(
    private readonly _request: IncomingMessage,
    private readonly _response: ServerResponse
  ) {}

  get request() {
    return this._request;
  }

  get response() {
    return this._response;
  }
}
