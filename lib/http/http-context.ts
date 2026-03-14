import type {
	ValidationResult,
	Validator,
} from "@scream.js/validator/validator.js";

export interface HttpContext {
	validateParam<T>(key: string, validator: Validator<T>): ValidationResult<T>;
	validateBody<T>(validator: Validator<T>): ValidationResult<T>;
	validateQuery<T>(validator: Validator<T>): ValidationResult<T>;
	render(
		template: string,
		locals?: Record<PropertyKey, unknown>,
	): Promise<void>;
	redirect(url: string): void;
	unprocessableEntity(body?: string): void;
	notFound(): void;
}
