import http from "node:http";
import { app } from "./main";

(async () => {
  const server = http.createServer(await app());
  server.listen(3000, () => console.log("Listening on port 3000"));
})();
