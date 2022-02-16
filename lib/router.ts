import { IncomingMessage } from "http";
import { HTTPContext } from "./http/http-context";
export interface Route {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  handler: (context: HTTPContext) => void;
}

export class Router {
  constructor(private readonly _routes: Route[]) {}

  async match(context: HTTPContext) {
    const { request, response } = context;

    // Iterate over routes array
    for (const route of this._routes) {
      console.log(route);
      // Check if request matches any route

      const match = this.compareRoutes(route, request);

      if (match) {
        response.write(route.handler(context));

        return response.end();
      }
    }

    response.writeHead(404);
    return response.end("NOT FOUND");
  }

  private compareRoutes({ path, method }: Route, request: IncomingMessage) {
    return path === request.url && method === request.method;
  }

  private createUrl(request: IncomingMessage) {
    return new URL(request.url || "/", `http://${request.headers.host}`);
  }
}
