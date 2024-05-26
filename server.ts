import { createReadStream } from "node:fs";
import { RequestListener, STATUS_CODES, Server, createServer } from "node:http";
import { pipeline } from "node:stream";

interface Todo {
  readonly id: number;
  readonly title: string;
}

const todos: readonly Todo[] = [
  { id: 1, title: "test 1" },
  { id: 2, title: "test 2" },
];

export interface ApplicationOptions {
  port: number;
  callback: () => void;
}

export interface RequestOptions {
  todos: readonly Todo[];
  notFoundStatusCode: number;
  notFoundStatusMessage: string;
  contentLength: (body: string) => number;
  okStatusCode: number;
  okStatusMessage: string;
  notAllowedStatusCode: typeof httpStatus.notAllowed.code;
  notAllowedStatusMessage: typeof httpStatus.notAllowed.message;
  getMethod: typeof httpMethods.GET;
  todoRoute: typeof routes.TODOS;
  jsonMimeType: typeof mimeTypes.json;
  htmlMimeType: typeof mimeTypes.html;
}

export const httpMethods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;

export const routes = {
  TODOS: "/todos",
};

export const mimeTypes = {
  json: "application/json",
  html: "text/html",
} as const;

export const handler = (options: RequestOptions): RequestListener => {
  return (req, res) => {
    if (req.url === options.todoRoute) {
      if (req.method === options.getMethod) {
        if (req.headers.accept?.includes(options.jsonMimeType)) {
          const body = JSON.stringify(options.todos);
          return res
            .writeHead(options.okStatusCode, options.okStatusMessage, {
              "content-length": options.contentLength(body),
              "content-type": options.jsonMimeType,
            })
            .end(body);
        }

        if (req.headers.accept?.includes(options.htmlMimeType)) {
          const body = `
          <!DOCTYPE html>
          <html lang="en">

          <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link rel="stylesheet" href="/styles.css">
              <title>My todos</title>
          </head>

          <body>
              <h1>Todos</h2>
              <ol>
                  <li>${todos[0]?.title ?? ""}</li>
                  <li>${todos[1]?.title ?? ""}</li>
              </ol>
          </body>

          </html>
          `;

          return res
            .writeHead(options.okStatusCode, options.okStatusMessage, {
              "content-length": options.contentLength(body),
              "content-type": options.htmlMimeType,
            })
            .end(body);
        }

        return res
          .writeHead(406, STATUS_CODES[406], {
            accept: "text/html, application/json",
          })
          .end();
      }

      return res
        .writeHead(
          options.notAllowedStatusCode,
          options.notAllowedStatusMessage,
          { allow: "GET" },
        )
        .end();
    }

    if (req.url === "/styles.css") {
      if (req.method === "GET") {
        res.writeHead(200, STATUS_CODES[200], {
          "Content-Type": "text/css",
          allow: "GET",
        });

        return pipeline(createReadStream("styles.css", "utf-8"), res, (err) => {
          if (err) {
            console.error("Pipeline failed:", err);
            res
              .writeHead(500, STATUS_CODES[500], {
                "Content-Type": "text/plain",
              })
              .end(err.cause);
          }
        });
      }

      return res.writeHead(405, STATUS_CODES[405], { allow: "GET" }).end();
    }

    return res
      .writeHead(options.notFoundStatusCode, options.notFoundStatusMessage, {
        "conent-type": "text/html",
      })
      .end(
        `<head>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          <h1 onClick="document.querySelector('h1').remove()">NEMA ZAJEBO SI SE</h1>
        </body>
        `,
      );
  };
};

const httpStatus = {
  notFound: {
    code: 404,
    message: STATUS_CODES[404] ?? "Not Found",
  },

  ok: {
    code: 200,
    message: STATUS_CODES[200] ?? "Ok",
  },
  notAllowed: {
    code: 405,
    message: STATUS_CODES[405] ?? "Not Allowed",
  },
};

const contentLength = (
  body: string,
  encoding: Parameters<typeof Buffer.byteLength>[1] = "utf-8",
) => {
  return Buffer.byteLength(body, encoding);
};

export const start = (options: ApplicationOptions, server: Server) => {
  return server.listen(options.port, options.callback);
};

export const createApplication = () => {
  return createServer(
    handler({
      todos,
      notFoundStatusCode: httpStatus.notFound.code,
      notFoundStatusMessage: httpStatus.notFound.message,
      contentLength,
      okStatusCode: httpStatus.ok.code,
      okStatusMessage: httpStatus.ok.message,
      notAllowedStatusCode: httpStatus.notAllowed.code,
      notAllowedStatusMessage: httpStatus.notAllowed.message,
      getMethod: httpMethods.GET,
      todoRoute: routes.TODOS,
      jsonMimeType: mimeTypes.json,
      htmlMimeType: mimeTypes.html,
    }),
  );
};

start(
  {
    port: 3000,
    callback: () => console.log(`Listening on port: 3000`),
  },
  createApplication(),
);
