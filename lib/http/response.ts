import { ServerResponse } from "http";

export class Response {
  constructor(private readonly res: ServerResponse) {}

  async json(data: unknown) {
    this.res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(data))
    });

    this.res.write(JSON.stringify(data));
    this.res.end();
  }
}
