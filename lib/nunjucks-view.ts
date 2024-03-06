import nunjucks from "nunjucks";
import { FlatObject } from "./flat-object.js";
import { View } from "./view.js";

/**
 * Nunjucks implementation of the View interface.
 */

export class NunjucksView implements View {
  /**
   * Asynchronously renders a template string using Nunjucks.
   * @param template - The template string to render.
   * @param data - The data to render the template with.
   * @returns A promise resolved with the rendered template.
   */
  renderString<T extends FlatObject>(template: string, data: T) {
    return new Promise<string>((resolve, reject) => {
      try {
        resolve(nunjucks.renderString(template, { ...data }));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Asynchronously renders a template file using Nunjucks.
   * @param name - The name or path of the template file.
   * @param data - Optional data for the template.
   * @returns A promise resolved with the rendered template.
   */
  render<T extends object>(name: string, data?: T): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      nunjucks.render(name, data ?? {}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(typeof result === "string" ? result : "");
        }
      });
    });
  }
}
