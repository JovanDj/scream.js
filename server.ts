import { Server } from "./lib/http/server.js";
import { app } from "./main.js";

export const server: Server = app.listen(3000, () =>
  console.log("Listening on port 3000"),
);
