import { beforeEach, describe, it, type TestContext } from "node:test";

import { InMemoryFileLoader } from "./in-memory-file-loader.js";
import { Resolver } from "./resolver.js";

describe("Resolver", { concurrency: true }, () => {
	let fileLoader: InMemoryFileLoader;
	let resolver: Resolver;

	beforeEach(() => {
		fileLoader = new InMemoryFileLoader();
		resolver = new Resolver(fileLoader);
	});

	it("resolves a template without inheritance", (t: TestContext) => {
		t.plan(1);
		const template = "<h1>Hello</h1>";

		const result = resolver.resolve(template);

		t.assert.deepStrictEqual<string>(result, "<h1>Hello</h1>");
	});

	it("resolves a template with extends unchanged", (t: TestContext) => {
		t.plan(1);
		const template = `{% extends "layout.scream" %}{% block content %}Child{% endblock %}`;

		const result = resolver.resolve(template);

		t.assert.deepStrictEqual<string>(result, template);
	});

	it("resolves a view by logical name", (t: TestContext) => {
		t.plan(1);
		fileLoader.setTemplate("home.scream", "Hello, {{ name }}!");

		const result = resolver.resolveView("home.scream");

		t.assert.deepStrictEqual<string>(result, "Hello, {{ name }}!");
	});

	it("resolves an empty in-memory template", (t: TestContext) => {
		t.plan(1);
		fileLoader.setTemplate("empty.scream", "");

		const result = resolver.resolveView("empty.scream");

		t.assert.deepStrictEqual<string>(result, "");
	});

	it("rejects view names without a scream extension", (t: TestContext) => {
		t.plan(1);
		fileLoader.setTemplate("home.scream", "Hello");

		const act = () => resolver.resolveView("home");

		t.assert.throws(act, /Invalid view name: home/);
	});

	it("rejects view names with unsupported extensions", (t: TestContext) => {
		t.plan(1);
		fileLoader.setTemplate("home.scream", "Hello");

		const act = () => resolver.resolveView("home.html");

		t.assert.throws(act, /Invalid view name: home\.html/);
	});

	it("rejects relative view traversal", (t: TestContext) => {
		t.plan(1);

		const act = () => resolver.resolveView("../home.scream");

		t.assert.throws(act, /Invalid view name: \.\.\/home\.scream/);
	});
});
