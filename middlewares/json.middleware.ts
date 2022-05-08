import { HTTPContext } from "../lib/http/http-context";
import { Middleware } from "../lib/middleware";

export class JSONMiddleware implements Middleware {
  constructor(readonly next?: Middleware) {}

  handle(context: HTTPContext): void {
    // const hash = createHash("sha256");

    // const body = JSON.stringify({
    //   firstName: "Jovan",
    //   lastName: "Djukic",
    //   age: 28
    // });

    // hash.update(body);
    // hash.update(JSON.stringify(context.request.headers));

    // context.response.setHeader("Last-Modified", Date.now());
    // context.response.setHeader("E-Tag", hash.digest("hex"));

    if (this.next) {
      this.next.handle(context);
    }
  }
}
