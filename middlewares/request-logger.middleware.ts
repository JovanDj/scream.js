import { HTTPContext } from "../lib/http/http-context";
import { Middleware } from "../lib/middleware";

export class RequestLogger implements Middleware {
  private num = 1;
  constructor(readonly next?: Middleware) {}

  handle(context: HTTPContext): void {
    const { method = "", url = "" } = context.request;
    console.log("RequestLogger middleware");

    const dateFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
      dateStyle: "full",
      timeStyle: "full",
      timeZone: "Europe/Belgrade",
    });
    const date = new Date();

    console.log(`\x1b[4m📗 ${this.num}: ${method} ${url} \x1b[0m`);
    console.log(`\x1b[0m ${dateFormat.format(date)}`);

    this.num++;

    if (this.next) {
      this.next.handle(context);
    }
  }
}
