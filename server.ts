import { app } from "./main.js";

export const server = app.listen(3000, () =>
  console.log("Listening on port 3000")
);
