import { IncomingMessage, ServerResponse } from "http";

export class HTTPContext {
  constructor(
    private readonly _request: IncomingMessage,
    private readonly _response: ServerResponse
  ) {
    this.request.on("error", (err) => {
      console.error(err);
      this.response.statusCode = 400;
      this.response.end();
    });

    this.response.on("error", (err) => {
      console.error(err);
    });
  }

  get request() {
    return this._request;
  }

  get response() {
    return this._response;
  }
}
