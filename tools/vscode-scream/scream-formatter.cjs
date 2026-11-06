const { TextDocument } = require("vscode-languageserver-textdocument");

class ScreamFormatter {
	#html;

	/** @param {import("vscode-html-languageservice/lib/esm/htmlLanguageService.js").LanguageService} html */
	constructor(html) {
		this.#html = html;
	}

	/**
	 * @param {import("vscode-languageserver-textdocument").TextDocument} document
	 * @param {import("vscode-html-languageservice/lib/esm/htmlLanguageService.js").HTMLFormatConfiguration} options
	 */
	format(document, options) {
		const source = document.getText();
		const protectedTags = (options.contentUnformatted ?? "pre,code,textarea")
			.split(",")
			.map((tag) => tag.trim().toLowerCase());
		const htmlRanges = this.#htmlRanges(
			this.#html.parseHTMLDocument(document).roots,
			protectedTags,
		);
		const ranges = htmlRanges.filter((range) => range.content);
		const tags = [
			...source.matchAll(
				/\{\{(?:"[^"]*"|'[^']*'|(?!\}\})[^'"])*\}\}|\{%(?:"[^"]*"|'[^']*'|(?!%\})[^'"])*%\}/g,
			),
		]
			.filter(
				(match) =>
					!ranges.some(
						(range) => match.index >= range.start && match.index < range.end,
					),
			)
			.map((match) => {
				const text = match[0];
				const start = match.index;
				const end = start + text.length;
				const tokens =
					text.slice(2, -2).match(/"[^"]*"|'[^']*'|[\w]+|[^\s]/g) ?? [];
				const command = text.startsWith("{%") ? tokens[0] : undefined;
				const standalone =
					/^[\t ]*$/.test(
						source.slice(source.lastIndexOf("\n", start - 1) + 1, start),
					) &&
					/^[\t ]*\r?$/.test(
						source.slice(
							end,
							source.indexOf("\n", end) === -1
								? source.length
								: source.indexOf("\n", end),
						),
					);

				return {
					command,
					end,
					formatted: this.#formatTag(text, tokens),
					opensBlock:
						command === "if" ||
						command === "block" ||
						command === "template" ||
						(command === "apply" &&
							!tokens.some(
								(token, index) =>
									token === "to" && index > 1 && tokens[index - 1] !== ".",
							)),
					raw: false,
					standalone,
					start,
				};
			})
			.concat(
				ranges.map((range) => ({
					command: undefined,
					end: range.end,
					formatted: source.slice(range.start, range.end),
					opensBlock: false,
					raw: true,
					standalone: false,
					start: range.start,
				})),
			)
			.sort((left, right) => left.start - right.start);
		const fragments = this.#tagGroups(tags).flatMap((group) => {
			const first = tags[group[0] ?? -1];
			const last = tags[group.at(-1) ?? -1];
			if (
				first?.command !== "if" ||
				last === undefined ||
				!htmlRanges.some(
					(range) =>
						!range.content && first.start > range.start && last.end < range.end,
				)
			) {
				return [];
			}

			const members = tags.filter(
				(tag) => tag.start >= first.start && tag.end <= last.end,
			);
			return [
				{
					command: undefined,
					end: last.end,
					formatted: members
						.map(
							(tag, index) =>
								source.slice(
									members[index - 1]?.end ?? first.start,
									tag.start,
								) + tag.formatted,
						)
						.join(""),
					opensBlock: false,
					raw: true,
					standalone: false,
					start: first.start,
				},
			];
		});
		const outerFragments = fragments.filter(
			(fragment) =>
				!fragments.some(
					(outer) => outer.start < fragment.start && outer.end > fragment.end,
				),
		);
		const segments = tags
			.filter(
				(tag) =>
					!outerFragments.some(
						(fragment) =>
							tag.start >= fragment.start && tag.end <= fragment.end,
					),
			)
			.concat(outerFragments)
			.sort((left, right) => left.start - right.start);
		const indented = this.#tagGroups(segments)
			.filter((group) =>
				group.every((position) => segments[position]?.standalone),
			)
			.flat();
		const prepared =
			segments
				.map(
					(tag, index) =>
						source.slice(segments[index - 1]?.end ?? 0, tag.start) +
						this.#marker(tag, index, indented.includes(index)),
				)
				.join("") + source.slice(segments.at(-1)?.end ?? 0);
		const htmlDocument = TextDocument.create(
			document.uri,
			"html",
			document.version,
			prepared,
		);
		// Handlebars markers let the HTML formatter handle both kinds of nesting.
		const edits = this.#html.format(htmlDocument, undefined, {
			...options,
			indentHandlebars: true,
			templating: ["django", "handlebars"],
			wrapAttributes: "force-expand-multiline",
		});
		const formatted = TextDocument.applyEdits(htmlDocument, edits)
			.replace(
				/\{\{(?:(?:[#/](?:if|scream-(?:block|template|apply))|else) )?scream-format-(\d+)\}\}/g,
				(marker, index) => segments[Number(index)]?.formatted ?? marker,
			)
			.replace(
				/\{%scream-format-content-(\d+)%\}/g,
				(marker, index) => segments[Number(index)]?.formatted ?? marker,
			);

		return formatted === source
			? []
			: [
					{
						newText: formatted,
						range: {
							end: document.positionAt(source.length),
							start: { character: 0, line: 0 },
						},
					},
				];
	}

	/**
	 * @param {import("vscode-html-languageservice/lib/esm/htmlLanguageService.js").Node[]} nodes
	 * @param {string[]} protectedTags
	 * @returns {{start: number, end: number, content: boolean}[]}
	 */
	#htmlRanges(nodes, protectedTags) {
		return nodes.flatMap((node) => {
			const opening = {
				content: false,
				end: node.startTagEnd ?? node.start,
				start: node.start,
			};
			if (protectedTags.includes(node.tag ?? "")) {
				return [
					opening,
					{
						content: true,
						end: node.endTagStart ?? node.end,
						start: node.startTagEnd ?? node.start,
					},
				];
			}

			return [opening, ...this.#htmlRanges(node.children, protectedTags)];
		});
	}

	/** @param {string} text @param {string[]} tokens */
	#formatTag(text, tokens) {
		const body = tokens
			.map((token, index) => {
				const previous = tokens[index - 1];
				if (
					index === 0 ||
					token === "." ||
					token === "(" ||
					token === ")" ||
					token === "," ||
					token === ":" ||
					previous === "." ||
					previous === "("
				) {
					return token;
				}

				return ` ${token}`;
			})
			.join("");

		return `${text.slice(0, 2)} ${body} ${text.slice(-2)}`;
	}

	/** @param {{command: string | undefined, opensBlock: boolean, standalone: boolean}[]} tags */
	#tagGroups(tags) {
		/** @type {{index: number, branches: number[]}[]} */
		const stack = [];
		/** @type {number[][]} */
		const groups = [];

		for (const [index, tag] of tags.entries()) {
			if (tag.opensBlock) {
				stack.push({ branches: [], index });
			} else if (tag.command === "else") {
				stack.at(-1)?.branches.push(index);
			} else if (tag.command?.startsWith("end")) {
				const open = stack.pop();
				if (
					open === undefined ||
					tag.command !== `end${tags[open.index]?.command}`
				) {
					continue;
				}

				groups.push([open.index, ...open.branches, index]);
			}
		}

		return groups;
	}

	/** @param {{command: string | undefined, raw: boolean, standalone: boolean, formatted: string}} tag @param {number} index @param {boolean} indented */
	#marker(tag, index, indented) {
		if (tag.raw) {
			return `{%scream-format-content-${index}%}`;
		}

		const command = tag.command;
		if (command !== undefined && !tag.standalone) {
			return tag.formatted;
		}
		if (!indented) {
			return `{{scream-format-${index}}}`;
		}

		if (command === "else") {
			return `{{else scream-format-${index}}}`;
		}

		const closing = command?.startsWith("end");
		const name = closing ? command?.slice(3) : command;
		const helper = name === "if" ? "if" : `scream-${name}`;
		return `{{${closing ? "/" : "#"}${helper} scream-format-${index}}}`;
	}
}

exports.ScreamFormatter = ScreamFormatter;
