export type SourceSpan = {
	readonly start: number;
	readonly end: number;
};

export type TemplateSyntaxErrorOptions = {
	readonly span?: SourceSpan;
	readonly viewName?: string;
};

export class TemplateSyntaxError extends Error {
	readonly span: SourceSpan | undefined;
	readonly syntaxMessage: string;
	readonly viewName: string | undefined;

	constructor(message: string, options: TemplateSyntaxErrorOptions = {}) {
		const location = options.viewName ? ` in ${options.viewName}` : "";
		const span = options.span
			? ` at ${options.span.start}-${options.span.end}`
			: "";

		super(`TemplateSyntaxError: ${message}${span}${location}`);

		this.span = options.span;
		this.syntaxMessage = message;
		this.viewName = options.viewName;
	}
}
