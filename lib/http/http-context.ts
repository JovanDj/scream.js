import type {
	ValidationResult,
	Validator,
} from "@scream.js/validator/validator.js";
import type { Request } from "./request.js";
import type { Response } from "./response.js";

export interface HttpContext extends Request, Response {
	validate<T>(validator: Validator<T>): ValidationResult<T>;
}
