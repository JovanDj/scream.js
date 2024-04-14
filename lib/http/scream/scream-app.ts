// src/scream.ts
import http from "node:http";

declare module "http" {
  interface ServerResponse {
    send: (data: Buffer | object | string) => ServerResponse;
  }

  interface IncomingMessage {
    body?: unknown;
  }
}

type Handler = http.RequestListener;

export const scream = () => {
  const routes = new Map<string, Map<string, Handler>>();

  const app = (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (!req.method) {
      return;
    }

    res.send = function (data) {
      if (typeof data === "object") {
        this.setHeader("Content-Type", "application/json");
        this.end(JSON.stringify(data));
      } else if (Buffer.isBuffer(data)) {
        this.setHeader("Content-Type", "application/octet-stream");
        this.end(data);
      } else {
        this.setHeader("Content-Type", "text/plain");
        this.end(data);
      }
      return this;
    };

    const method = req.method.toUpperCase();
    const pathRoutes = routes.get(method) ?? new Map<string, Handler>();
    const handler = pathRoutes.get(req.url ?? "");

    if (method === "POST" && handler) {
      parseBody(req, (body) => {
        req.body = body;
        handler(req, res);
      });
    } else if (handler) {
      handler(req, res);
    } else {
      res.statusCode = 404;
      res.end("Not Found");
    }
  };

  const addRoute = (method: string, path: string, handler: Handler) => {
    if (!routes.has(method)) {
      routes.set(method, new Map());
    }
    const methodRoutes = routes.get(method);
    methodRoutes?.set(path, handler);
  };

  app.get = (path: string, handler: Handler) => addRoute("GET", path, handler);
  app.post = (path: string, handler: Handler) =>
    addRoute("POST", path, handler);

  return app;
};

function parseBody(
  req: http.IncomingMessage,
  callback: (body: unknown) => void
): void {
  const contentType = req.headers["content-type"];
  let body = "";

  req.on("data", (chunk: Buffer) => {
    body += chunk.toString(); // Convert Buffer to string
  });

  req.on("end", () => {
    if (contentType === "application/json") {
      try {
        callback(JSON.parse(body));
      } catch (error) {
        callback(null);
      }
    } else {
      callback(body);
    }
  });
}
