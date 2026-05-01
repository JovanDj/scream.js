export interface HttpContext {
	param(key: string): unknown;
	body(): unknown;
	query(): unknown;
	render(
		template: string,
		locals?: Record<PropertyKey, unknown>,
	): Promise<void>;
	redirect(url: string): void;
	notFound(): void;
}
