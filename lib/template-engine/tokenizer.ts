export type Token =
	| { type: "text"; value: string }
	| { type: "variable"; value: string }
	| { type: "if"; value: string }
	| { type: "else"; value: string }
	| { type: "endif"; value: string }
	| { type: "for"; value: string; iterator: string }
	| { type: "endfor"; value: string }
	| { type: "extends"; value: string }
	| { type: "block"; value: string }
	| { type: "endblock"; value: string };

export class Tokenizer {
	tokenize(template: string) {
		const tokens: Token[] = [];
		let index = 0;

		while (index < template.length) {
			if (template.startsWith("{% extends", index)) {
				const endIndex = template.indexOf("%}", index);
				const layoutName = template
					.slice(index + "{% extends".length, endIndex)
					.trim()
					.replaceAll('"', "");
				tokens.push({ type: "extends", value: layoutName });
				index = endIndex + "%}".length;
				continue;
			}

			if (template.startsWith("{% block", index)) {
				const endIndex = template.indexOf("%}", index);
				const blockName = template
					.slice(index + "{% block".length, endIndex)
					.trim();

				tokens.push({ type: "block", value: blockName });
				index = endIndex + "%}".length;
				continue;
			}

			if (template.startsWith("{% endblock", index)) {
				const endIndex = template.indexOf("%}", index);
				tokens.push({ type: "endblock", value: "" });
				index = endIndex + "%}".length;
				continue;
			}

			if (template.startsWith("{% if", index)) {
				const { token, nextIndex } = this.#extractConditionToken(
					template,
					index,
				);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% else %}", index)) {
				const { token, nextIndex } = this.#extractElseToken(index);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% endif %}", index)) {
				const { token, nextIndex } = this.#extractEndIfToken(index);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (this.#isVariableStart(template, index)) {
				const { token, nextIndex } = this.#extractVariableToken(
					template,
					index,
				);
				tokens.push(token);
				index = nextIndex;
				continue;
			}

			if (template.startsWith("{% for", index)) {
				const startTag = "{% for";
				const endTag = "%}";

				const endIndex = template.indexOf(endTag, index);

				if (endIndex === -1) {
					throw new Error("Unclosed {% for %} block in template.");
				}

				const loopContent = template
					.slice(index + startTag.length, endIndex)
					.trim();

				const parts = loopContent.split(/\s+/);

				if (parts.length !== 3 || parts[1] !== "in") {
					throw new Error(
						"Invalid syntax in {% for %} tag. Use '{% for item in collection %}'.",
					);
				}

				const [iterator, , collection] = parts;

				if (!iterator || !collection) {
					throw new Error(
						"Invalid {% for %} syntax: Missing iterator or collection.",
					);
				}

				const token: Token = { iterator, type: "for", value: collection };

				tokens.push(token);
				index = endIndex + endTag.length;
				continue;
			}

			if (template.startsWith("{% endfor %}", index)) {
				const endTag = "%}";
				const endIndex = template.indexOf(endTag, index);

				if (endIndex === -1) {
					throw new Error("Unclosed {% endfor %} block in template.");
				}

				const token: Token = { type: "endfor", value: "" };

				tokens.push(token);
				index = endIndex + endTag.length;
				continue;
			}

			const { token, nextIndex } = this.#extractTextToken(template, index);

			if (token) {
				tokens.push(token);
			}
			index = nextIndex;
		}

		return tokens;
	}

	#extractConditionToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("%}", startIndex);
		const condition = template.slice(startIndex + 5, endIndex).trim();
		const token: Token = { type: "if", value: condition };

		return {
			nextIndex: endIndex + 2,
			token,
		};
	}

	#extractElseToken(startIndex: number) {
		const token: Token = { type: "else", value: "" };

		return {
			nextIndex: startIndex + 10,
			token,
		};
	}

	#extractEndIfToken(startIndex: number) {
		const token: Token = { type: "endif", value: "" };

		return {
			nextIndex: startIndex + 11,
			token,
		};
	}

	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);
		if (endIndex === -1) {
			const token: Token = {
				type: "text",
				value: template.slice(startIndex),
			};

			return {
				nextIndex: template.length,
				token,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();
		const token: Token = { type: "variable", value: variable || "" };

		return {
			nextIndex: endIndex + 2,
			token,
		};
	}

	#extractTextToken(template: string, startIndex: number) {
		const nextControlIndex = template.indexOf("{%", startIndex);
		const nextVariableIndex = template.indexOf("{{", startIndex);
		const endIndex = Math.min(
			nextControlIndex === -1 ? template.length : nextControlIndex,
			nextVariableIndex === -1 ? template.length : nextVariableIndex,
		);

		const text = template.slice(startIndex, endIndex);

		const token: Token = { type: "text", value: text };

		return {
			nextIndex: endIndex,
			token,
		};
	}
}
