import { FlatObject } from "./flat-object.js";

/**
 * Interface for rendering views.
 */
export interface View {
  /**
   * Renders a template string with provided data.
   * @param template - The template string.
   * @param data - The data object for the template.
   * @returns A promise that resolves to the rendered string.
   */
  renderString<T extends FlatObject>(
    template: string,
    data: T
  ): Promise<string>;

  /**
   * Renders a template file with provided data.
   * @param name - The name or path of the template file.
   * @param data - Optional data object for the template.
   * @returns A promise that resolves to the rendered string.
   */
  render<T extends object>(name: string, data?: T): Promise<string>;
}
