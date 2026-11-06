const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const vscode = require("vscode");
const { TextDocument } = require("vscode-languageserver-textdocument");

describe("Scream formatting", () => {
	test("formats HTML around Scream expressions", async (t) => {
		const source = "<section><p>{{ user.name }}</p></section>\n";
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		await vscode.window.showTextDocument(document);
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		const result = await t.waitFor(
			async () => {
				/** @type {import("vscode").TextEdit[] | undefined} */
				const edits = await vscode.commands.executeCommand(
					"vscode.executeFormatDocumentProvider",
					document.uri,
					{ insertSpaces: true, tabSize: 4 },
				);
				assert.ok(edits);
				return TextDocument.applyEdits(original, edits);
			},
			{ timeout: 5000 },
		);

		assert.deepStrictEqual(
			result,
			"<section>\n    <p>{{ user.name }}</p>\n</section>",
		);
	});

	test("preserves textarea whitespace and conditional attributes", async () => {
		const source =
			'<form><textarea name="body">\n{{ fields.body }}</textarea><button{% if cannotSubmit %} disabled{% endif %}>Save</button></form>';
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			'<form><textarea name="body">\n{{ fields.body }}</textarea><button{% if cannotSubmit %} disabled{% endif %}>Save</button>\n</form>',
		);
	});

	test("leaves normal HTML formatting available", async () => {
		const source =
			'<section class="notes" aria-label="Notes"><p>Hello</p></section>\n';
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "html",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"html",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			'<section class="notes" aria-label="Notes">\n    <p>Hello</p>\n</section>',
		);
	});

	test("indents Scream blocks and expands HTML attributes", async () => {
		const source = `{%template noteRow%}
<p>{{attr . title}}</p>
{%endtemplate%}
{%block content%}
<section class="notes" aria-label="Notes">
{%if length ( notes )%}
{%apply notes%}
<a href="{{attr . showUrl}}">{{attr.title}}</a>
{%endapply%}
{%else%}
<p>No notes.</p>
{%endif%}
</section>
{%endblock content%}
`;
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			`{% template noteRow %}
    <p>{{ attr.title }}</p>
{% endtemplate %}
{% block content %}
    <section
        class="notes"
        aria-label="Notes"
    >
        {% if length(notes) %}
            {% apply notes %}
                <a href="{{ attr.showUrl }}">{{ attr.title }}</a>
            {% endapply %}
        {% else %}
            <p>No notes.</p>
        {% endif %}
    </section>
{% endblock content %}`,
		);
	});

	test("keeps inline Scream tags and whitespace-sensitive content in place", async () => {
		const source = `<form>
<input name="title" class="form-control{%if error%} is-invalid{%endif%}" value="{{value}}">
<p>Hello{%if user%}, {{user . name}}{%endif%}!</p>
<textarea name="body">
  {%if value%}
{{value}}
  {%endif%}
</textarea>
<pre>  First line
    Second line</pre>
</form>
`;
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			`<form>
    <input
        name="title"
        class="form-control{% if error %} is-invalid{% endif %}"
        value="{{ value }}"
    >
    <p>Hello{% if user %}, {{ user.name }}{% endif %}!</p>
    <textarea name="body">
  {%if value%}
{{value}}
  {%endif%}
</textarea>
    <pre>  First line
    Second line</pre>
</form>`,
		);
	});

	test("formats scoped includes and named applications without opening a block", async () => {
		const source = `{%include 'shared/field.scream' with value:fields.title,error:errors.title%}
{%apply todos to "todo-row.scream"(csrf:csrfToken)%}
<p>{{length ( todos )}}</p>
`;
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			`{% include 'shared/field.scream' with value: fields.title, error: errors.title %}
{% apply todos to "todo-row.scream"(csrf: csrfToken) %}
<p>{{ length(todos) }}</p>`,
		);
	});

	test("keeps a conditional HTML attribute together when expanding attributes", async () => {
		const source =
			'<button type="submit" class="btn"{%if cannotSubmit%} disabled{%endif%}>Save</button>\n';
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: true, tabSize: 4 },
		);
		assert.ok(edits);
		const result = TextDocument.applyEdits(original, edits);

		assert.deepStrictEqual(
			result,
			`<button
    type="submit"
    class="btn"
    {% if cannotSubmit %} disabled{% endif %}
>Save</button>`,
		);
	});

	test("leaves already formatted Scream blocks unchanged with tab indentation", async () => {
		const source =
			'{% block content %}\n\t<section\n\t\tclass="notes"\n\t\taria-label="Notes"\n\t>\n\t\t{% if length(notes) %}\n\t\t\t{% apply notes %}\n\t\t\t\t<p>{{ attr.title }}</p>\n\t\t\t{% endapply %}\n\t\t{% else %}\n\t\t\t<p>No notes.</p>\n\t\t{% endif %}\n\t</section>\n{% endblock content %}';
		const document = await vscode.workspace.openTextDocument({
			content: source,
			language: "scream",
		});
		const original = TextDocument.create(
			document.uri.toString(),
			"scream",
			1,
			source,
		);

		/** @type {import("vscode").TextEdit[] | undefined} */
		const edits = await vscode.commands.executeCommand(
			"vscode.executeFormatDocumentProvider",
			document.uri,
			{ insertSpaces: false, tabSize: 4 },
		);
		const result = TextDocument.applyEdits(original, edits ?? []);

		assert.deepStrictEqual(result, source);
	});
});
