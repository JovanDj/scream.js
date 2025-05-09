import type { IncomingHttpHeaders } from "node:http";

export interface Request {
	params(param: string): Record<string, string>;
	body(): unknown;
	method(): string;
	headers(): IncomingHttpHeaders;

	/**
	 * The url of the current route
	 */
	url(): string;
	onClose(cb: () => void): void;
	hasHeader(header: string): boolean;
	acceptsLanguages(languages: string[]): string;
}
