import { IncomingHttpHeaders } from "node:http";

export interface Request<Body = object> {
  params: Record<string, string>;
  body: Body;
  method: string;
  headers: IncomingHttpHeaders;

  /**
   * The url of the current route
   */
  url: string;
  onClose(cb: () => void): void;
}
