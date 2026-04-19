import type {
	ValidationResult,
	Validator,
} from "@scream.js/validator/validator.js";

export interface HttpContext {
	param<T>(key: string, validator: Validator<T>): T;
	body<T>(validator: Validator<T>): ValidationResult<T>;
	query<T>(validator: Validator<T>): ValidationResult<T>;
	render(
		template: string,
		locals?: Record<PropertyKey, unknown>,
	): Promise<void>;
	redirect(url: string): void;
	notFound(): void;
}
