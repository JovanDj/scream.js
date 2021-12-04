export interface View {
  renderHTML<T>(template: string, data: T): string;
}
