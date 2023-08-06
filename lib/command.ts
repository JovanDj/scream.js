export interface Command<T, K> {
  execute(command: T): Promise<K>;
}
