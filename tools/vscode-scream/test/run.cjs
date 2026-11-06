const assert = require("node:assert/strict");
const path = require("node:path");
const { run } = require("node:test");
const vscode = require("vscode");

exports.run = async () => {
	const extension = vscode.extensions.getExtension(
		"screamjs-local.scream-syntax",
	);
	assert.ok(extension);
	const htmlExtension = vscode.extensions.getExtension(
		"vscode.html-language-features",
	);
	assert.ok(htmlExtension);
	await htmlExtension.activate();

	const stream = run({
		files: [path.join(__dirname, "formatting.test.cjs")],
		isolation: "none",
	});
	stream.on("data", (event) => {
		if (event.type === "test:fail") {
			console.error(event.data.name, event.data.details.error);
		}
	});
	const results = await stream
		.filter(
			(event) =>
				(event.type === "test:pass" || event.type === "test:fail") &&
				event.data.details.type === "suite",
		)
		.take(1)
		.toArray();
	assert.deepStrictEqual(
		results.map((event) => event.type),
		["test:pass"],
	);
	console.log("Scream formatting extension tests passed.");
};
