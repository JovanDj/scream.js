import { Logger } from "../logger/logger.interface";
import { Request } from "./request";
import { Response } from "./response";

export class HTTPContext {
  constructor(
    private readonly _request: Request,
    private readonly _response: Response,
    private readonly _logger: Logger
  ) {}

  get request() {
    return this._request;
  }

  get response() {
    return this._response;
  }

  get logger() {
    return this._logger;
  }
}
