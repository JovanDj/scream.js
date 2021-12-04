import { View } from "./view";

export class ScreamView implements View {
  renderHTML<T>(template: string, data: T): string {
    throw new Error("Method not implemented.");
  }
}
