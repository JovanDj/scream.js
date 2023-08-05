import { IncomingHttpHeaders } from "node:http";

export interface Request {
  method(): string;
  headers(): IncomingHttpHeaders;
  url(): string;
}
