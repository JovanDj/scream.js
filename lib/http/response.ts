export interface Response {
	json(data: object): void;
	end(chunk?: unknown): void;
	status(code: number): this;
	render(template: unknown, locals?: Record<string, unknown>): Promise<void>;
	location(url: string): void;
	redirect(url: string): void;
	back(): void;
	text(message: string): void;
	notFound(): void;
	status(code: number): this;
	handleError(error: unknown): void;
	text(message: string): void;
	internalServerError(message: string): void;
}
