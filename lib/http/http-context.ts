import type {
	ValidationResult,
	Validator,
} from "@scream.js/validator/validator.js";
export interface HttpContext {
	param(key: string): unknown;
	render(template: unknown, locals?: Record<string, unknown>): Promise<void>;
	redirect(url: string): void;
	notFound(): void;
	validate<T>(validator: Validator<T>): ValidationResult<T>;
}
