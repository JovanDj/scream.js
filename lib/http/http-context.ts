import type { Request } from "./request.js";
import type { Response } from "./response.js";

export interface HttpContext extends Request, Response {}
