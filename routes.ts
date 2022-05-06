import { Route } from "./lib/router";
import { UsersController } from "./src/users/users.controller";

export const routes: Route[] = [
  {
    path: "/",
    method: "GET",
    handler: async () => {
      const body = {
        _links: {
          self: { href: "/" },
          todos: { href: "http://localhost:3000/todos" }
        }
      };

      return body;
    }
  },
  {
    path: "/users",
    method: "GET",
    handler: async (context: HTTPContext) => {
      console.log("users index");
      return UsersController.index(context);
    }
  }
];
