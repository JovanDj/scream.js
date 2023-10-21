import { Request } from "./request.js";
import { Response } from "./response.js";

export interface Middleware {
  (req: Request, res: Response): void;
}
