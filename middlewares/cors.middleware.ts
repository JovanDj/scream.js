import { HTTPContext } from "../lib/http/http-context";
import { Middleware } from "../lib/middleware";
export class CorsMiddleware implements Middleware {
  constructor(readonly next?: Middleware) {}

  handle(context: HTTPContext): void {
    console.log("CORS middleware");
    if (this.next) {
      this.next.handle(context);
    }
  }
}
