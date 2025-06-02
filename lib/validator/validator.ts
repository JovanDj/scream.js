export type ValidationError = Record<string, string[]>;

export interface ValidationResult<T> {
	value?: T;
	errors: ValidationError;
}
export interface Validator<T> {
	validate(input: unknown): ValidationResult<T>;
}
