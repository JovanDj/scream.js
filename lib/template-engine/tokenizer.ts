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
		return this.#tokenize(template, 0, []);
	}

	#tokenize(
		template: string,
		index: number,
		acc: readonly Token[],
	): readonly Token[] {
		if (index >= template.length) {
			return acc;
		}

		if (template.startsWith("{% extends", index)) {
			const endIndex = template.indexOf("%}", index);
			const layoutName = template
				.slice(index + "{% extends".length, endIndex)
				.trim()
				.replaceAll('"', "");

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ type: "extends", value: layoutName },
			]);
		}

		if (template.startsWith("{% block", index)) {
			const endIndex = template.indexOf("%}", index);
			const blockName = template
				.slice(index + "{% block".length, endIndex)
				.trim();

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ type: "block", value: blockName },
			]);
		}

		if (template.startsWith("{% endblock", index)) {
			const endIndex = template.indexOf("%}", index);
			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ type: "endblock", value: "" },
			]);
		}

		if (template.startsWith("{% if", index)) {
			const { token, nextIndex } = this.#extractConditionToken(template, index);
			return this.#tokenize(template, nextIndex, [...acc, token]);
		}

		if (template.startsWith("{% else %}", index)) {
			const { token, nextIndex } = this.#extractElseToken(index);
			return this.#tokenize(template, nextIndex, [...acc, token]);
		}

		if (template.startsWith("{% endif %}", index)) {
			const { token, nextIndex } = this.#extractEndIfToken(index);
			return this.#tokenize(template, nextIndex, [...acc, token]);
		}

		if (this.#isVariableStart(template, index)) {
			const { token, nextIndex } = this.#extractVariableToken(template, index);
			return this.#tokenize(template, nextIndex, [...acc, token]);
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

			if (parts.length !== 3 || parts[1] !== "in")
				throw new Error(
					"Invalid syntax in {% for %} tag. Use '{% for item in collection %}'.",
				);

			const [iterator, , collection] = parts;

			if (!iterator || !collection)
				throw new Error(
					"Invalid {% for %} syntax: Missing iterator or collection.",
				);

			return this.#tokenize(template, endIndex + endTag.length, [
				...acc,
				{ type: "for", value: collection, iterator },
			]);
		}

		if (template.startsWith("{% endfor %}", index)) {
			const endTag = "%}";
			const endIndex = template.indexOf(endTag, index);

			if (endIndex === -1) {
				throw new Error("Unclosed {% endfor %} block in template.");
			}

			return this.#tokenize(template, endIndex + endTag.length, [
				...acc,
				{ type: "endfor", value: "" },
			]);
		}

		const { token, nextIndex } = this.#extractTextToken(template, index);
		return this.#tokenize(template, nextIndex, token ? [...acc, token] : acc);
	}

	#extractConditionToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("%}", startIndex);
		const condition = template.slice(startIndex + 5, endIndex).trim();
		const token: Token = { type: "if", value: condition };

		return { token, nextIndex: endIndex + 2 };
	}

	#extractElseToken(startIndex: number) {
		const token: Token = { type: "else", value: "" };
		return { token, nextIndex: startIndex + 10 };
	}

	#extractEndIfToken(startIndex: number) {
		const token: Token = { type: "endif", value: "" };
		return { token, nextIndex: startIndex + 11 };
	}

	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);

		if (endIndex === -1) {
			const token: Token = { type: "text", value: template.slice(startIndex) };
			return { token, nextIndex: template.length };
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();
		const token: Token = { type: "variable", value: variable };

		return { token, nextIndex: endIndex + 2 };
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

		return { token, nextIndex: endIndex };
	}
}
