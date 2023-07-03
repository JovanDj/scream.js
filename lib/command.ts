export interface Command<T = unknown> {
  execute(command: T): Promise<void>;
}
