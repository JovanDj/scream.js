export interface Request {
	params(): Record<string, string>;
	param(key: string): string;
	acceptsLanguages(languages: string[]): string;
}
