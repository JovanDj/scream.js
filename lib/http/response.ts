export interface Response {
  json(data: { string: any }): void;
  end(chunk?: string): void;
  status(code: number): void;
  render(template: unknown, locals: { [key: string]: any }): void;
}
