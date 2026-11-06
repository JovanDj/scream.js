/** @param {import("vscode").ExtensionContext} context */
async function activate(context) {
	const vscode = require("vscode");
	const { getLanguageService } = await import(
		"vscode-html-languageservice/lib/esm/htmlLanguageService.js"
	);
	const { TextDocument } = require("vscode-languageserver-textdocument");
	const { ScreamFormatter } = require("./scream-formatter.cjs");
	const formatter = new ScreamFormatter(getLanguageService());

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider("scream", {
			provideDocumentFormattingEdits(document, options) {
				const settings = vscode.workspace
					.getConfiguration("html", document)
					.get("format", {});
				const source = TextDocument.create(
					document.uri.toString(),
					"html",
					document.version,
					document.getText(),
				);

				return formatter
					.format(source, {
						...settings,
						...options,
					})
					.map(
						(edit) =>
							new vscode.TextEdit(
								new vscode.Range(
									edit.range.start.line,
									edit.range.start.character,
									edit.range.end.line,
									edit.range.end.character,
								),
								edit.newText,
							),
					);
			},
		}),
	);
}

exports.activate = activate;
