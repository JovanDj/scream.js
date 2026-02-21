import type { z } from "zod/v4";

export interface HttpContext {
	param<S extends z.ZodType>(
		key: string,
		schema: (zod: typeof z) => S,
	): z.ZodSafeParseResult<z.output<S>>;
	render(
		template: string,
		locals?: Record<PropertyKey, unknown>,
	): Promise<void>;
	redirect(url: string): void;
	unprocessableEntity(body?: string): void;
	notFound(): void;
	body<S extends z.ZodType>(
		schema: (zod: typeof z) => S,
	): z.ZodSafeParseResult<z.output<S>>;
	query<S extends z.ZodType>(
		schema: (zod: typeof z) => S,
	): z.ZodSafeParseResult<z.output<S>>;
}
