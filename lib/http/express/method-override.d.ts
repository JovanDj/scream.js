declare module "method-override" {
	import type { Request, RequestHandler, Response } from "express";

	type MethodGetter = (
		req: Request,
		res: Response,
	) => string | string[] | undefined;

	type MethodOverrideOptions = {
		methods?: string[] | null;
	};

	export default function methodOverride(
		getter?: string | MethodGetter,
		options?: MethodOverrideOptions,
	): RequestHandler;
}
