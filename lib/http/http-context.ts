import type { Database, DatabaseTransaction } from "@scream.js/database/db.js";
import type {
	ValidationResult,
	Validator,
} from "@scream.js/validator/validator.js";

export interface HttpContext {
	db(table: string): ReturnType<Database>;
	ref(column: string): ReturnType<Database["ref"]>;
	transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
	param<T>(key: string, validator: Validator<T>): T | undefined;
	body<T>(validator: Validator<T>): ValidationResult<T>;
	query<T>(validator: Validator<T>): ValidationResult<T>;
	render(
		template: string,
		locals?: Record<PropertyKey, unknown>,
	): Promise<void>;
	redirect(url: string): void;
	unprocessableEntity(body?: string): void;
	notFound(): void;
}
