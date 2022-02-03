import { HTTPContext } from "../lib/http/http-context";
import { Middleware } from "../lib/middleware";
import { createHash } from "crypto";

export class JSONMiddleware implements Middleware {
  constructor(readonly next?: Middleware) {}

  handle(context: HTTPContext): void {
    const hash = createHash("sha256");

    context.response.setHeader("Content-Type", "application/json");

    console.log("JSON middleware");
    const body = JSON.stringify({
      firstName: "Jovan",
      lastName: "Djukic",
      age: 28,
    });

    hash.update(body);
    hash.update(JSON.stringify(context.request.headers));

    context.response.setHeader("Content-Length", Buffer.byteLength(body));
    context.response.setHeader("Last-Modified", Date.now());
    context.response.setHeader("E-Tag", hash.digest("hex"));

    context.response.write(body);

    if (this.next) {
      this.next.handle(context);
    }
  }
}
