import { RequestListener, IncomingMessage, ServerResponse } from "http";

const routes = [
  {
    path: "/users",
    method: "GET",
    handler: (req: IncomingMessage, res: ServerResponse) => {
      return "GET /users";
    },
  },
];

export const app: RequestListener = (req, res) => {
  try {
    res.end(
      routes
        .find((route) => route.method === req.method && route.path === req.url)
        ?.handler(req, res)
    );
  } catch (error) {
    res.end("test");
  }
};
