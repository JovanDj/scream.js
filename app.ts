import { RequestListener } from "http";

const routes = [
  {
    path: "/users",
    method: "GET",
    handler: () => {
      return "GET /users";
    },
  },
];

export const app: RequestListener = (req, res) => {
  try {
    res.end(
      routes
        .find((route) => route.method === req.method && route.path === req.url)
        ?.handler()
    );
  } catch (error) {
    console.error(error);
    res.end(error);
  }
};
