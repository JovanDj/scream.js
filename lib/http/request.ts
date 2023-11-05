import { IncomingHttpHeaders } from "node:http";

export interface Request {
  params: Record<string, string>;
  body: Record<string, string>;
  method(): string;
  headers(): IncomingHttpHeaders;
  url(): string;
}
