export interface Logger {
  log(message: unknown): void;
  error(message: unknown): void;
}
