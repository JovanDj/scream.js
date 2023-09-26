import { IncomingHttpHeaders } from "node:http";

export interface Request {
  params: { [name: string]: string };

  method(): string;
  headers(): IncomingHttpHeaders;
  url(): string;
}
