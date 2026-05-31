export type RenderErrorOptions = {
	readonly expression?: string | undefined;
	readonly viewName?: string | undefined;
};

export class RenderError extends Error {
	readonly expression: string | undefined;
	readonly renderMessage: string;
	readonly viewName: string | undefined;

	constructor(message: string, options: RenderErrorOptions = {}) {
		const location = options.viewName ? ` in ${options.viewName}` : "";
		const expression = options.expression ? ` "${options.expression}"` : "";
		super(`RenderError: ${message}${expression}${location}`);
		this.expression = options.expression;
		this.renderMessage = message;
		this.viewName = options.viewName;
	}
}
