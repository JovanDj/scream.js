export interface Response {
	render(template: unknown, locals?: Record<string, unknown>): Promise<void>;
	redirect(url: string): void;
	notFound(): void;
}
