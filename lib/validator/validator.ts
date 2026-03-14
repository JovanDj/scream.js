export type ValidationError = Record<string, string[]>;

export type ValidationResult<T> =
	| {
			success: true;
			data: T;
			value: T;
			errors: ValidationError;
	  }
	| {
			success: false;
			errors: ValidationError;
			data?: undefined;
			value?: undefined;
	  };

export interface Validator<T> {
	validate(input: unknown): ValidationResult<T>;
}
