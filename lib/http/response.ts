export interface Response {
  json(data: object): void;
  end(chunk?: unknown): void;
  status(code: number): void;
  render(template: unknown, locals?: Record<string, unknown>): Promise<void>;
  location(url: string): void;
  redirect(url: string): void;
  back(): void;
  text(message: string): void;
}
