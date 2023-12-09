import { IncomingHttpHeaders } from "node:http";

export interface Request<Body = object> {
  params: Record<string, string>;
  body: Body;
  method(): string;
  headers(): IncomingHttpHeaders;
  url(): string;
}
