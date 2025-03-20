export type Token =
	| { type: "text"; value: string }
	| { type: "variable" }
	| { type: "if"; condition: string }
	| { type: "else" }
	| { type: "endif" }
	| { type: "for"; iterator: string; collection: string }
	| { type: "endfor" }
	| { type: "extends"; template: string }
	| { type: "block"; name: string }
	| { type: "endblock"; name?: string }
	| { type: "identifier"; name: string }
	| { type: "dot" }
	| { type: "number"; value: number }
	| { type: "string"; value: string };

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

			if (endIndex === -1) {
				throw new Error(
					`Unclosed {% extends %} tag starting at index ${index}`,
				);
			}

			const layoutName = template
				.slice(index + "{% extends".length, endIndex)
				.trim()
				.replaceAll('"', "")
				.replaceAll("'", "");

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ template: layoutName, type: "extends" },
			]);
		}

		if (template.startsWith("{% block", index)) {
			const endIndex = template.indexOf("%}", index);

			if (endIndex === -1) {
				throw new Error(`Unclosed {% block %} tag starting at index ${index}`);
			}

			const blockName = template
				.slice(index + "{% block".length, endIndex)
				.trim();

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ name: blockName, type: "block" },
			]);
		}

		if (template.startsWith("{% endblock", index)) {
			const endIndex = template.indexOf("%}", index);
			if (endIndex === -1) {
				throw new Error(
					`Unclosed {% endblock %} tag starting at index ${index}`,
				);
			}

			const blockName = template
				.slice(index + "{% endblock".length, endIndex)
				.trim();

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ name: blockName, type: "endblock" },
			]);
		}

		if (template.startsWith("{% if", index)) {
			const endIndex = template.indexOf("%}", index);
			if (endIndex === -1) {
				throw new Error(`Unclosed {% if %} tag starting at index ${index}`);
			}

			const condition = template.slice(index + 5, endIndex).trim();
			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ condition: condition, type: "if" },
			]);
		}

		if (template.startsWith("{% else", index)) {
			const endIndex = template.indexOf("%}", index);
			if (endIndex === -1) {
				throw new Error(`Unclosed {% else %} tag starting at index ${index}`);
			}

			return this.#tokenize(template, endIndex + 2, [...acc, { type: "else" }]);
		}

		if (template.startsWith("{% endif", index)) {
			const endIndex = template.indexOf("%}", index);
			if (endIndex === -1) {
				throw new Error(`Unclosed {% endif %} tag starting at index ${index}`);
			}

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ type: "endif" },
			]);
		}

		if (this.#isVariableStart(template, index)) {
			const { token, nextIndex, extraTokens } = this.#extractVariableToken(
				template,
				index,
			);
			return this.#tokenize(template, nextIndex, [
				...acc,
				token,
				...(extraTokens ?? []),
			]);
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
				{ collection, iterator, type: "for" },
			]);
		}

		if (template.startsWith("{% endfor", index)) {
			const endIndex = template.indexOf("%}", index);
			if (endIndex === -1) {
				throw new Error(`Unclosed {% endfor %} tag starting at index ${index}`);
			}

			return this.#tokenize(template, endIndex + 2, [
				...acc,
				{ type: "endfor" },
			]);
		}

		const { token, nextIndex } = this.#extractTextToken(template, index);
		return this.#tokenize(template, nextIndex, token ? [...acc, token] : acc);
	}

	#isVariableStart(template: string, index: number) {
		return template[index] === "{" && template[index + 1] === "{";
	}

	#extractVariableToken(template: string, startIndex: number) {
		const endIndex = template.indexOf("}}", startIndex);

		if (endIndex === -1) {
			const remainder = template.slice(startIndex);

			const closingCount = (remainder.match(/}/g) ?? []).length;

			if (closingCount === 0) {
				throw new Error(
					`Unclosed variable tag starting at index ${startIndex}`,
				);
			}

			return {
				nextIndex: template.length,
				token: { type: "text", value: remainder } satisfies Token,
			};
		}

		const variable = template.slice(startIndex + 2, endIndex).trim();

		const exprTokens = this.#tokenizeExpression(variable);

		return {
			extraTokens: exprTokens,
			nextIndex: endIndex + 2,
			token: { type: "variable" } satisfies Token,
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

		return { nextIndex: endIndex, token };
	}

	#tokenizeExpression(expr: string): Token[] {
		const tokens: Token[] = [];
		let i = 0;

		while (i < expr.length) {
			const char = expr[i];

			if (!char) {
				continue;
			}

			// skip whitespace
			if (/\s/.test(char)) {
				i++;
				continue;
			}

			// identifiers
			if (/[a-zA-Z_]/.test(char)) {
				let ident = "";
				while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i] ?? "")) {
					ident += expr[i++];
				}
				tokens.push({ name: ident, type: "identifier" });
				continue;
			}

			// dot
			if (char === ".") {
				tokens.push({ type: "dot" });
				i++;
				continue;
			}

			// bracketed access
			if (char === "[") {
				i++; // skip '['
				// string key
				if (expr[i] === "'" || expr[i] === '"') {
					const quote = expr[i++];
					let str = "";
					while (i < expr.length && expr[i] !== quote) {
						str += expr[i++];
					}
					i++; // skip closing quote
					tokens.push({ type: "string", value: str });
				}
				// numeric key
				else if (/[0-9]/.test(expr[i] ?? "")) {
					let num = "";
					while (i < expr.length && /[0-9]/.test(expr[i] ?? "")) {
						num += expr[i++];
					}
					tokens.push({ type: "number", value: Number(num) });
				}
				// skip closing bracket
				if (expr[i] === "]") i++;
				continue;
			}

			// numbers (non-bracket)
			if (/[0-9]/.test(char)) {
				let num = "";
				while (i < expr.length && /[0-9]/.test(expr[i] ?? "")) {
					num += expr[i++];
				}
				tokens.push({ type: "number", value: Number(num) });
				continue;
			}

			// strings (standalone)
			if (char === '"' || char === "'") {
				const quote = char;
				let str = "";
				i++; // skip opening
				while (i < expr.length && expr[i] !== quote) {
					str += expr[i++];
				}
				i++; // skip closing
				tokens.push({ type: "string", value: str });
				continue;
			}

			throw new Error(`Unexpected character '${char}' in expression: ${expr}`);
		}

		return tokens;
	}
}
