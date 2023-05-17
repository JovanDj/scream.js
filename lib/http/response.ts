import type { ServerResponse } from "http";

export class Response {
  constructor(private readonly res: ServerResponse) {}

  json(data: unknown) {
    this.res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(data)),
    });

    this.res.write(JSON.stringify(data));
    this.res.end();
  }

  end(chunk?: string) {
    return this.res.end(chunk);
  }

  status(code: number) {
    this.res.statusCode = code;
  }
}
