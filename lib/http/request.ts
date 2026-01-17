export interface Request {
	param(key: string): unknown;
	acceptsLanguages(languages: string[]): string;
}
