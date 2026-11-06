import { describe, it, type TestContext } from "node:test";
import { load } from "cheerio";
import { createTemplateEngine } from "./template-engine.js";

describe("application skins", () => {
	it("changes the presentation when the compact skin is selected", (t: TestContext) => {
		const context = {
			pagination: {},
			todos: [
				{
					editUrl: "/todos/7/edit",
					showUrl: "/todos/7",
					statusCode: "open",
					title: "Plan review",
				},
			],
		};

		const defaultPage = load(
			createTemplateEngine().renderView("todo/index.scream", context),
		);
		const compactPage = load(
			createTemplateEngine("compact").renderView("todo/index.scream", context),
		);
		const result = {
			compact: compactPage("caption").text(),
			default: defaultPage("caption").text(),
		};

		t.assert.deepStrictEqual<typeof result>(result, {
			compact: "Todo results",
			default: "",
		});
	});
});
