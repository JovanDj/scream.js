import { IncomingMessage } from "http";
import { HTTPContext } from "../http/http-context";

export type Route = {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  handler: (context: HTTPContext) => void;
};

export class Router {
  private _routes: Route[] = [];

  get routes() {
    return this._routes;
  }

  get(path: Route["path"], handler: Route["handler"]) {
    this._routes.push({ path, handler, method: "GET" });
  }

  post(path: Route["path"], handler: Route["handler"]) {
    this._routes.push({ path, handler, method: "POST" });
  }

  // async match({ url }: { url: HTTPContext["request"]["url"] }) {
  //   const { request, response } = context;

  //   // Iterate over routes array
  //   for (const route of this._routes) {
  //     console.log(route);
  //     // Check if request matches any route

  //     const match = this.compareRoutes(route, request);

  //     if (match) {
  //       response.write(await route.handler(context));

  //       return response.end();
  //     }
  //   }

  //   response.writeHead(404);
  //   return response.end("NOT FOUND");
  // }

  private compareRoutes({ path, method }: Route, request: IncomingMessage) {
    return path === request.url && method === request.method;
  }

  private createUrl(request: IncomingMessage) {
    return new URL(request.url || "/", `http://${request.headers.host}`);
  }
}
