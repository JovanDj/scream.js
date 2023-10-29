import { Request } from "./request.js";
import { Response } from "./response.js";

export type Middleware = (req: Request, res: Response) => void;
