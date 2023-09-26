export interface Response {
  json(data: Record<string, unknown>): void;
  end(chunk?: string): void;
  status(code: number): void;
  render(template: unknown, locals: Record<string, unknown>): void;
  location(url: string): void;
  redirect(url: string): void;
}
